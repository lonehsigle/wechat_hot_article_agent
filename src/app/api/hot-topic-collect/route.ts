import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { materialLibrary, hotTopics } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

interface HotTopic {
  id: number;
  title: string;
  platform: string;
  hotValue: number;
  description?: string;
  category?: string;
}

interface MaterialData {
  type: string;
  source: string;
  sourceUrl?: string;
  title: string;
  content: string;
  keyPoints: string[];
  quotes: string[];
  dataPoints: string[];
  tags: string[];
  topicId?: number;
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
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function extractMaterialsFromTopic(topic: HotTopic): Promise<MaterialData[]> {
  const prompt = `你是一个专业的内容分析师。请针对以下热点话题，生成可用于创作的素材。

热点话题：${topic.title}
平台：${topic.platform}
热度：${topic.hotValue}
描述：${topic.description || '无'}

请生成3-5条不同角度的素材，每条素材包含：
1. 标题：素材的标题
2. 内容：200-300字的详细内容，包含背景、观点、案例等
3. 核心观点：2-3个关键观点
4. 金句：1-2句可以直接引用的精彩句子
5. 数据点：相关数据或统计（如有）
6. 标签：2-3个分类标签

请以JSON数组格式返回，格式如下：
[
  {
    "title": "素材标题",
    "content": "详细内容...",
    "keyPoints": ["观点1", "观点2"],
    "quotes": ["金句1"],
    "dataPoints": ["数据1"],
    "tags": ["标签1", "标签2"]
  }
]

注意：
- 素材要紧扣热点话题，但要有不同的切入角度
- 内容要有深度，避免泛泛而谈
- 金句要精炼有力，适合直接引用
- 数据点要合理，可以基于公开信息推断`;

  try {
    const result = await callLLM(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('无法解析AI返回的JSON');
    }
    const materials = JSON.parse(jsonMatch[0]);
    
    return materials.map((m: any) => ({
      type: 'hot_topic_material',
      source: `热点采集-${topic.platform}`,
      sourceUrl: undefined,
      title: m.title,
      content: m.content,
      keyPoints: m.keyPoints || [],
      quotes: m.quotes || [],
      dataPoints: m.dataPoints || [],
      tags: m.tags || [],
      topicId: topic.id,
    }));
  } catch (error) {
    console.error('Extract materials error:', error);
    return [];
  }
}

async function searchRelatedArticles(keyword: string): Promise<{ title: string; summary: string; url: string }[]> {
  const prompt = `你是一个信息搜索助手。请针对关键词"${keyword}"，模拟搜索结果，生成5篇相关文章的标题和摘要。

这些文章应该：
1. 标题吸引人，符合自媒体风格
2. 摘要简洁，突出核心观点
3. 涵盖不同角度和观点

请以JSON数组格式返回：
[
  {
    "title": "文章标题",
    "summary": "文章摘要（50-100字）"
  }
]`;

  try {
    const result = await callLLM(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }
    const articles = JSON.parse(jsonMatch[0]);
    return articles.map((a: any, index: number) => ({
      title: a.title,
      summary: a.summary,
      url: `#article-${index + 1}`,
    }));
  } catch (error) {
    console.error('Search articles error:', error);
    return [];
  }
}

async function generateComprehensiveMaterials(
  topic: HotTopic,
  articles: { title: string; summary: string; url: string }[]
): Promise<MaterialData[]> {
  const articlesInfo = articles.map(a => `- ${a.title}: ${a.summary}`).join('\n');

  const prompt = `你是一个专业的内容分析师。请基于以下热点话题和相关文章信息，生成高质量的创作素材。

热点话题：${topic.title}
平台：${topic.platform}
热度：${topic.hotValue}
描述：${topic.description || '无'}

相关文章：
${articlesInfo}

请生成3-5条高质量素材，每条素材包含：
1. 标题：素材的标题
2. 内容：300-500字的详细内容，结合热点背景和相关文章观点
3. 核心观点：2-3个关键观点
4. 金句：1-2句可以直接引用的精彩句子
5. 数据点：相关数据或统计（如有）
6. 标签：2-3个分类标签

请以JSON数组格式返回。`;

  try {
    const result = await callLLM(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('无法解析AI返回的JSON');
    }
    const materials = JSON.parse(jsonMatch[0]);
    
    return materials.map((m: any) => ({
      type: 'hot_topic_material',
      source: `热点采集-${topic.platform}`,
      sourceUrl: undefined,
      title: m.title,
      content: m.content,
      keyPoints: m.keyPoints || [],
      quotes: m.quotes || [],
      dataPoints: m.dataPoints || [],
      tags: m.tags || [],
      topicId: topic.id,
    }));
  } catch (error) {
    console.error('Generate materials error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'collect-single') {
      const topic = data.topic as HotTopic;
      
      const articles = await searchRelatedArticles(topic.title);
      
      let materials: MaterialData[];
      if (articles.length > 0) {
        materials = await generateComprehensiveMaterials(topic, articles);
      } else {
        materials = await extractMaterialsFromTopic(topic);
      }

      if (materials.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: '素材生成失败，请重试' 
        }, { status: 500 });
      }

      const database = db();
      const inserted = await database.insert(materialLibrary).values(
        materials.map(m => ({
          ...m,
          isUsed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      ).returning();

      return NextResponse.json({
        success: true,
        message: `成功采集 ${inserted.length} 条素材`,
        materials: inserted,
        relatedArticles: articles,
      });
    }

    if (action === 'collect-batch') {
      const topics = data.topics as HotTopic[];
      const results = [];

      for (const topic of topics) {
        try {
          const articles = await searchRelatedArticles(topic.title);
          let materials: MaterialData[];
          
          if (articles.length > 0) {
            materials = await generateComprehensiveMaterials(topic, articles);
          } else {
            materials = await extractMaterialsFromTopic(topic);
          }

          if (materials.length > 0) {
            const database = db();
            const inserted = await database.insert(materialLibrary).values(
              materials.map(m => ({
                ...m,
                isUsed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              }))
            ).returning();

            results.push({
              topicId: topic.id,
              topicTitle: topic.title,
              success: true,
              count: inserted.length,
            });
          } else {
            results.push({
              topicId: topic.id,
              topicTitle: topic.title,
              success: false,
              error: '素材生成失败',
            });
          }
        } catch (error) {
          results.push({
            topicId: topic.id,
            topicTitle: topic.title,
            success: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalMaterials = results.reduce((sum, r) => sum + (r.success ? (r.count || 0) : 0), 0);

      return NextResponse.json({
        success: true,
        message: `成功采集 ${successCount}/${topics.length} 个热点，共 ${totalMaterials} 条素材`,
        results,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Hot topic collect API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '操作失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const topicId = searchParams.get('topicId');

  const database = db();

  if (topicId) {
    const materials = await database
      .select()
      .from(materialLibrary)
      .where(eq(materialLibrary.topicId, parseInt(topicId)))
      .orderBy(desc(materialLibrary.createdAt));

    return NextResponse.json(materials);
  }

  const materials = await database
    .select()
    .from(materialLibrary)
    .where(eq(materialLibrary.type, 'hot_topic_material'))
    .orderBy(desc(materialLibrary.createdAt));

  return NextResponse.json(materials);
}
