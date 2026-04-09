import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hotTopics, hotTopicHistory, materialLibrary, collectedArticles, articleRewrites } from '@/lib/db/schema';
import { eq, desc, and, gt, sql, inArray } from 'drizzle-orm';
import { unifiedSearch, type SearchConfig, type SearchResponse } from '@/lib/search/service';

 const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TIANGONG_API_KEY = process.env.TIANGONG_API_KEY;
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;

interface TrendAnalysis {
  topicId: number;
  title: string;
  platform: string;
  currentHotValue: number;
  trendDirection: 'up' | 'down' | 'stable';
  growthRate: number;
  predictedPeak: number;
  timeToPeak: string;
  recommendation: string;
  relatedMaterials: number;
}

interface HotTopicRecommendation {
  topic: typeof hotTopics.$inferSelect;
  score: number;
  reasons: string[];
  suggestedAngles: string[];
  relatedArticles: number;
}

async function callLLM(prompt: string): Promise<string> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function analyzeTrend(topicId: number): Promise<TrendAnalysis | null> {
  const topic = await db().select().from(hotTopics).where(eq(hotTopics.id, topicId)).limit(1);
  if (!topic[0]) return null;

  const history = await db().select()
    .from(hotTopicHistory)
    .where(eq(hotTopicHistory.topicId, topicId))
    .orderBy(desc(hotTopicHistory.recordedAt))
    .limit(24);

  const currentHot = topic[0].hotValue || 0;
  const previousHot = history.length > 1 ? (history[1].hotValue || 0) : currentHot;
  const growthRate = previousHot > 0 ? ((currentHot - previousHot) / previousHot) * 100 : 0;

  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  if (growthRate > 10) trendDirection = 'up';
  else if (growthRate < -10) trendDirection = 'down';

  const predictedPeak = currentHot * (1 + Math.max(0, growthRate / 100));
  const timeToPeak = trendDirection === 'up' ? '预计2-4小时内达到峰值' : 
                     trendDirection === 'down' ? '已过峰值，正在下降' : '热度稳定';

  const relatedMaterials = await db().select()
    .from(materialLibrary)
    .where(eq(materialLibrary.topicId, topicId));

  const recommendation = generateRecommendation(topic[0], trendDirection, growthRate, relatedMaterials.length);

  return {
    topicId,
    title: topic[0].title,
    platform: topic[0].platform,
    currentHotValue: currentHot,
    trendDirection,
    growthRate,
    predictedPeak,
    timeToPeak,
    recommendation,
    relatedMaterials: relatedMaterials.length,
  };
}

function generateRecommendation(
  topic: typeof hotTopics.$inferSelect,
  trend: string,
  growth: number,
  materialCount: number
): string {
  if (trend === 'up' && growth > 50) {
    return `🔥 强烈推荐！该话题正处于快速上升期，${materialCount > 0 ? '已有素材可立即创作' : '建议立即采集素材并创作'}。预计2-4小时内达到峰值，是追热点的最佳时机。`;
  } else if (trend === 'up') {
    return `📈 推荐关注。话题热度稳步上升，${materialCount > 0 ? '已有素材' : '建议采集素材'}。适合做深度分析或独特角度的内容。`;
  } else if (trend === 'stable') {
    return `➡️ 热度稳定。话题已进入稳定期，${materialCount > 0 ? '有素材可用' : '可采集素材'}。适合做长尾内容或系列选题。`;
  } else {
    return `📉 热度下降。话题已过峰值，不建议追热点。但可以收集作为案例素材，用于后续相关话题。`;
  }
}

