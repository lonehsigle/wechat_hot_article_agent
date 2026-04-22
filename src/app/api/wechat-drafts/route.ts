import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatDrafts } from '@/lib/db/schema';
import { eq, desc, inArray, and, sql, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    if (action === 'list') {
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '20');
      return await listDrafts(status, page, pageSize);
    }

    if (action === 'get') {
      const id = searchParams.get('id');
      return await getDraft(id);
    }

    if (action === 'stats') {
      return await getDraftStats();
    }

    if (action === 'search') {
      const keyword = searchParams.get('keyword');
      return await searchDrafts(keyword);
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Wechat drafts GET error:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'sync') {
      return await syncDrafts();
    }

    if (action === 'delete') {
      const { ids } = body;
      return await deleteDrafts(ids);
    }

    if (action === 'batch-delete') {
      const { ids, status, olderThan } = body;
      if (ids && Array.isArray(ids) && ids.length > 0) {
        return await deleteDrafts(ids);
      }
      return await batchDeleteDrafts(status, olderThan);
    }

    if (action === 'update') {
      const { id, note, status } = body;
      return await updateDraft(id, note, status);
    }

    if (action === 'clear-all') {
      return await clearAllDrafts();
    }

    if (action === 'clear-published') {
      return await clearPublishedDrafts();
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Wechat drafts POST error:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}

async function listDrafts(status: string | null, page: number, pageSize: number) {
  const hasStatusFilter = status && status !== 'all';

  let draftsQuery = db()
    .select()
    .from(wechatDrafts)
    .$dynamic();

  if (hasStatusFilter) {
    draftsQuery = draftsQuery.where(eq(wechatDrafts.status, status!));
  }

  const drafts = await draftsQuery
    .orderBy(desc(wechatDrafts.updateTime))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countResult = hasStatusFilter
    ? await db().select({ count: sql<number>`count(*)` }).from(wechatDrafts).where(eq(wechatDrafts.status, status!))
    : await db().select({ count: sql<number>`count(*)` }).from(wechatDrafts);

  const count = Number(countResult[0].count);

  return NextResponse.json({
    success: true,
    drafts,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  });
}

async function getDraft(id: string | null) {
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return NextResponse.json({ success: false, error: 'id must be a number' }, { status: 400 });
  }

  const [draft] = await db().select().from(wechatDrafts).where(eq(wechatDrafts.id, parsedId));
  
  if (!draft) {
    return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, draft });
}

async function getDraftStats() {
  const total = await db().select({ count: sql<number>`count(*)` }).from(wechatDrafts);
  const draftCount = await db().select({ count: sql<number>`count(*)` }).from(wechatDrafts).where(eq(wechatDrafts.status, 'draft'));
  const publishedCount = await db().select({ count: sql<number>`count(*)` }).from(wechatDrafts).where(eq(wechatDrafts.status, 'published'));
  const pendingCount = await db().select({ count: sql<number>`count(*)` }).from(wechatDrafts).where(eq(wechatDrafts.status, 'pending'));

  const oldestDraft = await db().select()
    .from(wechatDrafts)
    .where(eq(wechatDrafts.status, 'draft'))
    .orderBy(wechatDrafts.createTime)
    .limit(1);

  return NextResponse.json({
    success: true,
    stats: {
      total: Number(total[0].count),
      draft: Number(draftCount[0].count),
      published: Number(publishedCount[0].count),
      pending: Number(pendingCount[0].count),
      oldestDraft: oldestDraft[0]?.createTime || null,
    },
  });
}

async function searchDrafts(keyword: string | null) {
  if (!keyword) {
    return NextResponse.json({ success: false, error: 'keyword is required' }, { status: 400 });
  }

  const sanitizedKeyword = keyword.replace(/[%_\\]/g, '\\$&');
  const searchTerm = `%${sanitizedKeyword}%`;
  const drafts = await db().select()
    .from(wechatDrafts)
    .where(sql`${wechatDrafts.title} LIKE ${searchTerm} OR ${wechatDrafts.digest} LIKE ${searchTerm}`)
    .orderBy(desc(wechatDrafts.updateTime))
    .limit(50);

  return NextResponse.json({ success: true, drafts });
}

async function syncDrafts() {
  return NextResponse.json({
    success: false,
    error: '草稿同步功能需要配置微信公众号授权，请先在公众号管理中完成授权',
  });
}

async function deleteDrafts(ids: number[]) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ success: false, error: 'ids is required' }, { status: 400 });
  }

  await db().delete(wechatDrafts).where(inArray(wechatDrafts.id, ids));

  return NextResponse.json({
    success: true,
    message: `已删除 ${ids.length} 篇草稿`,
    deletedCount: ids.length,
  });
}

async function batchDeleteDrafts(status: string | null, olderThan: number | null) {
  const conditions: SQL<unknown>[] = [];
  
  if (status) {
    conditions.push(eq(wechatDrafts.status, status));
  }

  if (olderThan) {
    const cutoffDate = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);
    conditions.push(sql`${wechatDrafts.createTime} < ${cutoffDate}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const toDelete = await db().select({ id: wechatDrafts.id })
    .from(wechatDrafts)
    .where(whereClause);

  if (toDelete.length === 0) {
    return NextResponse.json({
      success: true,
      message: '没有符合条件的草稿',
      deletedCount: 0,
    });
  }

  const ids = toDelete.map(d => d.id);
  await db().delete(wechatDrafts).where(inArray(wechatDrafts.id, ids));

  return NextResponse.json({
    success: true,
    message: `已删除 ${ids.length} 篇草稿`,
    deletedCount: ids.length,
  });
}

async function updateDraft(id: number, note: string | null, status: string | null) {
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const validStatuses = ['draft', 'published', 'pending'];
  const updateData: Partial<typeof wechatDrafts.$inferInsert> = { updatedAt: new Date() };
  if (note !== null && note !== undefined) updateData.note = note;
  if (status !== null && status !== undefined) {
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }
    updateData.status = status;
  }

  const [draft] = await db().update(wechatDrafts)
    .set(updateData)
    .where(eq(wechatDrafts.id, id))
    .returning();

  return NextResponse.json({ success: true, draft });
}

async function clearAllDrafts() {
  const result = await db().delete(wechatDrafts);

  return NextResponse.json({
    success: true,
    message: '已清空所有草稿',
  });
}

async function clearPublishedDrafts() {
  const toDelete = await db().select({ id: wechatDrafts.id })
    .from(wechatDrafts)
    .where(eq(wechatDrafts.status, 'published'));

  if (toDelete.length === 0) {
    return NextResponse.json({
      success: true,
      message: '没有已发布的草稿',
      deletedCount: 0,
    });
  }

  const ids = toDelete.map(d => d.id);
  await db().delete(wechatDrafts).where(inArray(wechatDrafts.id, ids));

  return NextResponse.json({
    success: true,
    message: `已清理 ${ids.length} 篇已发布草稿`,
    deletedCount: ids.length,
  });
}

// generateMockDrafts 已移除 - 草稿同步功能需要配置微信公众号授权后实现
// function generateMockDrafts() { ... }
