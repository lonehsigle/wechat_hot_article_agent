import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collectedArticles, articleRewrites, hotTopics } from '@/lib/db/schema';
import { inArray, eq } from 'drizzle-orm';
import { callLLM, checkAIContent, removeAIFlavor } from '@/lib/llm/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'rewrite') {
      const { articleIds, style, removeAI } = body;
      return await handleRewrite(articleIds, style, removeAI);
    }

    if (action === 'rewrite-direct') {
      const { content, title, style } = body;
      return await handleRewriteDirect(content, title, style);
    }

    if (action === 'rewrite-from-topics') {
      const { topicIds, style, removeAI } = body;
      return await handleRewriteFromTopics(topicIds, style, removeAI);
    }

    if (action === 'check-ai') {
      const { content } = body;
      return await handleCheckAI(content);
    }

    if (action === 'remove-ai') {
      const { content } = body;
      return await handleRemoveAI(content);
    }

    if (action === 'list-rewrites') {
      return await handleListRewrites();
    }

    if (action === 'get-rewrite') {
      const { id } = body;
      return await handleGetRewrite(id);
    }

    if (action === 'update-rewrite') {
      const { id, content, title } = body;
      return await handleUpdateRewrite(id, content, title);
    }

    if (action === 'delete-rewrite') {
      const { id } = body;
      return await handleDeleteRewrite(id);
    }

    if (!action && body.content) {
      return await handleRewriteDirect(body.content, body.title, body.style);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Rewrite API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function handleRewriteDirect(
  content: string,
  title?: string,
  style: string = '专业正式'
) {
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const systemPrompt = `你是一位专业的公众号内容创作者，擅长将文章改写成高质量的原创内容。

改写原则：
1. **保留核心信息**：保留原文的核心观点和关键信息
2. **语言润色**：使用更生动、口语化的表达
3. **结构调整**：优化段落结构，使用小标题提高可读性
4. **观点升华**：加入自己的见解和分析
5. **去AI味**：避免使用AI常见的表达方式

风格要求：${style}

输出格式：
- 标题（吸引眼球）
- 导语（100字左右）
- 正文（分段落，有小标题）
- 结语（总结升华）

请确保内容原创，避免直接复制原文。`;

  const userPrompt = `请将以下文章改写成${style}风格的原创文章：

标题：${title || '无标题'}

正文：
${content}

要求：
1. 字数：1500-2500字
2. 保留核心观点，重新组织语言
3. 加入自己的分析和见解
4. 语言口语化，适合公众号阅读
5. 避免AI痕迹，像真人写作`;

  let rewrittenContent: string;
  try {
    const response = await callLLM([
      { role: 'user', content: systemPrompt + '\n\n' + userPrompt },
    ], { temperature: 0.8, maxTokens: 4096 });
    
    rewrittenContent = response.content;
  } catch (error) {
    console.error('Rewrite failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Rewrite failed' 
    }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    result: rewrittenContent,
    wordCount: rewrittenContent.length,
  });
}

async function handleRewrite(
  articleIds: number[], 
  style: string = '综合类',
  removeAI: boolean = true
) {
  if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
    return NextResponse.json({ error: 'articleIds is required' }, { status: 400 });
  }

  const articles = await db().select()
    .from(collectedArticles)
    .where(inArray(collectedArticles.id, articleIds));

  if (articles.length === 0) {
    return NextResponse.json({ error: 'No articles found' }, { status: 404 });
  }

  const systemPrompt = buildRewriteSystemPrompt(style);
  const userPrompt = buildRewriteUserPrompt(articles, style);

  let rewrittenContent: string;
  try {
    const response = await callLLM([
      { role: 'user', content: systemPrompt + '\n\n' + userPrompt },
    ], { temperature: 0.8, maxTokens: 4096 });
    
    rewrittenContent = response.content;
  } catch (error) {
    rewrittenContent = generateFallbackContent(articles, style);
  }

  let finalContent = rewrittenContent;
  let aiScore = 50;
  let humanScore = 50;

  if (removeAI) {
    try {
      const aiCheck = await checkAIContent(rewrittenContent);
      aiScore = aiCheck.score;
      humanScore = 100 - aiScore;

      if (aiScore > 40) {
        finalContent = await removeAIFlavor(rewrittenContent);
      }
    } catch {
      // 保持原内容
    }
  }

  const title = articles.length === 1 
    ? articles[0].title 
    : `深度解析：${articles[0].title.substring(0, 15)}等${articles.length}个热点`;

  const [rewrite] = await db().insert(articleRewrites).values({
    sourceArticleIds: articleIds,
    title,
    content: finalContent,
    summary: articles.map(a => a.digest).filter(Boolean).join(' ').substring(0, 200),
    style,
    wordCount: finalContent.length,
    aiScore,
    humanScore,
    status: 'draft',
  }).returning();

  return NextResponse.json({ 
    success: true, 
    article: rewrite,
    stats: {
      originalCount: articles.length,
      wordCount: finalContent.length,
      aiScore,
      humanScore,
    }
  });
}

