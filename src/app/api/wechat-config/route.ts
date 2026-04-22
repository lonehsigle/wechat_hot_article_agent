import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wechatAccounts } from '@/lib/db/schema';

export async function GET() {
  try {
    const accounts = await db().select().from(wechatAccounts);
    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error('Failed to fetch wechat config:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accounts } = body;

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({ success: false, error: 'Invalid accounts data' }, { status: 400 });
    }

    for (const account of accounts) {
      if (!account.name || typeof account.name !== 'string' || !account.name.trim()) {
        return NextResponse.json({ success: false, error: 'Account name is required' }, { status: 400 });
      }

      if (account.id) {
        const existing = await db()
          .select()
          .from(wechatAccounts)
          .where(eq(wechatAccounts.id, account.id))
          .limit(1);

        if (existing.length > 0) {
          await db()
            .update(wechatAccounts)
            .set({
              name: account.name,
              appId: account.appId,
              appSecret: account.appSecret,
              authorName: account.authorName,
              isDefault: account.isDefault || false,
              targetAudience: account.targetAudience || null,
              readerPersona: account.readerPersona || null,
              contentStyle: account.contentStyle || null,
              mainTopics: account.mainTopics || null,
              tonePreference: account.tonePreference || null,
              updatedAt: new Date(),
            })
            .where(eq(wechatAccounts.id, account.id));
          continue;
        }
      }
      
      await db().insert(wechatAccounts).values({
        name: account.name,
        appId: account.appId,
        appSecret: account.appSecret,
        authorName: account.authorName,
        isDefault: account.isDefault || false,
        targetAudience: account.targetAudience || null,
        readerPersona: account.readerPersona || null,
        contentStyle: account.contentStyle || null,
        mainTopics: account.mainTopics || null,
        tonePreference: account.tonePreference || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, message: 'Wechat config saved' });
  } catch (error) {
    console.error('Failed to save wechat config:', error);
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await db().delete(wechatAccounts).where(eq(wechatAccounts.id, parsedId));
    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Failed to delete wechat account:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
  }
}
