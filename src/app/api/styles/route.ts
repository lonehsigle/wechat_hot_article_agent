import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writingStyles, layoutStyles } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { callLLM, type LLMMessage } from '@/lib/llm/service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

async function callLLMWithPrompt(prompt: string, temperature: number = 0.7, maxTokens: number = 3000): Promise<string> {
  const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
  const result = await callLLM(messages, { temperature, maxTokens });
  return result.content;
}

interface StyleAnalysis {
  name: string;
  titleStrategy: string;
  openingStyle: string;
  articleFramework: string;
  contentProgression: string;
  endingDesign: string;
  languageStyle: string;
  emotionalHooks: string[];
  articleType: string;
  template: string;
  exampleTitles: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'writing';
    const database = db();

    if (type === 'layout') {
      const styles = await database.select().from(layoutStyles).orderBy(desc(layoutStyles.createdAt));
      return successResponse(styles);
    }

    const styles = await database.select().from(writingStyles).orderBy(desc(writingStyles.createdAt));
    return successResponse(styles);
  } catch (error) {
    console.error('Styles API error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const { action, articles, styleName, styleId } = body as {
    action: string; articles?: { title: string; content: string }[]; styleName?: string; styleId?: number;
  };

  if (action === 'analyze') {
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ success: false, error: '请提供至少一篇文章进行分析' }, { status: 400 });
    }

    const analysisPrompt = `你是一个顶级的公众号爆款文案专家和SOP拆解教练。

请帮我拆解以下${articles.length}篇对标账号的文章，输出详细分析：

${articles.map((a: { title: string; content: string }, i: number) => `
--- 文章${i + 1} ---
标题：${a.title}
正文：
${a.content}
`).join('\n')}

请按以下格式输出JSON分析结果：
{
  "titleStrategy": "标题策略分析（共同公式、常用句式、关键词规律）",
  "openingStyle": "开头引入方式（痛点/故事/冲突/金句，具体分析）",
  "articleFramework": "文章框架（问题+对策/案例+启发/清单体等，详细说明）",
  "contentProgression": "正文推进方式（案例类型、论证方法、节奏把控）",
  "endingDesign": "结尾设计（引导方式/金句/总结，具体分析）",
  "languageStyle": "语言风格与人设（口语化程度、情感表达、专业度）",
  "emotionalHooks": ["情绪钩子位置1", "情绪钩子位置2"],
  "articleType": "文章类型分类",
  "template": "提炼出的可复制写作模版（像填空题，用户可直接填充内容）",
  "exampleTitles": ["示例标题1（按公式生成）", "示例标题2", "示例标题3"],
  "suggestedName": "建议的风格名称"
}

只输出JSON，不要其他内容。`;

    try {
      const fullPrompt = '你是一个专业的公众号文章风格分析专家，擅长拆解爆款文章的写作套路。\n\n' + analysisPrompt;
      const llmContent = await callLLMWithPrompt(fullPrompt, 0.7, 3000);
      
      let analysis: StyleAnalysis;
      
      try {
        const jsonMatch = llmContent.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : llmContent);
      } catch {
        analysis = {
          name: styleName || '自定义风格',
          titleStrategy: '分析结果解析失败，请重试',
          openingStyle: '',
          articleFramework: '',
          contentProgression: '',
          endingDesign: '',
          languageStyle: '',
          emotionalHooks: [],
          articleType: '',
          template: '',
          exampleTitles: [],
        };
      }

      return NextResponse.json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error('Style analysis error:', error);
      return NextResponse.json({ success: false, error: '风格分析失败' }, { status: 500 });
    }
  }

  if (action === 'save') {
    const { name, analysis } = body as { name?: string; analysis?: StyleAnalysis };
    if (!name || !analysis) {
      return NextResponse.json({ success: false, error: '缺少风格名称或分析结果' }, { status: 400 });
    }

    try {
    const database = db();
    const [saved] = await database.insert(writingStyles).values({
      name,
      titleStrategy: analysis.titleStrategy || '',
      openingStyle: analysis.openingStyle || '',
      articleFramework: analysis.articleFramework || '',
      contentProgression: analysis.contentProgression || '',
      endingDesign: analysis.endingDesign || '',
      languageStyle: analysis.languageStyle || '',
      emotionalHooks: analysis.emotionalHooks || [],
      articleType: analysis.articleType || '',
      template: analysis.template || '',
      exampleTitles: analysis.exampleTitles || [],
    }).returning();

    return NextResponse.json({ success: true, style: saved });
    } catch (error) {
      console.error('Style save error:', error);
      return NextResponse.json({ success: false, error: '保存风格失败' }, { status: 500 });
    }
  }

  if (action === 'delete') {
    if (!styleId) {
      return NextResponse.json({ success: false, error: '缺少风格ID' }, { status: 400 });
    }

    try {
    const database = db();
    await database.delete(writingStyles).where(eq(writingStyles.id, styleId));
    return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Style delete error:', error);
      return NextResponse.json({ success: false, error: '删除风格失败' }, { status: 500 });
    }
  }

  if (action === 'save-layout') {
    const { name, description, config } = body as {
      name?: string; description?: string; config?: Record<string, unknown>;
    };
    if (!name) {
      return NextResponse.json({ success: false, error: '缺少排版风格名称' }, { status: 400 });
    }

    try {
    const database = db();
    const [saved] = await database.insert(layoutStyles).values({
      name,
      description: description || '',
      headerStyle: (config?.headerStyle as string) || 'bold',
      paragraphSpacing: (config?.paragraphSpacing as string) || 'medium',
      listStyle: (config?.listStyle as string) || 'number',
      highlightStyle: (config?.highlightStyle as string) || 'emoji',
      emojiUsage: (config?.emojiUsage as string) || 'moderate',
      quoteStyle: (config?.quoteStyle as string) || 'block',
      imagePosition: (config?.imagePosition as string) || 'center',
      calloutStyle: (config?.calloutStyle as string) || 'box',
    }).returning();

    return NextResponse.json({ success: true, style: saved });
    } catch (error) {
      console.error('Layout save error:', error);
      return NextResponse.json({ success: false, error: '保存排版风格失败' }, { status: 500 });
    }
  }

  if (action === 'delete-layout') {
    const { styleId: layoutStyleId } = body as { styleId?: number };
    if (!layoutStyleId) {
      return NextResponse.json({ success: false, error: '缺少排版风格ID' }, { status: 400 });
    }

    try {
    const database = db();
    await database.delete(layoutStyles).where(eq(layoutStyles.id, layoutStyleId));
    return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Layout delete error:', error);
      return NextResponse.json({ success: false, error: '删除排版风格失败' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
}
