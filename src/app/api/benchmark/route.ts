import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { benchmarkAccounts, viralTitles } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const platform = searchParams.get('platform');
    const isLowFollower = searchParams.get('isLowFollower');
    const withTitles = searchParams.get('withTitles');

    const database = db();

    if (accountId && withTitles === 'true') {
      const parsedAccountId = parseInt(accountId);
      if (isNaN(parsedAccountId)) {
        return errorResponse('Invalid accountId', 400);
      }
      const titles = await database
        .select()
        .from(viralTitles)
        .where(eq(viralTitles.benchmarkAccountId, parsedAccountId))
        .orderBy(desc(viralTitles.publishDate));
      return successResponse(titles);
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

    return successResponse(accounts);
  } catch (error) {
    console.error('Benchmark API error:', error);
    return errorResponse(error instanceof Error ? error.message : '操作失败');
  }
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

      return successResponse(account);
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

      return successResponse(title);
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
          keywords: '',
          analysis: null,
          isCollected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      ).returning();

      return successResponse({ count: inserted.length });
    }

    return errorResponse('Unknown action', 400);
  } catch (error) {
    console.error('Benchmark API error:', error);
    return errorResponse(error instanceof Error ? error.message : '操作失败');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body;

    const database = db();

    if (action === 'update-account') {
      const { platform, accountId, accountName, description, avatar, followerCount, tags, isActive } = data || {};
      const [account] = await database
        .update(benchmarkAccounts)
        .set({
          ...(platform !== undefined && { platform }),
          ...(accountId !== undefined && { accountId }),
          ...(accountName !== undefined && { accountName }),
          ...(description !== undefined && { description }),
          ...(avatar !== undefined && { avatar }),
          ...(followerCount !== undefined && { followerCount }),
          ...(tags !== undefined && { tags }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date(),
        })
        .where(eq(benchmarkAccounts.id, id))
        .returning();

      return successResponse(account);
    }

    if (action === 'update-title') {
      const { title, engagementScore, viralScore, analysis, keywords, category } = data || {};
      const [titleRecord] = await database
        .update(viralTitles)
        .set({
          ...(title !== undefined && { title }),
          ...(engagementScore !== undefined && { engagementScore }),
          ...(viralScore !== undefined && { viralScore }),
          ...(analysis !== undefined && { analysis }),
          ...(keywords !== undefined && { keywords }),
          ...(category !== undefined && { category }),
          updatedAt: new Date(),
        })
        .where(eq(viralTitles.id, id))
        .returning();

      return successResponse(titleRecord);
    }

    return errorResponse('Unknown action', 400);
  } catch (error) {
    console.error('Benchmark API error:', error);
    return errorResponse(error instanceof Error ? error.message : '操作失败');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id || !type) {
      return errorResponse('Missing parameters', 400);
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return errorResponse('Invalid id', 400);
    }

    const database = db();

    if (type === 'account') {
      await database.delete(benchmarkAccounts).where(eq(benchmarkAccounts.id, parsedId));
      await database.delete(viralTitles).where(eq(viralTitles.benchmarkAccountId, parsedId));
    } else if (type === 'title') {
      await database.delete(viralTitles).where(eq(viralTitles.id, parsedId));
    }

    return successResponse(null);
  } catch (error) {
    console.error('Benchmark API error:', error);
    return errorResponse(error instanceof Error ? error.message : '删除失败');
  }
}
