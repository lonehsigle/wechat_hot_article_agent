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
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'criteria') {
    return NextResponse.json({
      criteria: evaluationCriteria,
      painPointLevels,
      titleModels,
    });
  }

  if (action === 'painpoint-keywords') {
    return NextResponse.json(painPointKeywords);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, title, description, context, model, topic, count } = body;

    if (action === 'evaluate') {
      if (!title) {
        return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
      }

      const evaluation = evaluateTopic(title, description, context);
      return NextResponse.json(evaluation);
    }

    if (action === 'suggest-titles') {
      if (!topic) {
        return NextResponse.json({ error: '主题不能为空' }, { status: 400 });
      }

      const suggestions = generateTitleSuggestions(
        topic,
        model || 'benefit',
        count || 5
      );
      return NextResponse.json({ suggestions });
    }

    if (action === 'batch-evaluate') {
      const { topics } = body as { topics: Array<{ title: string; description?: string }> };
      
      if (!Array.isArray(topics) || topics.length === 0) {
        return NextResponse.json({ error: '选题列表不能为空' }, { status: 400 });
      }

      const evaluations: TopicEvaluation[] = topics.map(t => 
        evaluateTopic(t.title, t.description, context)
      );

      const sorted = evaluations.sort((a, b) => b.scores.total - a.scores.total);

      return NextResponse.json({ evaluations: sorted });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Evaluation API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '评估失败' },
      { status: 500 }
    );
  }
}