async function handleRewriteFromTopics(
  topicIds: number[],
  style: string = '热点评论',
  removeAI: boolean = true
) {
  if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
    return NextResponse.json({ error: 'topicIds is required' }, { status: 400 });
  }

  const topics = await db().select()
    .from(hotTopics)
    .where(inArray(hotTopics.id, topicIds));

  if (topics.length === 0) {
    return NextResponse.json({ error: 'No topics found' }, { status: 404 });
  }

  const systemPrompt = `你是一位资深的自媒体内容创作者，擅长撰写热点评论文章。

写作要求：
1. 标题要吸引眼球，使用数字、疑问句或对比手法
2. 开头要抓住读者注意力，可以用故事或数据引入
3. 正文要有逻辑层次，使用小标题分段
4. 结尾要有升华，给读者启发或行动建议
5. 语言要口语化，避免书面语
6. 适当使用金句和比喻
7. 风格：${style}

请根据提供的热点话题，创作一篇有深度的评论文章。`;

  const topicsInfo = topics.map(t => ({
    title: t.title,
    platform: t.platform,
    description: t.description,
    hotValue: t.hotValue,
    category: t.category,
  }));

  const userPrompt = `请根据以下热点话题创作一篇文章：

${topics.map((t, i) => `
${i + 1}. 【${t.platform}】${t.title}
   热度：${t.hotValue?.toLocaleString() || '未知'}
   分类：${t.category || '未知'}
   描述：${t.description || '无'}
`).join('\n')}

要求：
- 字数：1500-2500字
- 风格：${style}
- 要有自己的观点和见解
- 结合多个热点进行深度分析`;

  let content: string;
  try {
    const response = await callLLM([
      { role: 'user', content: systemPrompt + '\n\n' + userPrompt },
    ], { temperature: 0.8, maxTokens: 4096 });
    
    content = response.content;
  } catch (error) {
    content = generateFallbackTopicContent(topics, style);
  }

  let finalContent = content;
  let aiScore = 50;
  let humanScore = 50;

  if (removeAI) {
    try {
      const aiCheck = await checkAIContent(content);
      aiScore = aiCheck.score;
      humanScore = 100 - aiScore;

      if (aiScore > 40) {
        finalContent = await removeAIFlavor(content);
      }
    } catch {
      // 保持原内容
    }
  }

  const title = topics.length === 1 
    ? topics[0].title 
    : `热点速递：${topics[0].title.substring(0, 10)}等${topics.length}个热点深度解析`;

  const [rewrite] = await db().insert(articleRewrites).values({
    sourceArticleIds: topicIds,
    title,
    content: finalContent,
    summary: topics.map(t => t.description).filter(Boolean).join(' ').substring(0, 200),
    style,
    wordCount: finalContent.length,
    aiScore,
    humanScore,
    status: 'draft',
  }).returning();

  return NextResponse.json({ 
    success: true, 
    article: rewrite,
    stats: {
      topicCount: topics.length,
      wordCount: finalContent.length,
      aiScore,
      humanScore,
    }
  });
}

async function handleCheckAI(content: string) {
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  try {
    const result = await checkAIContent(content);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Check failed' 
    }, { status: 500 });
  }
}

async function handleRemoveAI(content: string) {
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  try {
    const result = await removeAIFlavor(content);
    return NextResponse.json({ success: true, content: result });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Remove AI failed' 
    }, { status: 500 });
  }
}

async function handleListRewrites() {
  const rewrites = await db().select()
    .from(articleRewrites)
    .orderBy(articleRewrites.createdAt);
  
  return NextResponse.json({ success: true, rewrites });
}

async function handleGetRewrite(id: number) {
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const [rewrite] = await db().select()
    .from(articleRewrites)
    .where(eq(articleRewrites.id, id));
  
  if (!rewrite) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, rewrite });
}

