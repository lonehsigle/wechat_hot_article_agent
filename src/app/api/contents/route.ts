import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contents } from '@/lib/db/schema';
import { desc, isNotNull, sql, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await db()
      .select({
        id: contents.id,
        title: contents.title,
        author: contents.author,
        readCount: contents.readCount,
        likeCount: contents.likes,
        digest: contents.digest,
        date: contents.date,
        url: contents.url,
      })
      .from(contents)
      .where(isNotNull(contents.title))
      .orderBy(desc(contents.readCount))
      .limit(limit)
      .offset(offset);

    const totalResult = await db()
      .select({ count: sql<number>`count(*)` })
      .from(contents)
      .where(isNotNull(contents.title));

    return NextResponse.json({
      contents: result.map(item => ({
        ...item,
        readCount: item.readCount || 0,
        likeCount: item.likeCount || 0,
      })),
      total: totalResult[0]?.count || 0,
    });
  } catch (error) {
    console.error('[Contents API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
