import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { monitorCategories } from '@/lib/db/schema';

export async function GET() {
  try {
    const categories = await db().select().from(monitorCategories);
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Failed to fetch monitor config:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ success: false, error: 'Invalid categories data' }, { status: 400 });
    }

    for (const category of categories) {
      const existing = await db()
        .select()
        .from(monitorCategories)
        .where((t: any) => t.id.eq(category.id))
        .limit(1);

      if (existing.length > 0) {
        await db()
          .update(monitorCategories)
          .set({
            name: category.name,
            platforms: category.platforms || [],
            keywords: category.keywords || [],
            creators: category.creators || [],
            updatedAt: new Date(),
          })
          .where(eq(monitorCategories.id, category.id));
      } else {
        await db().insert(monitorCategories).values({
          id: category.id,
          name: category.name,
          platforms: category.platforms || [],
          keywords: category.keywords || [],
          creators: category.creators || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Monitor config saved' });
  } catch (error) {
    console.error('Failed to save monitor config:', error);
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 });
  }
}
