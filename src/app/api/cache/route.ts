import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache, clearExpiredCache } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }
    
    const data = await getCache(key);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error getting cache:', error);
    return NextResponse.json({ error: 'Failed to get cache' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const { key, data, expiresInSeconds = 86400 } = body;
    
    if (!key || data === undefined) {
      return NextResponse.json({ error: 'Key and data are required' }, { status: 400 });
    }
    
    await setCache(key, data, expiresInSeconds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting cache:', error);
    return NextResponse.json({ error: 'Failed to set cache' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    initDatabase();
    await clearExpiredCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
