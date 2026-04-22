import { NextRequest, NextResponse } from 'next/server';
import { syncAllArticleStats } from '@/lib/wechat/service';
import { apiResponse } from '@/lib/utils/api-helper';

/**
 * POST /api/analytics/sync
 * 手动触发所有已发布文章的统计数据同步
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { articleIds, force } = body;

    const result = await syncAllArticleStats({
      articleIds: Array.isArray(articleIds) ? articleIds.map(Number) : undefined,
      force: !!force,
    });

    if (!result.success) {
      return NextResponse.json(
        apiResponse.error(result.error || '同步失败'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      apiResponse.success({
        synced: result.synced,
        failed: result.failed,
        skipped: result.skipped,
        details: result.details,
      })
    );
  } catch (error) {
    console.error('Analytics sync error:', error);
    return NextResponse.json(
      apiResponse.error(error instanceof Error ? error.message : '同步统计数据失败'),
      { status: 500 }
    );
  }
}
