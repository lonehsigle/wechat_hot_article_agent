import { NextRequest, NextResponse } from 'next/server';
import { getLLMConfig, saveLLMConfig } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  try {
    initDatabase();
    const config = await getLLMConfig();

    if (config) {
      return successResponse({
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        hasApiKey: !!config.apiKey && config.apiKey.length > 0,
        apiKeyHint: config.apiKey && config.apiKey.length > 8
          ? '****' + config.apiKey.slice(-4)
          : '****',
      });
    }

    return successResponse({
      provider: null,
      model: null,
      baseUrl: null,
      hasApiKey: false,
      apiKeyHint: null,
    });
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    return errorResponse('Failed to fetch LLM config');
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  try {
    initDatabase();
    const body = await request.json();

    if (!body.provider) {
      return errorResponse('Provider is required');
    }

    if (!body.model) {
      return errorResponse('Model is required');
    }

    const newApiKey = body.apiKey?.trim();

    await saveLLMConfig({
      provider: body.provider,
      apiKey: newApiKey || undefined,
      model: body.model,
      baseUrl: body.baseUrl || null,
    });

    const updated = await getLLMConfig();

    return successResponse({
      message: newApiKey ? '配置已保存，新密钥已加密存储' : '配置已保存（密钥未变更）',
      apiKeyHint: updated?.apiKey && updated.apiKey.length > 8
        ? '****' + updated.apiKey.slice(-4)
        : '****',
      hasApiKey: !!updated?.apiKey,
    });
  } catch (error: any) {
    console.error('Error saving LLM config:', error);
    return errorResponse(error.message || 'Failed to save LLM config');
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  try {
    initDatabase();
    const { db } = await import('@/lib/db');
    const { llmConfigs } = await import('@/lib/db/schema');
    const searchParams = request.nextUrl.searchParams;
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return errorResponse('请确认删除操作', 400);
    }

    await db().delete(llmConfigs);

    return successResponse({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting LLM config:', error);
    return errorResponse('Failed to delete LLM config');
  }
}
