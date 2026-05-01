import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contents } from '@/lib/db/schema';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsedLimit = parseInt(searchParams.get('limit') || '100', 10);
    const parsedOffset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 100;
    const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    const categoryIdParam = searchParams.get('categoryId');
    const parsedCategoryId = categoryIdParam ? parseInt(categoryIdParam, 10) : null;

    if (categoryIdParam && (!Number.isInteger(parsedCategoryId) || parsedCategoryId === null || parsedCategoryId <= 0)) {
      return errorResponse('Invalid categoryId', 400);
    }

    const whereClause = parsedCategoryId
      ? and(isNotNull(contents.title), eq(contents.categoryId, parsedCategoryId))
      : isNotNull(contents.title);

    const result = await db()
      .select({
        id: contents.id,
        categoryId: contents.categoryId,
        platform: contents.platform,
        title: contents.title,
        author: contents.author,
        readCount: contents.readCount,
        likeCount: contents.likes,
        commentCount: contents.comments,
        shareCount: contents.shares,
        digest: contents.digest,
        content: contents.content,
        date: contents.date,
        url: contents.url,
        fetchedAt: contents.fetchedAt,
      })
      .from(contents)
      .where(whereClause)
      .orderBy(desc(contents.readCount))
      .limit(limit)
      .offset(offset);

    const totalResult = await db()
      .select({ count: sql<number>`count(*)` })
      .from(contents)
      .where(whereClause);

    return successResponse({
      contents: result.map(item => ({
        ...item,
        readCount: item.readCount || 0,
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0,
        shareCount: item.shareCount || 0,
      })),
      total: totalResult[0]?.count || 0,
    });
  } catch (error) {
    console.error('[Contents API] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}
