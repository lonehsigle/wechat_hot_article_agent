import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateTopic,
  generateTitleSuggestions,
  evaluationCriteria,
  painPointLevels,
  titleModels,
  TopicEvaluation,
  analyzePainPoints,
  painPointKeywords,
} from '@/lib/evaluation/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'criteria') {
      return NextResponse.json({
        success: true,
        criteria: evaluationCriteria,
        painPointLevels,
        titleModels,
      });
    }

    if (action === 'painpoint-keywords') {
      return NextResponse.json({
        success: true,
        data: painPointKeywords,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Evaluation API GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取评估数据失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, title, description, context, model, topic, count } = body;

    if (action === 'evaluate') {
      if (!title) {
        return NextResponse.json({ success: false, error: '标题不能为空' }, { status: 400 });
      }

      const evaluation = evaluateTopic(title, description, context);
      return NextResponse.json({ success: true, evaluation });
    }

    if (action === 'suggest-titles') {
      if (!topic) {
        return NextResponse.json({ success: false, error: '主题不能为空' }, { status: 400 });
      }

      const suggestions = generateTitleSuggestions(
        topic,
        model || 'benefit',
        count || 5
      );
      return NextResponse.json({ success: true, suggestions });
    }

    if (action === 'batch-evaluate') {
      const { topics } = body as { topics: Array<{ title: string; description?: string }> };
      
      if (!Array.isArray(topics) || topics.length === 0) {
        return NextResponse.json({ success: false, error: '选题列表不能为空' }, { status: 400 });
      }

      const evaluations: TopicEvaluation[] = topics.map(t => 
        evaluateTopic(t.title, t.description, context)
      );

      const sorted = evaluations.sort((a, b) => b.scores.total - a.scores.total);

      return NextResponse.json({ success: true, evaluations: sorted });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Evaluation API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '评估失败' },
      { status: 500 }
    );
  }
}
