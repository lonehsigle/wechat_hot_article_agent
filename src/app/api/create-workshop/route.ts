import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts, updatePromptTemplate, getPromptTemplate } from '@/lib/prompts';
import { db } from '@/lib/db';
import { writingStyles, layoutStyles, articleRewrites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { callLLM, type LLMMessage } from '@/lib/llm/service';

async function callLLMWithPrompt(prompt: string, temperature: number = 0.7, maxTokens: number = 8192): Promise<string> {
  try {
    const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
    const result = await callLLM(messages, { temperature, maxTokens });
    return result.content || '';
  } catch (error) {
    console.error('[LLM调用] 错误:', error);
    throw error;
  }
}

async function getWritingStyle(styleId: string | undefined) {
  if (!styleId) return null;
  const parsedId = parseInt(styleId);
  if (isNaN(parsedId)) return null;
  try {
    const result = await db().select().from(writingStyles).where(eq(writingStyles.id, parsedId));
    return result[0] || null;
  } catch {
    return null;
  }
}

async function getLayoutStyle(layoutId: string | undefined) {
  if (!layoutId) return null;
  const parsedId = parseInt(layoutId);
  if (isNaN(parsedId)) return null;
  try {
    const result = await db().select().from(layoutStyles).where(eq(layoutStyles.id, parsedId));
    return result[0] || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');
  
  try {
  if (action === 'get-prompts') {
    const prompts = await getAllPrompts();
    return NextResponse.json({ success: true, prompts });
  }
  
  return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Create workshop GET error:', error);
    return NextResponse.json({ 
      success: false, error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'update-prompt') {
      const { key, template } = body;
      const success = await updatePromptTemplate(key, template);
      if (success) {
        return NextResponse.json({ success: true, message: 'Prompt已更新' });
      }
      return NextResponse.json({ success: false, error: '未找到该Prompt' }, { status: 404 });
    }

    if (action === 'web-search') {
      if (!body.keyword) {
        return NextResponse.json({ success: false, error: 'keyword参数不能为空' }, { status: 400 });
      }
      const searchResult = await callWebSearch(body.keyword);
      return NextResponse.json(searchResult);
    }

    if (action === 'generate-article') {
      if (!body.keyword) {
        return NextResponse.json({ success: false, error: 'keyword参数不能为空' }, { status: 400 });
      }
      const article = await generateArticle(body);
      return NextResponse.json(article);
    }

    if (action === 'check-ai') {
      if (!body.content) {
        return NextResponse.json({ success: false, error: 'content参数不能为空' }, { status: 400 });
      }
      const result = await checkAIContent(body.content);
      return NextResponse.json(result);
    }

    if (action === 'humanize-content') {
      if (!body.content) {
        return NextResponse.json({ success: false, error: 'content参数不能为空' }, { status: 400 });
      }
      const result = await humanizeContent(body.content);
      return NextResponse.json(result);
    }

    if (action === 'polish-content') {
      if (!body.content) {
        return NextResponse.json({ success: false, error: 'content参数不能为空' }, { status: 400 });
      }
      const result = await polishContent(body.content, {
        ...body,
        previousScore: body.previousScore,
        previousIssues: body.previousIssues,
        previousSuggestions: body.previousSuggestions
      });
      return NextResponse.json(result);
    }

    if (action === 'generate-title') {
      if (!body.keyword) {
        return NextResponse.json({ success: false, error: 'keyword参数不能为空' }, { status: 400 });
      }
      const styleData = await getWritingStyle(body.style);
      const titles = await generateTitles({ ...body, styleData });
      return NextResponse.json(titles);
    }

    if (action === 'evaluate-title') {
      if (!body.titles || !Array.isArray(body.titles)) {
        return NextResponse.json({ success: false, error: 'titles参数不能为空且必须是数组' }, { status: 400 });
      }
      const evaluations = await evaluateTitles(body.titles, body.originalTitle);
      return NextResponse.json({ evaluations });
    }

    if (action === 'generate-opening') {
      if (!body.title || !body.keyword) {
        return NextResponse.json({ success: false, error: 'title和keyword参数不能为空' }, { status: 400 });
      }
      const styleData = await getWritingStyle(body.style);
      const opening = await generateOpening({ ...body, styleData });
      return NextResponse.json(opening);
    }

    if (action === 'generate-ending') {
      if (!body.title || !body.body) {
        return NextResponse.json({ success: false, error: 'title和body参数不能为空' }, { status: 400 });
      }
      const ending = await generateEnding(body);
      return NextResponse.json(ending);
    }

    if (action === 'analyze-content') {
      if (!body.content) {
        return NextResponse.json({ success: false, error: 'content参数不能为空' }, { status: 400 });
      }
      const analysis = await analyzeContentType(body.content, body.title);
      return NextResponse.json(analysis);
    }

    if (action === 'rewrite-article') {
      if (!body.keyword) {
        return NextResponse.json({ success: false, error: 'keyword参数不能为空' }, { status: 400 });
      }
      const article = await rewriteArticle(body);
      return NextResponse.json(article);
    }

    if (action === 'decompose-article') {
      if (!body.content) {
        return NextResponse.json({ success: false, error: 'content参数不能为空' }, { status: 400 });
      }
      const result = await decomposeArticle(body.content, body.title);
      return NextResponse.json(result);
    }

    if (action === 'generate-body') {
      if (!body.title) {
        return NextResponse.json({ success: false, error: 'title参数不能为空' }, { status: 400 });
      }
      const styleData = await getWritingStyle(body.style);
      const result = await generateBody({ ...body, styleData });
      return NextResponse.json(result);
    }

    if (action === 'full-creation-workflow') {
      if (!body.keyword || !body.title) {
        return NextResponse.json({ success: false, error: 'keyword和title参数不能为空' }, { status: 400 });
      }
      const styleData = await getWritingStyle(body.style);
      const result = await fullCreationWorkflow({ ...body, styleData });
      return NextResponse.json(result);
    }

    if (action === 'pre-publish-evaluation') {
      if (!body.content) {
        return NextResponse.json({ success: false, error: 'content参数不能为空' }, { status: 400 });
      }
      const result = await prePublishEvaluation(body.content, body.title);
      return NextResponse.json(result);
    }

    if (action === 'full-sop-workflow') {
      if (!body.keyword) {
        return NextResponse.json({ success: false, error: 'keyword参数不能为空' }, { status: 400 });
      }
      const styleData = await getWritingStyle(body.style);
      const layoutData = await getLayoutStyle(body.layout);
      const result = await fullSOPWorkflow({ ...body, styleData, layoutData });
      return NextResponse.json(result);
    }

    if (action === 'save-rewrite') {
      const { sourceArticleIds, title, content, summary, style, wordCount, aiScore, humanScore } = body;
      
      try {
        const result = await db().insert(articleRewrites).values({
          sourceArticleIds: sourceArticleIds || [],
          title: title || '',
          content: content || '',
          summary: summary || '',
          style: style || '',
          wordCount: wordCount || 0,
          aiScore: aiScore || null,
          humanScore: humanScore || null,
          status: 'draft',
        }).returning({ id: articleRewrites.id });
        
        return NextResponse.json({ 
          success: true, 
          id: result[0].id,
          message: '改写内容已保存' 
        });
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          error: String(error) 
        }, { status: 500 });
      }
    }

    if (action === 'list-rewrites') {
      try {
        const rewrites = await db()
          .select()
          .from(articleRewrites)
          .orderBy(articleRewrites.createdAt);
        
        return NextResponse.json({ 
          success: true, 
          articles: rewrites.map(r => ({
            id: r.id,
            title: r.title,
            content: r.content,
            summary: r.summary,
            style: r.style,
            wordCount: r.wordCount,
            aiScore: r.aiScore,
            status: r.status,
            createdAt: r.createdAt,
            sourceArticleIds: r.sourceArticleIds,
          }))
        });
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          error: String(error) 
        }, { status: 500 });
      }
    }

    if (action === 'delete-rewrite') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ 
          success: false, 
          error: '缺少文章ID' 
        }, { status: 400 });
      }
      
      try {
        await db()
          .delete(articleRewrites)
          .where(eq(articleRewrites.id, id));
        
        return NextResponse.json({ 
          success: true, 
          message: '文章已删除' 
        });
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          error: String(error) 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Create workshop error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function callWebSearch(keyword: string) {
  const prompt = `请搜索关于"${keyword}"的最新热点话题和趋势。返回5-10个相关的热门话题，每个话题包含标题和简要描述。`;
  
  try {
    const result = await callLLMWithPrompt(prompt, 0.7);
    return {
      success: true,
      searchResults: result,
    };
  } catch (error) {
    console.error('Web search failed:', error);
    return {
      success: false,
      error: '搜索失败，请稍后重试',
      searchResults: '',
    };
  }
}

async function decomposeArticle(content: string, title?: string) {
  const promptTemplate = await getPromptTemplate('decompose');
  const prompt = promptTemplate
    .replace('{content}', content);
  
  try {
    const resultText = await callLLMWithPrompt(prompt, 0.3);
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Decompose article failed:', error);
  }
  
  return {
    titleStrategy: '',
    openingStyle: '',
    framework: '',
    bodyProgression: '',
    endingDesign: '',
    styleAndPersona: '',
    emotionHooks: [],
    articleType: '',
    template: '',
    _decomposeFailed: true,
  };
}

async function generateOpening(params: { title: string; keyword: string; framework?: string; styleData?: { name: string; openingStyle?: string | null; languageStyle?: string | null; emotionalHooks?: string[] | null } | null; originalContent?: string }) {
  const styleContext = params.styleData ? `
【写作风格参考】
风格名称：${params.styleData.name}
${params.styleData.openingStyle ? `开头风格：${params.styleData.openingStyle}` : ''}
${params.styleData.languageStyle ? `语言风格：${params.styleData.languageStyle}` : ''}
${params.styleData.emotionalHooks?.length ? `情绪钩子：${params.styleData.emotionalHooks.join('、')}` : ''}
` : '';

  const promptTemplate = await getPromptTemplate('opening');
  const prompt = promptTemplate
    .replace('{originalContent}', params.originalContent || params.keyword || '')
    .replace('{title}', params.title)
    .replace('{keyword}', params.keyword || '')
    .replace('{framework}', params.framework || '无特定框架')
    + styleContext;

  try {
    const result = await callLLMWithPrompt(prompt, 0.8);
    return {
      success: true,
      opening: result,
    };
  } catch (error) {
    return {
      success: false,
      opening: '',
      error: String(error),
    };
  }
}

async function generateBody(params: { 
  title: string; 
  keyword?: string; 
  opening?: string; 
  framework?: string;
  articleType?: string;
  styleData?: { name: string; articleFramework?: string | null; contentProgression?: string | null; languageStyle?: string | null; template?: string | null } | null;
  originalContent?: string;
}) {
  const bodyTemplate = params.articleType === 'opinion' || params.articleType === 'story'
    ? `【观点类模板】
适用：探元素类/情绪共鸣类内容
开头场景引入
↓ 我的一句话论点是什么
↓ 我如何层层递进获得这个论点
↓ 每个论点的支撑信息或故事`
    : `【垂直赛道类模板】
适用：干货/专业/方法论内容
行业 + What（具体工具/场景/任务）
↓ How（可落地2-5步方法）
↓ Why（非必选，增强说服力）
生成标题：《[工具/方法]+[行业/场景]+[结果/收益]》`;

  const styleContext = params.styleData ? `
【写作风格参考】
风格名称：${params.styleData.name}
${params.styleData.articleFramework ? `文章框架：${params.styleData.articleFramework}` : ''}
${params.styleData.contentProgression ? `内容推进：${params.styleData.contentProgression}` : ''}
${params.styleData.languageStyle ? `语言风格：${params.styleData.languageStyle}` : ''}
${params.styleData.template ? `参考模板：${params.styleData.template.substring(0, 500)}` : ''}
` : '';

  const promptTemplate = await getPromptTemplate('body');
  const prompt = promptTemplate
    .replace('{originalContent}', params.originalContent || params.keyword || '')
    .replace('{title}', params.title)
    .replace('{opening}', params.opening || '')
    .replace('{framework}', params.framework || '无特定框架')
    .replace('{articleType}', params.articleType || 'tutorial')
    .replace('{bodyTemplate}', bodyTemplate)
    + styleContext;

  try {
    const result = await callLLMWithPrompt(prompt, 0.7);
    return {
      success: true,
      body: result,
    };
  } catch (error) {
    return {
      success: false,
      body: '',
      error: String(error),
    };
  }
}

async function generateEnding(params: { title: string; body: string; opening?: string; originalContent?: string }) {
  const promptTemplate = await getPromptTemplate('ending');
  const bodyPreview = params.body ? params.body.substring(0, 2000) : (params.originalContent?.substring(0, 1000) || '');
  const openingPreview = params.opening ? params.opening.substring(0, 800) : '';
  const prompt = promptTemplate
    .replace('{originalContent}', params.originalContent?.substring(0, 2000) || '')
    .replace('{title}', params.title)
    .replace('{body}', bodyPreview)
    .replace('{opening}', openingPreview);

  try {
    const result = await callLLMWithPrompt(prompt, 0.9);
    return {
      success: true,
      ending: result,
    };
  } catch (error) {
    return {
      success: false,
      ending: '',
      error: String(error),
    };
  }
}

async function fullCreationWorkflow(params: {
  keyword: string;
  title: string;
  originalContent?: string;
  style?: string;
  styleData?: { 
    name: string; 
    openingStyle?: string | null; 
    articleFramework?: string | null; 
    contentProgression?: string | null; 
    languageStyle?: string | null; 
    endingDesign?: string | null;
    emotionalHooks?: string[] | null;
    template?: string | null;
  } | null;
}) {
  const results = {
    decompose: null as Record<string, unknown> | null,
    opening: '',
    body: '',
    ending: '',
  };

  try {
    let decomposeData: Record<string, unknown> | null = null;
    
    if (params.originalContent) {
      const decomposePromptTemplate = await getPromptTemplate('decompose');
      const decomposePrompt = decomposePromptTemplate
        .replace('{content}', params.originalContent);
      
      const decomposeText = await callLLMWithPrompt(decomposePrompt, 0.3);
      const jsonMatch = decomposeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decomposeData = JSON.parse(jsonMatch[0]);
        results.decompose = decomposeData;
      }
    }

    const framework = (decomposeData?.framework as string) || params.styleData?.articleFramework || '无特定框架';
    const articleType = (decomposeData?.articleType as string) || 'tutorial';
    
    const originalContentForPrompt = params.originalContent || params.keyword || '';

    const styleContext = params.styleData ? `
【写作风格参考】
风格名称：${params.styleData.name}
${params.styleData.openingStyle ? `开头风格：${params.styleData.openingStyle}` : ''}
${params.styleData.languageStyle ? `语言风格：${params.styleData.languageStyle}` : ''}
${params.styleData.emotionalHooks?.length ? `情绪钩子：${params.styleData.emotionalHooks.join('、')}` : ''}
` : '';

    const openingPromptTemplate = await getPromptTemplate('opening');
    const openingPrompt = openingPromptTemplate
      .replace('{originalContent}', originalContentForPrompt)
      .replace('{title}', params.title)
      .replace('{keyword}', params.keyword || '')
      .replace('{framework}', framework)
      + styleContext;
    
    console.error('[创作流程] 步骤1: 生成开头...');
    const openingResult = await callLLMWithPrompt(openingPrompt, 0.8);

    if (!openingResult) {
      console.error('[创作流程] 警告: 开头为空！');
    }
    
    results.opening = openingResult || '';

    const bodyTemplate = articleType === 'opinion' || articleType === 'story'
      ? `【观点类模板】开头场景引入→论点→层层递进→支撑信息或故事`
      : `【垂直赛道类模板】行业+What→How→Why`;

    const bodyStyleContext = params.styleData ? `
【写作风格参考】
风格名称：${params.styleData.name}
${params.styleData.articleFramework ? `文章框架：${params.styleData.articleFramework}` : ''}
${params.styleData.contentProgression ? `内容推进：${params.styleData.contentProgression}` : ''}
${params.styleData.languageStyle ? `语言风格：${params.styleData.languageStyle}` : ''}
${params.styleData.template ? `参考模板：${params.styleData.template.substring(0, 500)}` : ''}
` : '';

    const bodyPromptTemplate = await getPromptTemplate('body');
    const bodyPrompt = bodyPromptTemplate
      .replace('{originalContent}', originalContentForPrompt)
      .replace('{title}', params.title)
      .replace('{opening}', openingResult || '') 
      .replace('{framework}', framework)
      .replace('{articleType}', articleType)
      .replace('{bodyTemplate}', bodyTemplate)
      + bodyStyleContext;

    console.error('[创作流程] 步骤2: 根据开头生成正文...');
    const bodyResult = await callLLMWithPrompt(bodyPrompt, 0.7);

    if (!bodyResult) {
      console.error('[创作流程] 警告: 正文为空！');
    }

    results.body = bodyResult || '';

    const endingStyleContext = params.styleData ? `
【写作风格参考】
风格名称：${params.styleData.name}
${params.styleData.endingDesign ? `结尾设计：${params.styleData.endingDesign}` : ''}
` : '';

    const endingPromptTemplate = await getPromptTemplate('ending');
    const bodyPreview = bodyResult.substring(0, 1000);
    const openingPreview = openingResult.substring(0, 300);

    const endingPrompt = endingPromptTemplate
      .replace('{originalContent}', originalContentForPrompt)
      .replace('{title}', params.title)
      .replace('{opening}', openingPreview)
      .replace('{body}', bodyPreview)
      + endingStyleContext;

    const endingResult = await callLLMWithPrompt(endingPrompt, 0.8);
    results.ending = endingResult;

    return {
      success: true,
      ...results,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      ...results,
    };
  }
}

