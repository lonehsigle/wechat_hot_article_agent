import { NextRequest, NextResponse } from 'next/server';
import { syncAllArticleStats, syncDatacubeDailyStats } from '@/lib/wechat/service';
import { apiResponse } from '@/lib/utils/api-helper';

/**
 * POST /api/analytics/sync
 * 手动触发所有已发布文章的统计数据同步
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { articleIds, force, mode, date } = body;

    if (mode === 'datacube') {
      const syncDate = typeof date === 'string'
        ? date
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const result = await syncDatacubeDailyStats({
        date: syncDate,
        articleIds: Array.isArray(articleIds) ? articleIds.map(Number) : undefined,
        force: !!force,
      });

      return NextResponse.json(apiResponse.success({
        mode: 'datacube',
        date: syncDate,
        synced: result.synced,
        failed: result.failed,
        skipped: result.skipped,
        details: result.details,
      }), { status: result.success ? 200 : 500 });
    }

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
