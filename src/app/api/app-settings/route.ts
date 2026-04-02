import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');

  try {
    if (key) {
      const result = await db()
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ success: true, value: null });
      }

      return NextResponse.json({ 
        success: true, 
        value: JSON.parse(result[0].value) 
      });
    } else {
      const results = await db().select().from(appSettings);
      const settings: Record<string, unknown> = {};
      
      for (const row of results) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }

      return NextResponse.json({ success: true, settings });
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ 
        success: false, 
        error: 'key is required' 
      }, { status: 400 });
    }

    const valueStr = JSON.stringify(value);

    const existing = await db()
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db()
        .update(appSettings)
        .set({ 
          value: valueStr, 
          updatedAt: new Date() 
        })
        .where(eq(appSettings.key, key));
    } else {
      await db()
        .insert(appSettings)
        .values({ 
          key, 
          value: valueStr, 
          updatedAt: new Date() 
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');

  if (!key) {
    return NextResponse.json({ 
      success: false, 
      error: 'key is required' 
    }, { status: 400 });
  }

  try {
    await db()
      .delete(appSettings)
      .where(eq(appSettings.key, key));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