async function generateArticle(params: { keyword: string; title?: string; style?: string; searchResults?: string }) {
  const prompt = `你是一位公众号写作专家。请根据以下信息创作一篇高质量的文章。

主题关键词：${params.keyword}
${params.title ? `标题：${params.title}` : ''}
${params.searchResults ? `搜索参考：${params.searchResults.substring(0, 1000)}` : ''}

文章结构要求：
1. 开头（150-200字）：身份+痛点+确定结果
2. 正文（800-1200字）：3-5个核心观点，每个观点配案例
3. 结尾（100-150字）：总结+行动建议+互动引导

请直接输出文章内容，不要添加任何解释。`;

  try {
    const result = await callLLMWithPrompt(prompt, 0.8);
    return {
      success: true,
      content: result,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: String(error),
    };
  }
}

async function checkAIContent(content: string) {
  const { detectAIPatterns, getHumanizationSuggestions, checkPublishReadiness } = await import('@/lib/ai-detection/service');
  
  const detectionResult = detectAIPatterns(content);
  const suggestions = getHumanizationSuggestions(detectionResult);
  const readiness = checkPublishReadiness(detectionResult);
  
  const promptTemplate = await getPromptTemplate('check-ai');
  const prompt = promptTemplate
    .replace('{content}', content.substring(0, 3000));

  try {
    const resultText = await callLLMWithPrompt(prompt, 0.3);
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const llmResult = JSON.parse(jsonMatch[0]);
      
      const combinedScore = Math.round((detectionResult.score + (llmResult.score || 70)) / 2);
      
      return {
        score: combinedScore,
        qualityScore: {
          ...detectionResult.qualityScore,
          ...llmResult.qualityScore,
        },
        detectedPatterns: detectionResult.detectedPatterns.length > 0 
          ? detectionResult.detectedPatterns 
          : llmResult.detectedPatterns || [],
        issues: [...new Set([...detectionResult.issues, ...(llmResult.issues || [])])],
        suggestions: [...new Set([...suggestions, ...(llmResult.suggestions || [])])],
        highlightedParts: [...detectionResult.highlightedParts, ...(llmResult.highlightedParts || [])],
        passed: detectionResult.passed && combinedScore >= 90,
        publishReadiness: readiness,
      };
    }
  } catch {
    // ignore parse error
  }
  
  return {
    score: detectionResult.score,
    qualityScore: detectionResult.qualityScore,
    detectedPatterns: detectionResult.detectedPatterns,
    issues: detectionResult.issues,
    suggestions,
    highlightedParts: detectionResult.highlightedParts,
    passed: detectionResult.passed,
    publishReadiness: readiness,
  };
}

