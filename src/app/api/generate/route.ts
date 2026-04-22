import { NextRequest, NextResponse } from 'next/server';
import { callLLM, streamLLM, generateWithTechniques, checkAIContent, removeAIFlavor, humanizeContent } from '@/lib/llm/service';
import { getTechniquesForPrompt } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, stage, topic, content, techniques, stream, style } = body;

    if (action === 'generate') {
      if (!stage || !topic) {
        return errorResponse('stage和topic参数不能为空', 400);
      }
      const stageTechniques = await getTechniquesForPrompt(stage);
      const result = await generateWithTechniques(stage, topic, techniques || stageTechniques);
      return successResponse({ content: result });
    }

    if (action === 'check-ai') {
      if (!content) {
        return errorResponse('content参数不能为空', 400);
      }
      const result = await checkAIContent(content);
      return successResponse(result);
    }

    if (action === 'remove-ai') {
      if (!content) {
        return errorResponse('content参数不能为空', 400);
      }
      const result = await removeAIFlavor(content, { style: style || 'casual' });
      return successResponse({ content: result });
    }

    if (action === 'humanize') {
      if (!content) {
        return errorResponse('content参数不能为空', 400);
      }
      const result = await humanizeContent(content);
      return successResponse(result);
    }

    if (action === 'generate-article') {
      const { title, style, keywords, length } = body;

      const stages = ['选题', '标题', '开头', '正文', '结尾'];
      const allTechniques: Record<string, Array<{ title: string; content: string; formulas?: string | null; examples?: string | null }>> = {};

      for (const s of stages) {
        allTechniques[s] = await getTechniquesForPrompt(s);
      }

      const systemPrompt = `你是一位专业的公众号文章创作者。请根据以下要求创作一篇文章：

标题：${title || '待定'}
风格：${style || '观点类'}
关键词：${keywords?.join('、') || '无特定关键词'}
字数：${length || 1500}字左右

创作技巧参考：

【选题技巧】
${allTechniques['选题'].map(t => `${t.title}：${t.content}`).join('\n')}

【标题技巧】
${allTechniques['标题'].map(t => `${t.title}：${t.content}`).join('\n')}

【开头技巧】
${allTechniques['开头'].map(t => `${t.title}：${t.content}`).join('\n')}

【正文技巧】
${allTechniques['正文'].map(t => `${t.title}：${t.content}`).join('\n')}

【结尾技巧】
${allTechniques['结尾'].map(t => `${t.title}：${t.content}`).join('\n')}

请严格按照上述技巧创作，确保：
1. 标题吸引人，击中痛点
2. 开头100字内抓住读者
3. 正文结构清晰，有案例支撑
4. 结尾有行动号召
5. 语言口语化，避免AI味`;

      if (stream) {
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamLLM([{ role: 'user', content: systemPrompt }])) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch (error) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(error), done: true })}\n\n`));
            }
            controller.close();
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      const result = await callLLM([{ role: 'user', content: systemPrompt }]);
      return successResponse({ content: result.content });
    }

    if (action === 'generate-stage') {
      const { currentStage, context, previousContent } = body;
      const stageTechniques = await getTechniquesForPrompt(currentStage);

      const stagePrompts: Record<string, string> = {
        '选题': `请根据以下背景信息，提供3个选题建议：

背景：${context}

每个选题请说明：
1. 选题标题
2. 为什么这个选题好（痛点分析）
3. 目标读者是谁
4. 预期效果`,

        '标题': `请为以下文章内容生成5个标题选项：

文章主题：${context}
${previousContent ? `已有内容：${previousContent}` : ''}

要求：
1. 每个标题都要击中痛点
2. 使用数字、对比、悬念等技巧
3. 字数控制在15-25字
4. 标注每个标题使用的技巧`,

        '开头': `请为以下文章写一个开头（100字左右）：

标题：${context}
${previousContent ? `已有内容：${previousContent}` : ''}

要求：
1. 前20字要有钩子
2. 中间50字描述痛点
3. 后30字给出承诺
4. 使用对话感，避免AI味`,

        '正文': `请为以下文章写正文部分：

标题：${context}
开头：${previousContent}

要求：
1. 使用问题解决型或故事启发型结构
2. 加入数据支撑和案例佐证
3. 提炼方法论，让读者可以直接套用
4. 语言口语化，有个人色彩`,

        '结尾': `请为以下文章写结尾：

${previousContent}

要求：
1. 总结回顾核心观点
2. 给出明确的行动号召
3. 引导读者互动（评论、点赞、转发）
4. 简洁有力，不超过100字`,
      };

      const userPrompt = stagePrompts[currentStage] || `请为"${currentStage}"阶段生成内容：\n\n${context}`;

      const result = await generateWithTechniques(currentStage, userPrompt, stageTechniques);
      return successResponse({ content: result });
    }

    return errorResponse('未知操作', 400);
  } catch (error) {
    console.error('Generate API error:', error);
    return errorResponse(error instanceof Error ? error.message : String(error));
  }
}