async function handleUpdateRewrite(id: number, content: string, title?: string) {
  if (!id || !content) {
    return NextResponse.json({ error: 'id and content are required' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    content,
    wordCount: content.length,
    updatedAt: new Date(),
  };

  if (title) {
    updateData.title = title;
  }

  const [rewrite] = await db().update(articleRewrites)
    .set(updateData)
    .where(eq(articleRewrites.id, id))
    .returning();

  return NextResponse.json({ success: true, rewrite });
}

async function handleDeleteRewrite(id: number) {
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  await db().delete(articleRewrites).where(eq(articleRewrites.id, id));
  
  return NextResponse.json({ success: true });
}

function buildRewriteSystemPrompt(style: string): string {
  const styleGuides: Record<string, string> = {
    '综合类': '客观分析，多角度解读，适合大众阅读',
    '深度分析': '专业视角，数据支撑，逻辑严密',
    '情感共鸣': '情感导向，故事性强，引发共鸣',
    '热点评论': '观点鲜明，时效性强，引发讨论',
    '干货分享': '实用为主，步骤清晰，可操作性强',
    '故事叙述': '叙事为主，情节生动，代入感强',
  };

  return `你是一位专业的公众号内容创作者，擅长将多篇文章融合成一篇高质量的原创文章。

写作原则：
1. **去重融合**：提取各篇文章的核心观点，避免重复
2. **逻辑重组**：按照新的逻辑结构组织内容，不是简单拼接
3. **语言润色**：使用更生动、口语化的表达
4. **观点升华**：加入自己的见解和分析
5. **结构优化**：使用小标题、列表等提高可读性

风格要求：${styleGuides[style] || styleGuides['综合类']}

输出格式：
- 标题（吸引眼球）
- 导语（100字左右）
- 正文（分段落，有小标题）
- 结语（总结升华）

请确保内容原创，避免直接复制原文。`;
}

function buildRewriteUserPrompt(articles: typeof collectedArticles.$inferSelect[], style: string): string {
  const articlesContent = articles.map((a, i) => `
【文章${i + 1}】${a.title}
${a.digest || ''}
${a.content?.substring(0, 1500) || ''}
`).join('\n---\n');

  return `请将以下${articles.length}篇文章融合成一篇${style}风格的原创文章：

${articlesContent}

要求：
1. 字数：1500-2500字
2. 融合各篇文章的核心观点
3. 加入自己的分析和见解
4. 语言口语化，适合公众号阅读`;
}

function generateFallbackContent(articles: typeof collectedArticles.$inferSelect[], style: string): string {
  const title = articles.length === 1 
    ? articles[0].title 
    : `深度解析：${articles[0].title.substring(0, 15)}等${articles.length}个话题`;

  return `# ${title}

## 核心要点

${articles.map((a, i) => `${i + 1}. ${a.digest || a.title}`).join('\n')}

## 详细分析

${articles.map(a => `
### ${a.title}

${a.content?.substring(0, 500) || a.digest || '暂无详细内容'}

`).join('\n')}

---

*本文综合${articles.length}篇文章内容，风格：${style}*
`;
}

function generateFallbackTopicContent(topics: typeof hotTopics.$inferSelect[], style: string): string {
  const title = topics.length === 1 
    ? topics[0].title 
    : `热点速递：${topics[0].title.substring(0, 10)}等${topics.length}个热点`;

  return `# ${title}

## 今日热点概览

${topics.map((t, i) => `${i + 1}. **${t.title}**（${t.platform}，热度${t.hotValue?.toLocaleString() || '未知'}）`).join('\n')}

## 详细解读

${topics.map(t => `
### ${t.title}

**平台**：${t.platform}  
**热度**：${t.hotValue?.toLocaleString() || '未知'}  
**分类**：${t.category || '未知'}

${t.description || '该话题正在持续发酵中，引发广泛关注。'}

`).join('\n')}

## 总结

以上是今日热点话题的汇总分析，建议持续关注后续发展。

---

*本文为热点聚合内容，风格：${style}*
`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'list') {
    const rewrites = await db().select()
      .from(articleRewrites)
      .orderBy(articleRewrites.createdAt);
    
    return NextResponse.json({ success: true, rewrites });
  }

  if (action === 'get') {
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [rewrite] = await db().select()
      .from(articleRewrites)
      .where(eq(articleRewrites.id, parseInt(id)));
    
    if (!rewrite) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, rewrite });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