async function humanizeContent(content: string) {
  const promptTemplate = await getPromptTemplate('humanize');
  const prompt = promptTemplate
    .replace('{content}', content);

  try {
    const result = await callLLMWithPrompt(prompt, 0.9);
    return {
      success: true,
      content: result,
    };
  } catch (error) {
    return {
      success: false,
      content: content,
      error: String(error),
    };
  }
}

async function polishContent(content: string, options?: {
  aiCheckResult?: {
    issues?: string[];
    suggestions?: string[];
    detectedPatterns?: Array<{ name: string; description: string }>;
  };
  previousScore?: number;
  previousIssues?: string[];
  previousSuggestions?: string[];
}) {
  const promptTemplate = await getPromptTemplate('polish');
  
  const isRePolish = options?.previousScore !== undefined;
  
  let issuesText: string;
  let suggestionsText: string;
  
  if (isRePolish && options.previousIssues && options.previousSuggestions) {
    issuesText = `【上一次润色后仍存在的问题】
${options.previousIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

【需要针对性改进的建议】
${options.previousSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

【优化目标】
请针对以上问题进行针对性改进，确保每次润色后分数都能提升，不要重复之前的优化方向。`;
    suggestionsText = '';
  } else if (options?.aiCheckResult) {
    issuesText = options.aiCheckResult.issues?.length 
      ? options.aiCheckResult.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
      : '暂无具体问题，请根据润色原则进行优化';
    
    suggestionsText = options.aiCheckResult.suggestions?.length 
      ? options.aiCheckResult.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '请增加口语化表达和个人视角';
  } else {
    issuesText = '暂无具体问题，请根据润色原则进行优化';
    suggestionsText = '请增加口语化表达和个人视角';
  }
  
  const prompt = promptTemplate
    .replace('{content}', content)
    .replace('{issues}', issuesText)
    .replace('{suggestions}', suggestionsText);

  try {
    let result = await callLLMWithPrompt(prompt, 0.8);
    
    result = result
      .replace(/^#\s*润色.*?\n/gi, '')
      .replace(/^---+\n?/gm, '')
      .replace(/\*本文由.*?\*$/gm, '')
      .replace(/\(本文由.*?\)$/gm, '')
      .replace(/本文由公众号文章润色专家优化/g, '')
      .replace(/^\s*\n/gm, '\n')
      .trim();
    
    const newAiCheckResult = await checkAIContent(result);
    
    return {
      success: true,
      content: result,
      aiCheckResult: newAiCheckResult,
    };
  } catch (error) {
    return {
      success: false,
      content: content,
      error: String(error),
    };
  }
}

async function evaluateTitles(titles: string[], originalTitle?: string) {
  const originalTitleContext = originalTitle
    ? `【原标题参考标准】
原标题：${originalTitle}
说明：这是原文章的标题，作为高水准的参考标准，其他标题应以此为基准进行对比评分。`
    : '';

  const promptTemplate = await getPromptTemplate('evaluate-title');
  const prompt = promptTemplate
    .replace('{originalTitleContext}', originalTitleContext)
    .replace('{titles}', titles.map((t, i) => `${i + 1}. ${t}`).join('\n'));

  try {
    const resultText = await callLLMWithPrompt(prompt, 0.3);
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      const evaluations = result.evaluations || [];
      return evaluations.map((e: { 
        title: string; 
        clickScore?: number; 
        viralScore?: number; 
        relevanceScore?: number; 
        qualityScore?: number; 
        totalScore?: number; 
        analysis?: string; 
        highlights?: string[] 
      }) => ({
        title: e.title || '',
        clickScore: e.clickScore || 0,
        viralScore: e.viralScore || 0,
        relevanceScore: e.relevanceScore || 0,
        qualityScore: e.qualityScore || 0,
        totalScore: e.totalScore || 0,
        analysis: e.analysis || '',
        highlights: e.highlights || [],
      }));
    }
  } catch {
    // ignore parse error
  }
  
  return [];
}

