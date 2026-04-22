import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userSessions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface AuthResult {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    email: string | null;
    displayName: string | null;
    avatar: string | null;
    role: string;
  };
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return { authenticated: false, error: '未登录' };
    }

    const database = db();
    const session = await database.select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.token, token),
          gt(userSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (session.length === 0) {
      return { authenticated: false, error: '会话已过期' };
    }

    const user = await database.select()
      .from(users)
      .where(eq(users.id, session[0].userId))
      .limit(1);

    if (user.length === 0 || !user[0].isActive) {
      return { authenticated: false, error: '账号已被禁用' };
    }

    return {
      authenticated: true,
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        displayName: user[0].displayName,
        avatar: user[0].avatar,
        role: user[0].role ?? 'user',
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authenticated: false, error: '认证验证失败' };
  }
}

export function unauthorizedResponse(message: string = '请先登录') {
  return NextResponse.json(
    { success: false, error: message, authenticated: false },
    { status: 401 }
  );
}
