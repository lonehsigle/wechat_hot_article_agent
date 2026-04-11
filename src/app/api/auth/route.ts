import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userSessions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'content-monitor-salt').digest('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const database = db();
    const body = await request.json();
    const { action, username, email, password, displayName } = body;

    if (action === 'register') {
      if (!username || !email || !password) {
        return NextResponse.json({ 
          success: false, 
          error: '用户名、邮箱和密码不能为空' 
        }, { status: 400 });
      }

      const existingUser = await database.select().from(users).where(
        eq(users.username, username)
      ).limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: '用户名已存在' 
        }, { status: 400 });
      }

      const existingEmail = await database.select().from(users).where(
        eq(users.email, email)
      ).limit(1);

      if (existingEmail.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: '邮箱已被注册' 
        }, { status: 400 });
      }

      const passwordHash = hashPassword(password);
      const newUser = await database.insert(users).values({
        username,
        email,
        passwordHash,
        displayName: displayName || username,
        role: 'user',
        isActive: true,
      }).returning();

      const token = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION);
      
      await database.insert(userSessions).values({
        userId: newUser[0].id,
        token,
        expiresAt,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: newUser[0].id,
          username: newUser[0].username,
          email: newUser[0].email,
          displayName: newUser[0].displayName,
          avatar: newUser[0].avatar,
          role: newUser[0].role,
        },
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json({ 
          success: false, 
          error: '用户名和密码不能为空' 
        }, { status: 400 });
      }

      const passwordHash = hashPassword(password);
      const user = await database.select().from(users).where(
        and(
          eq(users.username, username),
          eq(users.passwordHash, passwordHash)
        )
      ).limit(1);

      if (user.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: '用户名或密码错误' 
        }, { status: 401 });
      }

      if (!user[0].isActive) {
        return NextResponse.json({ 
          success: false, 
          error: '账号已被禁用' 
        }, { status: 403 });
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION);
      
      await database.insert(userSessions).values({
        userId: user[0].id,
        token,
        expiresAt,
      });

      await database.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user[0].id));

      const response = NextResponse.json({
        success: true,
        user: {
          id: user[0].id,
          username: user[0].username,
          email: user[0].email,
          displayName: user[0].displayName,
          avatar: user[0].avatar,
          role: user[0].role,
        },
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    if (action === 'logout') {
      const token = request.cookies.get('auth_token')?.value;
      
      if (token) {
        await database.delete(userSessions).where(eq(userSessions.token, token));
      }

      const response = NextResponse.json({ success: true });
      response.cookies.delete('auth_token');
      
      return response;
    }

    return NextResponse.json({ 
      success: false, 
      error: '未知操作' 
    }, { status: 400 });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '服务器错误' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const database = db();
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        authenticated: false 
      });
    }

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
      return NextResponse.json({ 
        success: false, 
        authenticated: false 
      });
    }

    const user = await database.select()
      .from(users)
      .where(eq(users.id, session[0].userId))
      .limit(1);

    if (user.length === 0 || !user[0].isActive) {
      return NextResponse.json({ 
        success: false, 
        authenticated: false 
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        displayName: user[0].displayName,
        avatar: user[0].avatar,
        role: user[0].role,
      },
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      success: false, 
      authenticated: false 
    });
  }
}
