import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache, clearExpiredCache } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return errorResponse('Key is required', 400);
    }

    const data = await getCache(key);
    return successResponse(data);
  } catch (error) {
    console.error('Error getting cache:', error);
    return errorResponse('Failed to get cache');
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const { key, data, expiresInSeconds = 86400 } = body;

    if (!key || data === undefined) {
      return errorResponse('Key and data are required', 400);
    }

    await setCache(key, data, expiresInSeconds);
    return successResponse(null);
  } catch (error) {
    console.error('Error setting cache:', error);
    return errorResponse('Failed to set cache');
  }
}

export async function DELETE() {
  try {
    initDatabase();
    await clearExpiredCache();
    return successResponse(null);
  } catch (error) {
    console.error('Error clearing cache:', error);
    return errorResponse('Failed to clear cache');
  }
}
