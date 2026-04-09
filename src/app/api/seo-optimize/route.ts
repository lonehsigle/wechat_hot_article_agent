import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collectedArticles, articleRewrites } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

interface SEOAnalysis {
  title: string;
  titleScore: number;
  titleIssues: string[];
  titleSuggestions: string[];
  keywords: string[];
  keywordDensity: { keyword: string; count: number; density: number }[];
  readabilityScore: number;
  structureScore: number;
  overallScore: number;
  recommendations: string[];
}

interface KeywordSuggestion {
  keyword: string;
  searchVolume: string;
  competition: 'low' | 'medium' | 'high';
  relevance: number;
  type: 'core' | 'longtail' | 'related';
}

interface WechatSEOReport {
  articleId: number;
  title: string;
  seoScore: number;
  discoverability: number;
  engagement: number;
  suggestions: string[];
  optimizedTitle?: string;
  optimizedDigest?: string;
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

async function analyzeTitle(title: string): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (title.length < 10) {
    issues.push('标题过短，建议15-25个字');
    score -= 20;
  } else if (title.length > 35) {
    issues.push('标题过长，可能被截断');
    score -= 10;
  }

  if (!/[!！?？【】]/.test(title)) {
    issues.push('缺少吸引眼球的标点符号');
    suggestions.push('考虑添加感叹号或问号增加吸引力');
    score -= 5;
  }

  if (!/\d/.test(title)) {
    suggestions.push('考虑添加数字增加可信度');
  }

  const emotionalWords = ['震惊', '揭秘', '必看', '干货', '收藏', '实用', '独家', '首次'];
  if (!emotionalWords.some(word => title.includes(word))) {
    suggestions.push('可添加"干货"、"必看"等吸引词');
  }

  const prompt = `分析以下微信公众号文章标题的SEO优化程度：

标题：${title}

请从以下维度评估并给出改进建议：
1. 关键词覆盖度
2. 吸引力
3. 可读性
4. 微信搜索友好度

请以JSON格式返回：
{
  "score": 0-100分数,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "optimizedTitle": "优化后的标题"
}`;

  try {
    const result = await callLLM(prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || score,
        issues: [...issues, ...(parsed.issues || [])],
        suggestions: [...suggestions, ...(parsed.suggestions || [])],
      };
    }
  } catch (error) {
    console.error('Title analysis error:', error);
  }

  return { score: Math.max(0, score), issues, suggestions };
}

async function extractKeywordsFromContent(content: string, title: string): Promise<string[]> {
  const prompt = `从以下文章内容中提取5-10个核心关键词，用于微信搜索优化。

标题：${title}

内容摘要：${content.substring(0, 1000)}

要求：
1. 关键词要有搜索价值
2. 包含核心词和长尾词
3. 适合微信生态搜索
4. 按重要性排序

请直接返回关键词列表，每行一个，不要编号。`;

  try {
    const result = await callLLM(prompt);
    return result.split('\n').filter(line => line.trim()).slice(0, 10);
  } catch {
    const words = title.split(/[\s,，、]+/).filter(w => w.length >= 2);
    return words.slice(0, 5);
  }
}

function calculateKeywordDensity(content: string, keywords: string[]): { keyword: string; count: number; density: number }[] {
  const totalWords = content.length;
  const results: { keyword: string; count: number; density: number }[] = [];

  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'g');
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;
    const density = totalWords > 0 ? (count * keyword.length / totalWords) * 100 : 0;
    results.push({ keyword, count, density });
  }

  return results.sort((a, b) => b.count - a.count);
}

function analyzeStructure(content: string): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  if (paragraphs.length < 3) {
    issues.push('段落过少，建议至少3个段落');
    score -= 15;
  }

  if (!/^#{1,3}\s/m.test(content) && !/<h[1-3]>/i.test(content)) {
    issues.push('缺少小标题，建议添加2-3个小标题');
    score -= 10;
  }

  const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
  if (avgParagraphLength > 300) {
    issues.push('段落过长，建议每段不超过150字');
    score -= 10;
  }

  if (!/\d/.test(content)) {
    issues.push('缺少数据支撑，建议添加具体数字');
    score -= 5;
  }

  return { score: Math.max(0, score), issues };
}

