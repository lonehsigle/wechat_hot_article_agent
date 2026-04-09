import { NextRequest, NextResponse } from 'next/server';
import { getLLMConfig, saveLLMConfig } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET() {
  try {
    initDatabase();
    const config = await getLLMConfig();
    return successResponse(config);
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    return errorResponse('Failed to fetch LLM config');
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    await saveLLMConfig(body);
    return successResponse(null);
  } catch (error) {
    console.error('Error saving LLM config:', error);
    return errorResponse('Failed to save LLM config');
  }
}
