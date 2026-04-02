import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDeepContent,
  batchFetchDeepContent,
  formatContentForMaterial,
  DeepContent,
} from '@/lib/crawler/service';
import { db } from '@/lib/db';
import { materialLibrary } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL参数缺失' }, { status: 400 });
  }

  try {
    const content = await fetchDeepContent(url);
    return NextResponse.json(content);
  } catch (error) {
    console.error('Deep fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '抓取失败' },
      { status: 500 }
    );
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

        return NextResponse.json({
          ...content,
          materialId: material.id,
          saved: true,
        });
      }

      return NextResponse.json(content);
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

        return NextResponse.json({
          contents,
          savedCount: inserted.length,
        });
      }

      return NextResponse.json({ contents });
    }

    if (action === 'preview' && url) {
      const content = await fetchDeepContent(url);
      
      return NextResponse.json({
        url: content.url,
        title: content.title,
        summary: content.summary,
        keyPoints: content.keyPoints,
        quotes: content.quotes,
        dataPoints: content.dataPoints,
        source: content.source,
      });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Deep fetch API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '操作失败' },
      { status: 500 }
    );
  }
}