function analyzeReadability(content: string): number {
  let score = 100;

  const sentences = content.split(/[。！？.!?]/).filter(s => s.trim());
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  
  if (avgSentenceLength > 50) {
    score -= 15;
  } else if (avgSentenceLength > 35) {
    score -= 5;
  }

  const complexWords = content.match(/[^\u4e00-\u9fa5\s]{5,}/g);
  if (complexWords && complexWords.length > 10) {
    score -= 10;
  }

  const connectors = ['因此', '所以', '但是', '然而', '不过', '而且', '并且'];
  const hasConnectors = connectors.some(c => content.includes(c));
  if (!hasConnectors) {
    score -= 5;
  }

  return Math.max(0, score);
}

async function generateKeywordSuggestions(topic: string, existingKeywords: string[]): Promise<KeywordSuggestion[]> {
  const prompt = `基于主题"${topic}"，生成10个关键词建议，用于微信公众号SEO优化。

已有关键词：${existingKeywords.join('、')}

请以JSON数组格式返回：
[
  {
    "keyword": "关键词",
    "searchVolume": "高/中/低",
    "competition": "low/medium/high",
    "relevance": 0-100,
    "type": "core/longtail/related"
  }
]`;

  try {
    const result = await callLLM(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Keyword suggestion error:', error);
  }

  return [
    { keyword: topic, searchVolume: '高', competition: 'high', relevance: 100, type: 'core' },
    { keyword: `${topic}攻略`, searchVolume: '中', competition: 'medium', relevance: 90, type: 'longtail' },
    { keyword: `${topic}方法`, searchVolume: '中', competition: 'medium', relevance: 85, type: 'longtail' },
  ];
}

async function analyzeArticleSEO(articleId: number): Promise<SEOAnalysis | null> {
  const article = await db().select()
    .from(collectedArticles)
    .where(eq(collectedArticles.id, articleId))
    .limit(1);

  if (!article[0]) return null;

  const title = article[0].title;
  const content = article[0].content || article[0].contentHtml || '';

  const titleAnalysis = await analyzeTitle(title);
  const keywords = await extractKeywordsFromContent(content, title);
  const keywordDensity = calculateKeywordDensity(content, keywords);
  const structureAnalysis = analyzeStructure(content);
  const readabilityScore = analyzeReadability(content);

  const overallScore = Math.round(
    (titleAnalysis.score * 0.3 + structureAnalysis.score * 0.3 + readabilityScore * 0.2 + 
     (keywordDensity.length > 0 ? 80 : 60) * 0.2)
  );

  const recommendations: string[] = [];
  recommendations.push(...titleAnalysis.suggestions);
  recommendations.push(...structureAnalysis.issues.map(i => `结构：${i}`));
  
  if (keywordDensity.length === 0) {
    recommendations.push('建议添加更多关键词');
  } else if (keywordDensity[0].density < 1) {
    recommendations.push(`建议增加"${keywordDensity[0].keyword}"的出现频率`);
  }

  return {
    title,
    titleScore: titleAnalysis.score,
    titleIssues: titleAnalysis.issues,
    titleSuggestions: titleAnalysis.suggestions,
    keywords,
    keywordDensity,
    readabilityScore,
    structureScore: structureAnalysis.score,
    overallScore,
    recommendations,
  };
}

async function optimizeForWechat(articleId: number): Promise<WechatSEOReport> {
  const article = await db().select()
    .from(collectedArticles)
    .where(eq(collectedArticles.id, articleId))
    .limit(1);

  if (!article[0]) {
    return {
      articleId,
      title: '',
      seoScore: 0,
      discoverability: 0,
      engagement: 0,
      suggestions: ['文章不存在'],
    };
  }

  const seoAnalysis = await analyzeArticleSEO(articleId);
  if (!seoAnalysis) {
    return {
      articleId,
      title: article[0].title,
      seoScore: 0,
      discoverability: 0,
      engagement: 0,
      suggestions: ['分析失败'],
    };
  }

  const discoverability = Math.round(seoAnalysis.keywords.length * 10 + seoAnalysis.titleScore * 0.5);
  const engagement = Math.round(seoAnalysis.readabilityScore * 0.6 + seoAnalysis.structureScore * 0.4);

  let optimizedTitle: string | undefined;
  let optimizedDigest: string | undefined;

  const prompt = `优化以下微信公众号文章的标题和摘要，提高搜索可见性和点击率。

原标题：${article[0].title}
原摘要：${article[0].digest || ''}
关键词：${seoAnalysis.keywords.join('、')}

请以JSON格式返回：
{
  "optimizedTitle": "优化后的标题（15-25字，包含核心关键词）",
  "optimizedDigest": "优化后的摘要（50-100字，包含关键词，有吸引力）"
}`;

  try {
    const result = await callLLM(prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      optimizedTitle = parsed.optimizedTitle;
      optimizedDigest = parsed.optimizedDigest;
    }
  } catch (error) {
    console.error('Optimize error:', error);
  }

  return {
    articleId,
    title: article[0].title,
    seoScore: seoAnalysis.overallScore,
    discoverability: Math.min(100, discoverability),
    engagement: Math.min(100, engagement),
    suggestions: seoAnalysis.recommendations,
    optimizedTitle,
    optimizedDigest,
  };
}

async function batchAnalyzeArticles(articleIds: number[]): Promise<{
  results: WechatSEOReport[];
  summary: {
    avgScore: number;
    lowScoreCount: number;
    highScoreCount: number;
    commonIssues: string[];
  };
}> {
  const results: WechatSEOReport[] = [];

  for (const articleId of articleIds) {
    const report = await optimizeForWechat(articleId);
    results.push(report);
  }

  const scores = results.map(r => r.seoScore);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const lowScoreCount = scores.filter(s => s < 60).length;
  const highScoreCount = scores.filter(s => s >= 80).length;

  const allSuggestions = results.flatMap(r => r.suggestions);
  const suggestionCounts = new Map<string, number>();
  allSuggestions.forEach(s => {
    suggestionCounts.set(s, (suggestionCounts.get(s) || 0) + 1);
  });
  const commonIssues = Array.from(suggestionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue]) => issue);

  return {
    results,
    summary: {
      avgScore: Math.round(avgScore),
      lowScoreCount,
      highScoreCount,
      commonIssues,
    },
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'analyze') {
    const articleId = searchParams.get('articleId');
    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    const analysis = await analyzeArticleSEO(parseInt(articleId));
    return NextResponse.json(analysis);
  }

  if (action === 'optimize') {
    const articleId = searchParams.get('articleId');
    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    const report = await optimizeForWechat(parseInt(articleId));
    return NextResponse.json(report);
  }

  if (action === 'keywords') {
    const topic = searchParams.get('topic');
    const existingKeywords = searchParams.get('keywords')?.split(',') || [];
    
    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const suggestions = await generateKeywordSuggestions(topic, existingKeywords);
    return NextResponse.json({ suggestions });
  }

  if (action === 'batch-analyze') {
    const articleIds = searchParams.get('articleIds')?.split(',').map(Number).filter(Boolean);
    if (!articleIds || articleIds.length === 0) {
      return NextResponse.json({ error: 'articleIds is required' }, { status: 400 });
    }

    const result = await batchAnalyzeArticles(articleIds);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, data } = body;

  if (action === 'batch-optimize') {
    const { articleIds } = data as { articleIds: number[] };
    const result = await batchAnalyzeArticles(articleIds);
    return NextResponse.json(result);
  }

  if (action === 'apply-optimization') {
    const { articleId, optimizedTitle, optimizedDigest } = data as {
      articleId: number;
      optimizedTitle?: string;
      optimizedDigest?: string;
    };

    const updateData: Record<string, string> = {};
    if (optimizedTitle) updateData.title = optimizedTitle;
    if (optimizedDigest) updateData.digest = optimizedDigest;

    if (Object.keys(updateData).length > 0) {
      await db().update(collectedArticles)
        .set(updateData)
        .where(eq(collectedArticles.id, articleId));
    }

    return NextResponse.json({
      success: true,
      message: '优化已应用',
      updated: Object.keys(updateData),
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
