import { NextRequest, NextResponse } from 'next/server';
import { analyzeTopicsWithLLM, callLLM, ArticleForAnalysis } from '@/lib/llm/service';
import { getLLMConfig, saveLLMConfig } from '@/lib/db/queries';
import { initDatabase, db } from '@/lib/db';
import { wordCloudCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { getPromptTemplate as getDbPromptTemplate, getPromptTemplateSync } from '@/lib/prompts';

function generateArticleHash(articles: ArticleForAnalysis[]): string {
  const content = articles.map(a => `${a.title}:${a.readCount}:${a.likeCount}`).join('|');
  return crypto.createHash('md5').update(content).digest('hex');
}

async function getWordCloudCache(cacheKey: string) {
  const result = await db().select().from(wordCloudCache).where(eq(wordCloudCache.cacheKey, cacheKey));
  return result[0] || null;
}

async function saveWordCloudCache(cacheKey: string, basicWordCloud: Array<{ word: string; count: number }>, articleCount: number, articleHash: string) {
  const existing = await getWordCloudCache(cacheKey);
  const now = new Date();
  
  if (existing) {
    await db().update(wordCloudCache)
      .set({
        basicWordCloud,
        articleCount,
        articleHash,
        updatedAt: now,
      })
      .where(eq(wordCloudCache.id, existing.id));
    return existing.id;
  } else {
    const result = await db().insert(wordCloudCache).values({
      cacheKey,
      basicWordCloud,
      articleCount,
      articleHash,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return result[0]?.id;
  }
}

async function updateAIWordCloud(cacheKey: string, aiWordCloud: Array<{ word: string; count: number; category: string; sentiment: string }>) {
  const existing = await getWordCloudCache(cacheKey);
  if (existing) {
    await db().update(wordCloudCache)
      .set({
        aiWordCloud,
        aiProcessedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wordCloudCache.id, existing.id));
  }
}

async function processWordCloudWithAI(basicWordCloud: Array<{ word: string; count: number }>): Promise<Array<{ word: string; count: number; category: string; sentiment: string }>> {
  const topWords = basicWordCloud.slice(0, 50);
  
  const promptTemplate = await getPromptTemplate('wordcloud-analysis');
  console.log('[WordCloud AI] Prompt template length:', promptTemplate.length);
  console.log('[WordCloud AI] Prompt template preview:', promptTemplate.substring(0, 200));
  
  const wordsStr = topWords.map(w => `${w.word}(${w.count}次)`).join('、');
  const systemPrompt = promptTemplate
    .replace(/{words}/gi, wordsStr)
    .replace(/{WORDS}/g, wordsStr);
  
  console.log('[WordCloud AI] Final prompt preview:', systemPrompt.substring(0, 300));

  if (!systemPrompt.trim()) {
    console.error('Word cloud prompt is empty, using fallback');
    return basicWordCloud.map(w => ({
      ...w,
      category: '其他',
      sentiment: '中性',
    }));
  }

  try {
    const response = await callLLM([
      { role: 'user', content: systemPrompt },
    ], { maxTokens: 4096, temperature: 0.3 });

    console.log('[WordCloud AI] Raw response:', response.content.substring(0, 500));
    
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    console.log('[WordCloud AI] JSON match found:', !!jsonMatch);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[WordCloud AI] Parsed result count:', parsed.length);
      console.log('[WordCloud AI] First item:', JSON.stringify(parsed[0]));
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse AI word cloud:', error);
  }
  
  return basicWordCloud.map(w => ({
    ...w,
    category: '其他',
    sentiment: '中性',
  }));
}

const DEFAULT_PROMPTS: Record<string, string> = {
  'wordcloud-analysis': `你是专业的文本分析专家，需对提供的关键词进行分类和情感分析。

待分析的关键词如下：
<keywords>
{words}
</keywords>

请严格按照以下要求处理每个关键词：
1. 每个关键词生成一个包含以下字段的JSON对象：
   - word：原关键词文本
   - count：原关键词出现的次数（直接提取关键词中的数字部分，若未标注次数则默认count为1）
   - category：分类标签（从个人成长、财富思维、人际交往、职场发展、情感心理、生活智慧、认知提升、方法技巧、趋势洞察、其他中选择，若无法匹配则标注为"其他"）
   - sentiment：情感倾向（正面、中性、负面，基于关键词的常见语义判断）
2. 所有结果以JSON数组形式返回，数组元素为上述JSON对象
3. 仅输出JSON数组，不得包含任何额外文本、解释或格式说明`,
  'topic-analysis': `你是一位资深的公众号运营专家和内容分析师。你擅长分析文章数据，发现内容趋势，并给出有价值的选题建议。

你的分析应该：
1. 基于数据说话，不要空泛
2. 给出具体、可执行的建议
3. 关注读者需求和内容价值
4. 考虑内容创作的可行性

请用JSON格式返回分析结果。

请分析以下公众号文章数据，给出选题建议：

【文章列表】
{articlesInfo}

【高频关键词】
{topWords}

【统计数据】
{statsInfo}

请返回JSON格式：
{
  "summary": "整体分析摘要（100字以内）",
  "insights": ["洞察1", "洞察2", "洞察3"],
  "topicSuggestions": [
    {"title": "选题标题", "reason": "推荐理由", "potential": "高/中/低"}
  ],
  "contentTrends": ["趋势1", "趋势2"],
  "audienceInsights": ["读者洞察1", "读者洞察2"]
}`,
  'content-analysis-report': `你是专业公众号内容分析师，我将提供公众号【数据库内所有文章】的标题+摘要，帮我完成深度内容分析报告。

分析规则：
1. 过滤内容：剔除广告、公告、转载、无正文水文；只保留原创有效内容。
2. 文本处理：识别核心关键词，去除停用词（的、了、是、请、关注、点击等）。
3. 权重设置：标题中出现的词汇权重×2，正文正常计算。

请分析以下文章数据：

【文章列表】
{articlesInfo}

【高频关键词】
{topWords}

【统计数据】
{statsInfo}

请返回JSON格式：
{
  "corePositioning": "账号核心定位（一句话描述这个公众号主要做什么）",
  "contentTags": ["内容标签1", "内容标签2", "内容标签3"],
  "topThemes": ["用户长期最关注的主题1", "主题2", "主题3"],
  "viralKeywords": ["爆款文章共性关键词1", "关键词2", "关键词3"],
  "topicDirections": ["可持续创作的选题方向1", "方向2", "方向3", "方向4", "方向5"],
  "titleFormula": "公众号标题高点击关键词公式（一个可复用的标题模板）"
}`,
};

async function getPromptTemplate(key: string): Promise<string> {
  const template = await getDbPromptTemplate(key);
  if (template) {
    return template;
  }
  return DEFAULT_PROMPTS[key] || '';
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    
    const body = await request.json();
    const { action, articles, wordCloud, config, cacheKey } = body;

    if (action === 'save-config') {
      await saveLLMConfig(config);
      return NextResponse.json({ success: true, message: '配置已保存' });
    }

    if (action === 'get-wordcloud-cache') {
      if (!cacheKey) {
        return NextResponse.json({ error: '缺少cacheKey' }, { status: 400 });
      }
      const cache = await getWordCloudCache(cacheKey);
      return NextResponse.json({ cache });
    }

    if (action === 'save-basic-wordcloud') {
      if (!cacheKey || !wordCloud) {
        return NextResponse.json({ error: '缺少参数' }, { status: 400 });
      }
      const articleHash = articles ? generateArticleHash(articles) : '';
      await saveWordCloudCache(cacheKey, wordCloud, articles?.length || 0, articleHash);
      return NextResponse.json({ success: true });
    }

    if (action === 'process-wordcloud-ai') {
      const existingConfig = await getLLMConfig();
      if (!existingConfig) {
        return NextResponse.json({ 
          error: '请先配置LLM API',
          needConfig: true 
        }, { status: 400 });
      }

      if (!wordCloud || wordCloud.length === 0) {
        return NextResponse.json({ error: '没有词云数据' }, { status: 400 });
      }

      const aiWordCloud = await processWordCloudWithAI(wordCloud);
      
      if (cacheKey) {
        await updateAIWordCloud(cacheKey, aiWordCloud);
      }
      
      return NextResponse.json({ aiWordCloud });
    }

    if (action === 'clear-cache') {
      if (cacheKey) {
        await db().delete(wordCloudCache).where(eq(wordCloudCache.cacheKey, cacheKey));
      } else {
        await db().delete(wordCloudCache);
      }
      return NextResponse.json({ success: true, message: '缓存已清除' });
    }

    if (action === 'analyze') {
      const existingConfig = await getLLMConfig();
      if (!existingConfig) {
        return NextResponse.json({ 
          error: '请先配置LLM API',
          needConfig: true 
        }, { status: 400 });
      }

      if (!articles || articles.length === 0) {
        return NextResponse.json({ 
          error: '没有可分析的文章数据' 
        }, { status: 400 });
      }

      const result = await analyzeTopicsWithLLM(
        articles as ArticleForAnalysis[],
        wordCloud || []
      );

      return NextResponse.json(result);
    }

    if (action === 'generate-analysis-report') {
      const existingConfig = await getLLMConfig();
      if (!existingConfig) {
        return NextResponse.json({ 
          error: '请先配置LLM API',
          needConfig: true 
        }, { status: 400 });
      }

      if (!articles || articles.length === 0) {
        return NextResponse.json({ 
          error: '没有可分析的文章数据' 
        }, { status: 400 });
      }

      const report = await generateContentAnalysisReport(
        articles as Array<{ title: string; readCount: number; likeCount: number; digest?: string }>,
        wordCloud || []
      );

      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Topic analysis error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '分析失败' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    initDatabase();
    const config = await getLLMConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

async function generateContentAnalysisReport(
  articles: Array<{ title: string; readCount: number; likeCount: number; digest?: string }>,
  wordCloud: Array<{ word: string; count: number }>
): Promise<{
  corePositioning: string;
  contentTags: string[];
  topThemes: string[];
  viralKeywords: string[];
  topicDirections: string[];
  titleFormula: string;
}> {
  const promptTemplate = await getPromptTemplate('content-analysis-report');
  
  const articlesInfo = articles.map(a => 
    `- ${a.title} (阅读${a.readCount || 0}, 点赞${a.likeCount || 0})${a.digest ? `\n  摘要: ${a.digest.substring(0, 100)}...` : ''}`
  ).join('\n');
  
  const topWords = wordCloud.slice(0, 30).map(w => `${w.word}(${w.count}次)`).join('、');
  
  const statsInfo = `总文章数: ${articles.length}
平均阅读量: ${Math.round(articles.reduce((sum, a) => sum + (a.readCount || 0), 0) / articles.length)}
平均点赞量: ${Math.round(articles.reduce((sum, a) => sum + (a.likeCount || 0), 0) / articles.length)}`;
  
  const prompt = (promptTemplate || DEFAULT_PROMPTS['content-analysis-report'] || DEFAULT_PROMPTS['topic-analysis'])
    .replace('{articlesInfo}', articlesInfo)
    .replace('{topWords}', topWords)
    .replace('{statsInfo}', statsInfo);
  
  try {
    const response = await callLLM([
      { role: 'user', content: prompt },
    ], { maxTokens: 4096, temperature: 0.5 });

    console.log('[Analysis Report] Raw response:', response.content.substring(0, 500));
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        corePositioning: parsed.corePositioning || parsed.summary || '分析中...',
        contentTags: parsed.contentTags || [],
        topThemes: parsed.topThemes || parsed.themes || [],
        viralKeywords: parsed.viralKeywords || [],
        topicDirections: parsed.topicDirections || parsed.topicSuggestions?.map((s: { title: string }) => s.title) || [],
        titleFormula: parsed.titleFormula || '',
      };
    }
  } catch (error) {
    console.error('Failed to generate analysis report:', error);
  }
  
  return {
    corePositioning: '分析生成中...',
    contentTags: [],
    topThemes: [],
    viralKeywords: [],
    topicDirections: [],
    titleFormula: '',
  };
}