async function getRecommendations(
  userId?: string,
  limit: number = 10
): Promise<HotTopicRecommendation[]> {
  const recentTopics = await db().select()
    .from(hotTopics)
    .orderBy(desc(hotTopics.hotValue))
    .limit(50);

  const recommendations: HotTopicRecommendation[] = [];

  for (const topic of recentTopics.slice(0, limit * 2)) {
    const score = calculateRecommendationScore(topic);
    if (score > 50) {
      const relatedMaterials = await db().select()
        .from(materialLibrary)
        .where(eq(materialLibrary.topicId, topic.id));

      const relatedArticles = await db().select()
        .from(collectedArticles)
        .where(sql`${collectedArticles.title} LIKE ${'%' + topic.title.substring(0, 10) + '%'}`)
        .limit(5);

      const reasons = generateReasons(topic, relatedMaterials.length, relatedArticles.length);
      const suggestedAngles = await generateSuggestedAngles(topic);

      recommendations.push({
        topic,
        score,
        reasons,
        suggestedAngles,
        relatedArticles: relatedArticles.length,
      });
    }
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function calculateRecommendationScore(topic: typeof hotTopics.$inferSelect): number {
  let score = 50;

  if (topic.hotValue && topic.hotValue > 1000000) score += 30;
  else if (topic.hotValue && topic.hotValue > 500000) score += 20;
  else if (topic.hotValue && topic.hotValue > 100000) score += 10;

  if (topic.trendDirection === 'up') score += 15;
  else if (topic.trendDirection === 'stable') score += 5;

  if (topic.isBlackHorse) score += 25;

  if (topic.predictedGrowth && topic.predictedGrowth > 100) score += 20;
  else if (topic.predictedGrowth && topic.predictedGrowth > 50) score += 10;

  return Math.min(100, score);
}

function generateReasons(
  topic: typeof hotTopics.$inferSelect,
  materialCount: number,
  articleCount: number
): string[] {
  const reasons: string[] = [];

  if (topic.hotValue && topic.hotValue > 1000000) {
    reasons.push(`热度超过100万，关注度极高`);
  }

  if (topic.trendDirection === 'up') {
    reasons.push(`热度正在上升，是追热点的好时机`);
  }

  if (topic.isBlackHorse) {
    reasons.push(`黑马话题，竞争度低但潜力大`);
  }

  if (materialCount > 0) {
    reasons.push(`已有${materialCount}条相关素材`);
  }

  if (articleCount > 0) {
    reasons.push(`文章库中有${articleCount}篇相关文章可参考`);
  }

  if (topic.category) {
    reasons.push(`属于"${topic.category}"分类`);
  }

  return reasons.slice(0, 4);
}

async function generateSuggestedAngles(topic: typeof hotTopics.$inferSelect): Promise<string[]> {
  const prompt = `针对热点话题"${topic.title}"（平台：${topic.platform}，分类：${topic.category || '综合'}），请提供3-5个独特的创作角度建议。

要求：
1. 每个角度要独特，避免同质化
2. 角度要有吸引力，能引发读者兴趣
3. 适合自媒体传播

请直接返回角度列表，每行一个，不要编号。`;

  try {
    const result = await callLLM(prompt);
    return result.split('\n').filter(line => line.trim()).slice(0, 5);
  } catch {
    return [
      `深度解析：${topic.title}背后的原因`,
      `独家观点：如何看待${topic.title}`,
      `实用指南：${topic.title}对普通人的影响`,
    ];
  }
}

async function extractKeywords(topicId: number): Promise<string[]> {
  const topic = await db().select().from(hotTopics).where(eq(hotTopics.id, topicId)).limit(1);
  if (!topic[0]) return [];

  const prompt = `请从以下热点话题中提取5-8个关键词，用于内容创作和SEO优化。

话题标题：${topic[0].title}
话题描述：${topic[0].description || '无'}
平台：${topic[0].platform}

要求：
1. 关键词要有搜索价值
2. 包含核心词和长尾词
3. 适合微信生态

请直接返回关键词列表，每行一个，不要编号。`;

  try {
    const result = await callLLM(prompt);
    return result.split('\n').filter(line => line.trim()).slice(0, 8);
  } catch {
    return topic[0].title.split(/[\s,，、]+/).slice(0, 5);
  }
}

async function linkToWorkshop(topicId: number, articleId?: number): Promise<{
  success: boolean;
  message: string;
  data?: {
    topic: typeof hotTopics.$inferSelect;
    materials: typeof materialLibrary.$inferSelect[];
    keywords: string[];
    suggestedTitle?: string;
    suggestedOutline?: string;
  };
}> {
  const topic = await db().select().from(hotTopics).where(eq(hotTopics.id, topicId)).limit(1);
  if (!topic[0]) {
    return { success: false, message: '话题不存在' };
  }

  const materials = await db().select()
    .from(materialLibrary)
    .where(eq(materialLibrary.topicId, topicId));

  const keywords = await extractKeywords(topicId);

  let suggestedTitle: string | undefined;
  let suggestedOutline: string | undefined;

  if (articleId) {
    const article = await db().select()
      .from(collectedArticles)
      .where(eq(collectedArticles.id, articleId))
      .limit(1);

    if (article[0]) {
      const prompt = `基于热点话题"${topic[0].title}"和参考文章，生成一个适合微信公众号的标题和文章大纲。

参考文章标题：${article[0].title}
参考文章摘要：${article[0].digest || ''}

热点关键词：${keywords.join('、')}

请以JSON格式返回：
{
  "title": "建议标题",
  "outline": "文章大纲（包含开头、3-5个正文段落、结尾）"
}`;

      try {
        const result = await callLLM(prompt);
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          suggestedTitle = parsed.title;
          suggestedOutline = parsed.outline;
        }
      } catch (error) {
        console.error('Generate outline error:', error);
      }
    }
  }

  return {
    success: true,
    message: '已关联到创作工作台',
    data: {
      topic: topic[0],
      materials,
      keywords,
      suggestedTitle,
      suggestedOutline,
    },
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'trend-analysis') {
    const topicId = searchParams.get('topicId');
    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    const analysis = await analyzeTrend(parseInt(topicId));
    return NextResponse.json(analysis);
  }

  if (action === 'recommendations') {
    const limit = parseInt(searchParams.get('limit') || '10');
    const recommendations = await getRecommendations(undefined, limit);
    return NextResponse.json(recommendations);
  }

  if (action === 'keywords') {
    const topicId = searchParams.get('topicId');
    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    const keywords = await extractKeywords(parseInt(topicId));
    return NextResponse.json({ keywords });
  }

  if (action === 'dashboard') {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const trendingTopics = await db().select()
      .from(hotTopics)
      .where(and(
        eq(hotTopics.trendDirection, 'up'),
        gt(hotTopics.fetchedAt, oneHourAgo)
      ))
      .orderBy(desc(hotTopics.hotValue))
      .limit(10);

    const blackHorses = await db().select()
      .from(hotTopics)
      .where(eq(hotTopics.isBlackHorse, true))
      .orderBy(desc(hotTopics.predictedGrowth))
      .limit(5);

    const recommendations = await getRecommendations(undefined, 5);

    const platformStats = await db().select({
      platform: hotTopics.platform,
      count: sql<number>`count(*)`,
      avgHot: sql<number>`avg(${hotTopics.hotValue})`,
    })
    .from(hotTopics)
    .where(gt(hotTopics.fetchedAt, oneHourAgo))
    .groupBy(hotTopics.platform);

    return NextResponse.json({
      trendingTopics,
      blackHorses,
      recommendations,
      platformStats,
      lastUpdate: new Date(),
    });
  }

  if (action === 'network-search') {
    const keyword = searchParams.get('keyword');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    try {
      const searchConfig: SearchConfig = {
        maxResults,
        tavilyApiKey: TAVILY_API_KEY,
        tiangongApiKey: TIANGONG_API_KEY,
        minimaxApiKey: MINIMAX_API_KEY,
        minimaxGroupId: MINIMAX_GROUP_ID,
      };

      const searchResponse = await unifiedSearch(keyword, searchConfig);
      
      if (searchResponse.error) {
        return NextResponse.json({
          keyword,
          results: [],
          error: searchResponse.error,
          total: 0,
        });
      }
      
      return NextResponse.json({
        keyword,
        results: searchResponse.items,
        answer: searchResponse.answer,
        total: searchResponse.items.length,
      });
    } catch (error) {
      console.error('Network search error:', error);
      return NextResponse.json({ 
        keyword,
        results: [],
        error: '搜索失败', 
        message: error instanceof Error ? error.message : '未知错误',
        total: 0,
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, data } = body;

  if (action === 'link-workshop') {
    const { topicId, articleId } = data;
    const result = await linkToWorkshop(topicId, articleId);
    return NextResponse.json(result);
  }

  if (action === 'batch-trend-analysis') {
    const { topicIds } = data as { topicIds: number[] };
    const results = [];

    for (const topicId of topicIds) {
      const analysis = await analyzeTrend(topicId);
      if (analysis) {
        results.push(analysis);
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      analyses: results.sort((a, b) => b.growthRate - a.growthRate),
    });
  }

  if (action === 'smart-collect') {
    const { topicId, collectMaterials, collectArticles } = data;

    const topic = await db().select().from(hotTopics).where(eq(hotTopics.id, topicId)).limit(1);
    if (!topic[0]) {
      return NextResponse.json({ error: '话题不存在' }, { status: 400 });
    }

    const results: {
      materials?: number;
      articles?: number;
      keywords: string[];
    } = {
      keywords: await extractKeywords(topicId),
    };

    if (collectMaterials) {
      const existingMaterials = await db().select()
        .from(materialLibrary)
        .where(eq(materialLibrary.topicId, topicId));

      results.materials = existingMaterials.length;
    }

    if (collectArticles) {
      const relatedArticles = await db().select()
        .from(collectedArticles)
        .where(sql`${collectedArticles.title} LIKE ${'%' + topic[0].title.substring(0, 10) + '%'}`)
        .limit(10);

      results.articles = relatedArticles.length;
    }

    return NextResponse.json({
      success: true,
      message: '智能采集完成',
      results,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