async function generateTitles(params: { keyword: string; content?: string; style?: string; originalTitle?: string; readCount?: number; styleData?: { name: string; titleStrategy?: string | null; exampleTitles?: string[] | null } | null }) {
  if (params.readCount && params.readCount >= 50000 && params.originalTitle) {
    return { titles: [params.originalTitle] };
  }

  const contentContext = params.content
    ? `文章内容摘要：${params.content.substring(0, 500)}...`
    : '';

  const styleContext = params.styleData ? `
【写作风格参考】
风格名称：${params.styleData.name}
${params.styleData.titleStrategy ? `标题策略：${params.styleData.titleStrategy}` : ''}
${params.styleData.exampleTitles?.length ? `参考标题示例：${params.styleData.exampleTitles.slice(0, 3).join('、')}` : ''}
` : '';

  const promptTemplate = await getPromptTemplate('title');
  const prompt = promptTemplate
    .replace('{keyword}', params.keyword)
    .replace('{contentContext}', contentContext + styleContext);

  try {
    const resultText = await callLLMWithPrompt(prompt, 0.9);
    const jsonMatch = resultText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return { titles: JSON.parse(jsonMatch[0]) };
    }
  } catch {
    // ignore parse error
  }
  
  return { titles: [] };
}

async function analyzeContentType(content: string, title?: string) {
  const titleContext = title ? `标题：${title}` : '';
  const promptTemplate = await getPromptTemplate('analyze-content');
  const prompt = promptTemplate
    .replace('{titleContext}', titleContext)
    .replace('{content}', content.substring(0, 2000));

  try {
    const resultText = await callLLMWithPrompt(prompt, 0.3);
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        type: result.type || 'unknown',
        typeName: result.typeName || '未知类型',
        confidence: result.confidence || 50,
        features: result.features || [],
        suggestions: result.suggestions || [],
        styleKeywords: result.styleKeywords || [],
      };
    }
  } catch {
    // ignore parse error
  }
  
  return {
    type: 'unknown',
    typeName: '未知类型',
    confidence: 0,
    features: [],
    suggestions: [],
    styleKeywords: [],
  };
}

