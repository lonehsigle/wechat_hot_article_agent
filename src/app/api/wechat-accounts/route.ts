import { NextRequest, NextResponse } from 'next/server';
import { getWechatAccounts, getWechatAccountById, getDefaultWechatAccount, createWechatAccount, updateWechatAccount, deleteWechatAccount, setDefaultWechatAccount } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const getDefault = searchParams.get('default');
    
    if (getDefault === 'true') {
      const account = await getDefaultWechatAccount();
      return NextResponse.json(account);
    }
    
    if (id) {
      const account = await getWechatAccountById(parseInt(id));
      return NextResponse.json(account);
    }
    
    const accounts = await getWechatAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching wechat accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch wechat accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const account = await createWechatAccount(body);
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating wechat account:', error);
    return NextResponse.json({ error: 'Failed to create wechat account' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const { id, setDefault, ...data } = body;
    
    if (setDefault) {
      await setDefaultWechatAccount(id);
      return NextResponse.json({ success: true });
    }
    
    const account = await updateWechatAccount(id, data);
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating wechat account:', error);
    return NextResponse.json({ error: 'Failed to update wechat account' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const success = await deleteWechatAccount(parseInt(id));
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting wechat account:', error);
    return NextResponse.json({ error: 'Failed to delete wechat account' }, { status: 500 });
  }
}
