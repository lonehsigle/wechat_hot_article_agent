import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDeepContent,
  batchFetchDeepContent,
  formatContentForMaterial,
  DeepContent,
} from '@/lib/crawler/service';
import { db } from '@/lib/db';
import { materialLibrary } from '@/lib/db/schema';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254'];

function isUrlSafe(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    return !BLOCKED_HOSTS.some(blocked => hostname === blocked || hostname.endsWith(`.${blocked}`));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return errorResponse('URL参数缺失', 400);
  }

  if (!isUrlSafe(url)) {
    return errorResponse('不允许访问该URL', 400);
  }

  try {
    const content = await fetchDeepContent(url);
    return successResponse(content);
  } catch (error) {
    console.error('Deep fetch error:', error);
    return errorResponse(error instanceof Error ? error.message : '抓取失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, url, urls, saveToLibrary } = body;

    if (action === 'fetch' && url) {
      if (!isUrlSafe(url)) {
        return errorResponse('不允许访问该URL', 400);
      }
      const content = await fetchDeepContent(url);

      if (saveToLibrary) {
        const materialData = formatContentForMaterial(content);
        const database = db();

        const [material] = await database.insert(materialLibrary).values({
          ...materialData,
          isUsed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        return successResponse({
          ...content,
          materialId: material.id,
          saved: true,
        });
      }

      return successResponse(content);
    }

    if (action === 'batch-fetch' && urls && Array.isArray(urls) && urls.length > 0) {
      const unsafeUrls = urls.filter((u: string) => !isUrlSafe(u));
      if (unsafeUrls.length > 0) {
        return errorResponse(`不允许访问以下URL: ${unsafeUrls.join(', ')}`, 400);
      }
      const contents = await batchFetchDeepContent(urls);

      if (saveToLibrary) {
        const database = db();
        const materials = contents.map(c => formatContentForMaterial(c));

        const inserted = await database.insert(materialLibrary).values(
          materials.map(m => ({
            ...m,
            isUsed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        ).returning();

        return successResponse({
          contents,
          savedCount: inserted.length,
        });
      }

      return successResponse({ contents });
    }

    if (action === 'preview' && url) {
      const content = await fetchDeepContent(url);

      return successResponse({
        url: content.url,
        title: content.title,
        summary: content.summary,
        keyPoints: content.keyPoints,
        quotes: content.quotes,
        dataPoints: content.dataPoints,
        source: content.source,
      });
    }

    return errorResponse('未知操作', 400);
  } catch (error) {
    console.error('Deep fetch API error:', error);
    return errorResponse(error instanceof Error ? error.message : '操作失败');
  }
}
