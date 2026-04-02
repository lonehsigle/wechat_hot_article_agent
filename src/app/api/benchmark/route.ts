import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { benchmarkAccounts, viralTitles } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const platform = searchParams.get('platform');
  const isLowFollower = searchParams.get('isLowFollower');
  const withTitles = searchParams.get('withTitles');

  const database = db();

  if (accountId && withTitles === 'true') {
    const titles = await database
      .select()
      .from(viralTitles)
      .where(eq(viralTitles.benchmarkAccountId, parseInt(accountId)))
      .orderBy(desc(viralTitles.publishDate));
    return NextResponse.json(titles);
  }

  const conditions = [];
  if (platform) {
    conditions.push(eq(benchmarkAccounts.platform, platform));
  }
  if (isLowFollower === 'true') {
    conditions.push(eq(benchmarkAccounts.isLowFollowerViral, true));
  }

  const accounts = await database
    .select()
    .from(benchmarkAccounts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(benchmarkAccounts.createdAt));

  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const database = db();

    if (action === 'create-account') {
      const [account] = await database.insert(benchmarkAccounts).values({
        platform: data.platform,
        accountId: data.accountId,
        accountName: data.accountName,
        avatar: data.avatar || null,
        description: data.description || null,
        followerCount: data.followerCount || 0,
        note: data.note || null,
        tags: data.tags || [],
        isLowFollowerViral: data.isLowFollowerViral || false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return NextResponse.json(account);
    }

    if (action === 'create-title') {
      const [title] = await database.insert(viralTitles).values({
        benchmarkAccountId: data.benchmarkAccountId,
        title: data.title,
        articleUrl: data.articleUrl || null,
        publishDate: data.publishDate || null,
        readCount: data.readCount || 0,
        likeCount: data.likeCount || 0,
        commentCount: data.commentCount || 0,
        shareCount: data.shareCount || 0,
        titleModel: data.titleModel || null,
        painPointLevel: data.painPointLevel || null,
        keywords: data.keywords || [],
        analysis: data.analysis || null,
        isCollected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return NextResponse.json(title);
    }

    if (action === 'batch-create-titles') {
      const titles = data.titles as Array<{
        title: string;
        publishDate?: string;
        readCount?: number;
        likeCount?: number;
      }>;

      const inserted = await database.insert(viralTitles).values(
        titles.map(t => ({
          benchmarkAccountId: data.benchmarkAccountId,
          title: t.title,
          publishDate: t.publishDate || null,
          readCount: t.readCount || 0,
          likeCount: t.likeCount || 0,
          commentCount: 0,
          shareCount: 0,
          titleModel: null,
          painPointLevel: null,
          keywords: [],
          analysis: null,
          isCollected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      ).returning();

      return NextResponse.json({ count: inserted.length });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '操作失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body;

    const database = db();

    if (action === 'update-account') {
      const [account] = await database
        .update(benchmarkAccounts)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(benchmarkAccounts.id, id))
        .returning();

      return NextResponse.json(account);
    }

    if (action === 'update-title') {
      const [title] = await database
        .update(viralTitles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(viralTitles.id, id))
        .returning();

      return NextResponse.json(title);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '操作失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const database = db();

    if (type === 'account') {
      await database.delete(benchmarkAccounts).where(eq(benchmarkAccounts.id, parseInt(id)));
      await database.delete(viralTitles).where(eq(viralTitles.benchmarkAccountId, parseInt(id)));
    } else if (type === 'title') {
      await database.delete(viralTitles).where(eq(viralTitles.id, parseInt(id)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
