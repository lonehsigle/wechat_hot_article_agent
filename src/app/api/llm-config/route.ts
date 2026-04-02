import { NextRequest, NextResponse } from 'next/server';
import { getLLMConfig, saveLLMConfig } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';

export async function GET() {
  try {
    initDatabase();
    const config = await getLLMConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    return NextResponse.json({ error: 'Failed to fetch LLM config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    await saveLLMConfig(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving LLM config:', error);
    return NextResponse.json({ error: 'Failed to save LLM config' }, { status: 500 });
  }
}