async function rewriteArticle(
  params: { 
    keyword: string; 
    title?: string; 
    style?: string; 
    searchResults?: string;
    contentType?: string;
    styleKeywords?: string[];
    originalContent?: string;
  }
) {
  const contentTypeGuides: Record<string, string> = {
    book: `
【书籍摘录类改写策略】
1. 保留原书的核心观点和理论框架
2. 提取书中的金句和精彩论述
3. 用通俗语言解释专业概念
4. 补充现实案例帮助理解
5. 结构：观点引入 → 理论阐述 → 案例解读 → 实践建议
6. 保持原文的深度和思想性`,
    
    story: `
【故事类改写策略】
1. 保留故事的核心情节和人物关系
2. 保持原文的叙事风格和情感基调
3. 提炼故事中的情感转折点
4. 增强场景描写的画面感
5. 结构：场景铺垫 → 冲突展开 → 情感高潮 → 结局升华
6. 让读者产生情感共鸣`,
    
    news: `
【新闻资讯类改写策略】
1. 提取核心事件和关键数据
2. 保持客观中立的叙述立场
3. 补充背景信息帮助理解
4. 分析事件影响和意义
5. 结构：事件概述 → 详细报道 → 背景分析 → 未来展望
6. 确保信息准确、时效性强`,
    
    opinion: `
【观点评论类改写策略】
1. 保留原文的核心论点和立场
2. 梳理论证逻辑和论据
3. 补充支撑论点的案例
4. 增强论证的说服力
5. 结构：观点提出 → 论证展开 → 案例支撑 → 总结升华
6. 保持观点鲜明、论证有力`,
    
    tutorial: `
【教程干货类改写策略】
1. 保留核心方法和步骤
2. 确保操作流程清晰易懂
3. 补充注意事项和常见问题
4. 增加实操案例和效果展示
5. 结构：问题引入 → 方法讲解 → 步骤演示 → 效果验证
6. 让读者能直接上手操作`,
  };

  const typeGuide = contentTypeGuides[params.contentType || 'book'] || contentTypeGuides.book;
  const styleKeywordsStr = params.styleKeywords?.length ? params.styleKeywords.join('、') : '';
  
  const prompt = `你是一位公众号写作专家。请根据原文进行改写创作。

【原文内容】
${params.originalContent?.substring(0, 3000) || ''}

【改写要求】
${typeGuide}

${styleKeywordsStr ? `【原文风格关键词】
${styleKeywordsStr}
请在改写中保留这些风格特色` : ''}

${params.title ? `【目标标题】
${params.title}` : ''}

【改写原则】
1. 不是简单洗稿，而是深度理解和再创作
2. 保留原文精华，补充必要内容
3. 语言要自然流畅，像真人写的
4. 适当加入个人视角和情感
5. 确保内容有价值、有深度

请直接输出改写后的文章内容，不要添加任何解释。`;

  try {
    const result = await callLLMWithPrompt(prompt, 0.7);
    return {
      success: true,
      content: result,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: String(error),
    };
  }
}

