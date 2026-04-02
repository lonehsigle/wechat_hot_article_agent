import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatDrafts } from '@/lib/db/schema';
import { eq, desc, inArray, and, isNotNull, isNull, sql, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

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

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
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

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function listDrafts(status: string | null, page: number, pageSize: number) {
  const whereCondition = status && status !== 'all' ? eq(wechatDrafts.status, status) : undefined;
  
  const drafts = await db()
    .select()
    .from(wechatDrafts)
    .where(whereCondition)
    .orderBy(desc(wechatDrafts.updateTime))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countQuery = status && status !== 'all'
    ? db().select({ count: sql<number>`count(*)` }).from(wechatDrafts).where(eq(wechatDrafts.status, status))
    : db().select({ count: sql<number>`count(*)` }).from(wechatDrafts);

  const [{ count }] = await countQuery;

  return NextResponse.json({
    success: true,
    drafts,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(Number(count) / pageSize),
  });
}

async function getDraft(id: string | null) {
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const [draft] = await db().select().from(wechatDrafts).where(eq(wechatDrafts.id, parseInt(id)));
  
  if (!draft) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
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
    return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
  }

  const searchTerm = `%${keyword}%`;
  const drafts = await db().select()
    .from(wechatDrafts)
    .where(sql`${wechatDrafts.title} LIKE ${searchTerm} OR ${wechatDrafts.digest} LIKE ${searchTerm}`)
    .orderBy(desc(wechatDrafts.updateTime))
    .limit(50);

  return NextResponse.json({ success: true, drafts });
}

async function syncDrafts() {
  const mockDrafts = generateMockDrafts();

  let added = 0;
  let updated = 0;

  for (const draft of mockDrafts) {
    const existing = await db().select()
      .from(wechatDrafts)
      .where(eq(wechatDrafts.mediaId, draft.mediaId))
      .limit(1);

    if (existing.length > 0) {
      await db().update(wechatDrafts)
        .set({
          title: draft.title,
          author: draft.author,
          digest: draft.digest,
          content: draft.content,
          coverImage: draft.coverImage,
          updateTime: draft.updateTime,
          status: draft.status,
          updatedAt: new Date(),
        })
        .where(eq(wechatDrafts.mediaId, draft.mediaId));
      updated++;
    } else {
      await db().insert(wechatDrafts).values({
        mediaId: draft.mediaId,
        title: draft.title,
        author: draft.author,
        digest: draft.digest,
        content: draft.content,
        coverImage: draft.coverImage,
        status: draft.status,
        createTime: draft.createTime,
        updateTime: draft.updateTime,
        fetchedAt: new Date(),
      });
      added++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `同步完成：新增 ${added} 篇，更新 ${updated} 篇`,
    added,
    updated,
    total: mockDrafts.length,
  });
}

async function deleteDrafts(ids: number[]) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids is required' }, { status: 400 });
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
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (note !== null) updateData.note = note;
  if (status !== null) updateData.status = status;

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

function generateMockDrafts() {
  const titles = [
    '2024年度总结：我的成长与收获',
    '如何高效学习一门新技能',
    '产品经理必备的5个思维模型',
    '我的读书笔记：《原则》',
    '职场新人避坑指南',
    '如何建立个人知识体系',
    '写作技巧分享：如何写出好文章',
    '时间管理方法论',
    '深度工作：如何高效专注',
    '我的健身计划与心得',
  ];

  const authors = ['小明', '运营小助手', '产品观察', '职场笔记', '生活记录'];
  const statuses = ['draft', 'draft', 'draft', 'published', 'pending'];

  return titles.map((title, i) => ({
    mediaId: `draft_${Date.now()}_${i}`,
    title,
    author: authors[i % authors.length],
    digest: `这是《${title}》的摘要内容，主要介绍了相关的核心观点和方法论...`,
    content: `# ${title}\n\n这是文章的正文内容...\n\n## 一、背景介绍\n\n...\n\n## 二、核心内容\n\n...\n\n## 三、总结\n\n...`,
    coverImage: `https://picsum.photos/800/400?random=${i}`,
    status: statuses[i % statuses.length],
    createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updateTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));
}
