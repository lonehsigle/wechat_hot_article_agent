import { NextRequest, NextResponse } from 'next/server';
import { getWechatAccounts, getWechatAccountById, getDefaultWechatAccount, createWechatAccount, updateWechatAccount, deleteWechatAccount, setDefaultWechatAccount } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const getDefault = searchParams.get('default');

    if (getDefault === 'true') {
      const account = await getDefaultWechatAccount();
      return successResponse(account);
    }

    if (id) {
      const account = await getWechatAccountById(parseInt(id));
      return successResponse(account);
    }

    const accounts = await getWechatAccounts();
    return successResponse(accounts);
  } catch (error) {
    console.error('Error fetching wechat accounts:', error);
    return errorResponse('Failed to fetch wechat accounts');
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const account = await createWechatAccount(body);
    return successResponse(account);
  } catch (error) {
    console.error('Error creating wechat account:', error);
    return errorResponse('Failed to create wechat account');
  }
}

export async function PUT(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const { id, setDefault, ...data } = body;

    if (!id) {
      return errorResponse('ID is required', 400);
    }

    // 安全：验证账号是否存在
    const existing = await getWechatAccountById(id);
    if (!existing) {
      return errorResponse('账号不存在', 404);
    }

    if (setDefault) {
      await setDefaultWechatAccount(id);
      return successResponse(null);
    }

    const account = await updateWechatAccount(id, data);
    return successResponse(account);
  } catch (error) {
    console.error('Error updating wechat account:', error);
    return errorResponse('Failed to update wechat account');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('ID is required', 400);
    }

    const success = await deleteWechatAccount(parseInt(id));
    return successResponse(success);
  } catch (error) {
    console.error('Error deleting wechat account:', error);
    return errorResponse('Failed to delete wechat account');
  }
}
