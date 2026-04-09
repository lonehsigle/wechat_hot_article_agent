import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { materialLibrary } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const topicId = searchParams.get('topicId');
    const unused = searchParams.get('unused');

    const database = db();

    const conditions = [];
    if (type) {
      conditions.push(eq(materialLibrary.type, type));
    }
    if (topicId) {
      conditions.push(eq(materialLibrary.topicId, parseInt(topicId)));
    }
    if (unused === 'true') {
      conditions.push(eq(materialLibrary.isUsed, false));
    }

    const materials = await database
      .select()
      .from(materialLibrary)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materialLibrary.createdAt));

    return successResponse(materials);
  } catch (error) {
    console.error('Material API error:', error);
    return errorResponse(error instanceof Error ? error.message : '操作失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const database = db();

    if (action === 'create') {
      const [material] = await database.insert(materialLibrary).values({
        type: data.type,
        source: data.source,
        sourceUrl: data.sourceUrl || null,
        title: data.title,
        content: data.content,
        keyPoints: data.keyPoints || [],
        quotes: data.quotes || [],
        dataPoints: data.dataPoints || [],
        tags: data.tags || [],
        topicId: data.topicId || null,
        isUsed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return successResponse(material);
    }

    if (action === 'batch-create') {
      const materials = data.materials as Array<{
        type: string;
        source: string;
        title: string;
        content: string;
        keyPoints?: string[];
        quotes?: string[];
        dataPoints?: string[];
        tags?: string[];
      }>;

      const inserted = await database.insert(materialLibrary).values(
        materials.map(m => ({
          type: m.type,
          source: m.source,
          sourceUrl: null,
          title: m.title,
          content: m.content,
          keyPoints: m.keyPoints || [],
          quotes: m.quotes || [],
          dataPoints: m.dataPoints || [],
          tags: m.tags || [],
          topicId: null,
          isUsed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      ).returning();

      return successResponse({ count: inserted.length });
    }

    if (action === 'mark-used') {
      const [material] = await database
        .update(materialLibrary)
        .set({ isUsed: true, updatedAt: new Date() })
        .where(eq(materialLibrary.id, data.id))
        .returning();

      return successResponse(material);
    }

    return errorResponse('Unknown action', 400);
  } catch (error) {
    console.error('Material API error:', error);
    return errorResponse(error instanceof Error ? error.message : '操作失败');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data } = body;

    const database = db();

    const [material] = await database
      .update(materialLibrary)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(materialLibrary.id, id))
      .returning();

    return successResponse(material);
  } catch (error) {
    console.error('Material API error:', error);
    return errorResponse(error instanceof Error ? error.message : '更新失败');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Missing id', 400);
    }

    const database = db();
    await database.delete(materialLibrary).where(eq(materialLibrary.id, parseInt(id)));

    return successResponse(null);
  } catch (error) {
    console.error('Material API error:', error);
    return errorResponse(error instanceof Error ? error.message : '删除失败');
  }
}
