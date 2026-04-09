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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return errorResponse('URL参数缺失', 400);
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

    if (action === 'batch-fetch' && urls) {
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