async function prePublishEvaluation(content: string, title?: string) {
  const { detectAIPatterns, checkPublishReadiness, getHumanizationSuggestions } = await import('@/lib/ai-detection/service');
  
  const detectionResult = detectAIPatterns(content);
  const readiness = checkPublishReadiness(detectionResult);
  const suggestions = getHumanizationSuggestions(detectionResult);
  
  const sopChecklist = [
    { item: '标题三模型', passed: true, score: 20 },
    { item: '开头三要素', passed: detectionResult.qualityScore.authenticity >= 6, score: 15 },
    { item: '正文专业感三要素', passed: detectionResult.qualityScore.trust >= 6, score: 20 },
    { item: '结尾三要素', passed: detectionResult.qualityScore.directness >= 6, score: 15 },
    { item: 'AI去味检查', passed: detectionResult.passed, score: 20 },
    { item: '内容配比', passed: true, score: 10 },
  ];
  
  const totalScore = sopChecklist.reduce((sum, item) => sum + (item.passed ? item.score : 0), 0);
  
  const userCheckPrompt = `
【发布前用户检查清单】

请确认以下内容：
1. □ 标题是否吸引人？是否符合三模型？
2. □ 开头是否有点明身份+痛点+确定结果？
3. □ 正文是否有个人故事和口语化表达？
4. □ 结尾是否有总结+行动引导+悬念？
5. □ 是否有敏感词或违规内容？
6. □ 配图是否与内容相关？
7. □ 是否有错别字或语病？

建议在发布前：
- 预览文章在手机端的显示效果
- 检查排版是否舒适
- 确认封面图是否吸引人
`;

  return {
    score: totalScore,
    passed: totalScore >= 90,
    aiDetection: {
      score: detectionResult.score,
      qualityScore: detectionResult.qualityScore,
      detectedPatterns: detectionResult.detectedPatterns,
    },
    readiness,
    suggestions,
    sopChecklist,
    userCheckPrompt,
  };
}

