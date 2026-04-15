import { NextRequest, NextResponse } from 'next/server';
import { getLLMConfig, saveLLMConfig } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { llmConfigs } from '@/lib/db/schema';
import { initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { eq } from 'drizzle-orm';

// GET - 只返回配置信息，NEVER返回实际API Key
export async function GET() {
  try {
    initDatabase();
    const config = await getLLMConfig();

    // 安全：永远不返回实际API Key
    if (config) {
      return successResponse({
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        // 只返回是否已配置，不返回实际密钥
        hasApiKey: !!config.apiKey && config.apiKey.length > 0,
        // 返回部分掩码用于识别（如最后4位）
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

// POST - 保存配置（会加密API Key）
// 如果未提供apiKey，则保留原配置
export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();

    // 安全验证
    if (!body.provider) {
      return errorResponse('Provider is required');
    }

    if (!body.model) {
      return errorResponse('Model is required');
    }

    const currentResult = await db().select().from(llmConfigs).limit(1);
    const current = currentResult[0];

    // 如果提供了新API Key（且非空），则加密保存
    // 如果没有提供apiKey或为空，保留原配置
    const newApiKey = body.apiKey?.trim();
    let apiKeyToSave = '';
    if (newApiKey && newApiKey.length > 0) {
      apiKeyToSave = newApiKey;
    } else if (current) {
      // 保留原密钥 - 直接更新其他字段，保留apiKey
      await db().update(llmConfigs).set({
        provider: body.provider,
        model: body.model,
        baseUrl: body.baseUrl || null,
        updatedAt: new Date(),
      }).where(eq(llmConfigs.id, current.id));

      return successResponse({
        message: 'Configuration updated successfully (API key unchanged)',
        apiKeyHint: current.apiKey && current.apiKey.length > 8
          ? '****' + current.apiKey.slice(-4)
          : '****',
        hasApiKey: true,
      });
    } else {
      // 新建配置但没有API Key
      return errorResponse('API Key is required for initial configuration');
    }

    await saveLLMConfig({
      provider: body.provider,
      apiKey: apiKeyToSave,
      model: body.model,
      baseUrl: body.baseUrl || null,
    });

    return successResponse({
      message: 'Configuration saved successfully',
      // 返回掩码信息而不是实际密钥
      apiKeyHint: apiKeyToSave.length > 8
        ? '****' + apiKeyToSave.slice(-4)
        : '****',
      hasApiKey: true,
    });
  } catch (error) {
    console.error('Error saving LLM config:', error);
    return errorResponse('Failed to save LLM config');
  }
}

// DELETE - 删除配置（用于重置）
export async function DELETE() {
  try {
    initDatabase();
    await db().delete(llmConfigs);

    return successResponse({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting LLM config:', error);
    return errorResponse('Failed to delete LLM config');
  }
}

// PATCH - 部分更新（只更新提供的字段）
export async function PATCH(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();

    const currentResult = await db().select().from(llmConfigs).limit(1);
    const current = currentResult[0];

    if (!current) {
      return errorResponse('No configuration exists. Use POST to create.');
    }

    // 类型安全的更新数据
    const updateData: Partial<{
      provider: string;
      model: string;
      baseUrl: string | null;
      apiKey: string;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (body.provider) updateData.provider = body.provider;
    if (body.model) updateData.model = body.model;
    if (body.baseUrl !== undefined) updateData.baseUrl = body.baseUrl || null;

    // 如果提供了新API Key，则加密保存
    if (body.apiKey && body.apiKey.trim()) {
      updateData.apiKey = body.apiKey.trim();
    }

    await db().update(llmConfigs).set(updateData).where(eq(llmConfigs.id, current.id));

    // 获取更新后的配置
    const updated = await getLLMConfig();

    return successResponse({
      message: 'Configuration updated successfully',
      apiKeyHint: updated?.apiKey && updated.apiKey.length > 8
        ? '****' + updated.apiKey.slice(-4)
        : '****',
      hasApiKey: !!updated?.apiKey,
    });
  } catch (error) {
    console.error('Error updating LLM config:', error);
    return errorResponse('Failed to update LLM config');
  }
}
