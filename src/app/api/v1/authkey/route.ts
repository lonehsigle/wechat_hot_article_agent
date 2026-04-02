import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wechatSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('auth_key') || 
                  request.headers.get('x-auth-key');

  if (!authKey) {
    return NextResponse.json({
      code: -1,
      msg: 'auth_key is required',
    });
  }

  const sessions = await db()
    .select()
    .from(wechatSessions)
    .where(eq(wechatSessions.authKey, authKey))
    .limit(1);

  if (sessions.length > 0 && sessions[0].status === 'active') {
    return NextResponse.json({
      code: 0,
      data: authKey,
      nickname: sessions[0].nickname,
      avatar: sessions[0].avatar,
    });
  } else {
    return NextResponse.json({
      code: -1,
      msg: 'AuthKey not found or expired',
    });
  }
}