async function fullSOPWorkflow(params: {
  keyword: string;
  style?: string;
  layout?: string;
  originalContent?: string;
  originalTitle?: string;
  readCount?: number;
  styleData?: Record<string, unknown> | null;
  layoutData?: Record<string, unknown> | null;
}) {
  const { detectAIPatterns, checkPublishReadiness } = await import('@/lib/ai-detection/service');
  
  const result: {
    step: number;
    stepName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    data?: Record<string, unknown>;
    error?: string;
  }[] = [
    { step: 1, stepName: '配置解析', status: 'completed', data: { style: (params.styleData as { name?: string })?.name, layout: (params.layoutData as { name?: string })?.name } },
    { step: 2, stepName: '选题撰写', status: 'pending' },
    { step: 3, stepName: 'AI去味', status: 'pending' },
    { step: 4, stepName: '生成配图', status: 'pending' },
    { step: 5, stepName: '发布草稿', status: 'pending' },
    { step: 6, stepName: '用户检查', status: 'pending' },
  ];
  
  try {
    const contentSource = params.originalContent || params.keyword;
    
    result[1].status = 'in_progress';
    
    let bestTitle: string;
    let titles: { titles: string[] };
    
    if (params.readCount && params.readCount >= 50000 && params.originalTitle) {
      bestTitle = params.originalTitle;
      titles = { titles: [params.originalTitle] };
    } else {
      const generatedTitles = await generateTitles({ 
        keyword: params.keyword, 
        content: contentSource,
        styleData: params.styleData,
        originalTitle: params.originalTitle,
        readCount: params.readCount
      });
      titles = generatedTitles;
      bestTitle = titles.titles?.[0] || params.keyword;
    }
    
    const articleResult = await fullCreationWorkflow({
      keyword: params.keyword,
      title: bestTitle,
      originalContent: contentSource,
      style: params.style,
      styleData: params.styleData,
    });
    
    result[1].status = 'completed';
    result[1].data = { 
      titles: titles.titles, 
      selectedTitle: bestTitle,
      contentSource: params.originalContent ? '已有文章改写' : '关键词创作',
      ...articleResult 
    };
    
    if (!articleResult.success) {
      result[1].status = 'failed';
      result[1].error = (articleResult as { error?: string }).error || '文章生成失败';
      return { success: false, steps: result };
    }
    
    const fullContent = `${articleResult.opening}\n\n${articleResult.body}\n\n${articleResult.ending}`;
    
    result[2].status = 'in_progress';
    let currentContent = fullContent;
    let aiCheck = await checkAIContent(currentContent);
    let polishAttempts = 0;
    const maxPolishAttempts = 3;
    
    while (!aiCheck.passed && polishAttempts < maxPolishAttempts) {
      result[2].data = { 
        ...aiCheck, 
        message: `AI检测分数${aiCheck.score}，正在进行第${polishAttempts + 1}次润色优化...` 
      };
      
      const polishResult = await polishContent(currentContent, {
        aiCheckResult: aiCheck,
        previousScore: aiCheck.score,
        previousIssues: aiCheck.issues,
        previousSuggestions: aiCheck.suggestions
      });
      if (polishResult.success) {
        currentContent = polishResult.content;
        aiCheck = await checkAIContent(currentContent);
        polishAttempts++;
      } else {
        break;
      }
    }
    
    result[2].status = 'completed';
    result[2].data = aiCheck;
    
    if (!aiCheck.passed) {
      result[2].error = `经过${polishAttempts}次润色后AI检测分数${aiCheck.score}，建议人工优化`;
    } else {
      // 润色成功
    }
    
    const finalParts = currentContent.split('\n\n');
    const finalOpening = finalParts[0] || articleResult.opening;
    const finalBody = finalParts.slice(1, -1).join('\n\n') || articleResult.body;
    const finalEnding = finalParts[finalParts.length - 1] || articleResult.ending;
    
    result[3].status = 'completed';
    result[3].data = { message: '图片将在发布时生成' };
    
    result[4].status = 'pending';
    result[4].data = { message: '等待用户确认发布' };
    
    result[5].status = 'pending';
    result[5].data = { 
      checkPrompt: `
【发布前用户检查清单】
标题：${bestTitle}
AI检测分数：${aiCheck.score}

请确认：
1. □ 标题是否吸引人？
2. □ 开头是否有身份+痛点+确定结果？
3. □ 正文是否有个人故事？
4. □ 结尾是否有总结+行动引导+悬念？
5. □ 是否有敏感词？
6. □ 配图是否相关？
7. □ 是否有错别字？
` 
    };
    
    return {
      success: true,
      steps: result,
      article: {
        title: bestTitle,
        opening: finalOpening,
        body: finalBody,
        ending: finalEnding,
        fullContent: currentContent,
      },
      aiCheck,
    };
    
  } catch (error) {
    const failedStep = result.find(r => r.status === 'in_progress');
    if (failedStep) {
      failedStep.status = 'failed';
      failedStep.error = String(error);
    }
    return { success: false, steps: result, error: String(error) };
  }
}
