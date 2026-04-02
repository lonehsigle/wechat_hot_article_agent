import { getLLMConfig } from '@/lib/db/queries';
import { getPromptTemplate } from '@/lib/prompts';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

function getProviderConfig(provider: string, baseUrl?: string | null): { endpoint: string; modelMapping: Record<string, string>; useAnthropicFormat?: boolean } {
  const configs: Record<string, { endpoint: string; modelMapping: Record<string, string>; useAnthropicFormat?: boolean }> = {
    openai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      modelMapping: {
        'gpt-4o': 'gpt-4o',
        'gpt-4o-mini': 'gpt-4o-mini',
        'gpt-4-turbo': 'gpt-4-turbo',
        'gpt-3.5-turbo': 'gpt-3.5-turbo',
      },
    },
    zhipu: {
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      modelMapping: {
        'glm-4': 'glm-4',
        'glm-4-flash': 'glm-4-flash',
        'glm-4-plus': 'glm-4-plus',
      },
    },
    deepseek: {
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      modelMapping: {
        'deepseek-chat': 'deepseek-chat',
        'deepseek-coder': 'deepseek-coder',
      },
    },
    kimi: {
      endpoint: 'https://api.moonshot.cn/v1/chat/completions',
      modelMapping: {
        'moonshot-v1-8k': 'moonshot-v1-8k',
        'moonshot-v1-32k': 'moonshot-v1-32k',
        'moonshot-v1-128k': 'moonshot-v1-128k',
      },
    },
    minimax: {
      endpoint: 'https://api.minimaxi.com/v1/chat/completions',
      modelMapping: {
        'MiniMax-M2.5': 'MiniMax-M2.5',
        'MiniMax-M2.5-highspeed': 'MiniMax-M2.5-highspeed',
        'MiniMax-M2.7': 'MiniMax-M2.7',
        'MiniMax-M2.7-highspeed': 'MiniMax-M2.7-highspeed',
        'abab6.5-chat': 'abab6.5-chat',
        'abab6.5s-chat': 'abab6.5s-chat',
        'abab5.5-chat': 'abab5.5-chat',
      },
    },
  };

  const config = configs[provider] || configs.openai;
  if (baseUrl) {
    config.endpoint = baseUrl.endsWith('/chat/completions') || baseUrl.endsWith('/messages') 
      ? baseUrl 
      : `${baseUrl.replace(/\/$/, '')}/v1/messages`;
  }
  return config;
}

function getProviderByModel(model: string): string {
  if (model.startsWith('MiniMax') || model.startsWith('minimax')) return 'minimax';
  if (model.startsWith('moonshot') || model.startsWith('kimi')) return 'kimi';
  if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
  if (model.startsWith('glm')) return 'zhipu';
  if (model.startsWith('deepseek')) return 'deepseek';
  if (model.startsWith('abab')) return 'minimax';
  return '';
}

export async function callLLM(
  messages: LLMMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
): Promise<LLMResponse> {
  const config = await getLLMConfig();
  if (!config) {
    throw new Error('请先配置 LLM API');
  }

  const modelFromOption = options?.model;
  const providerFromModel = modelFromOption ? getProviderByModel(modelFromOption) : '';
  const effectiveProvider = providerFromModel || config.provider;
  const providerConfig = getProviderConfig(effectiveProvider, config.baseUrl);
  const model = modelFromOption || config.model || 'gpt-4o';
  const effectiveApiKey = config.apiKey;

  if (providerConfig.useAnthropicFormat) {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const response = await fetch(providerConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': effectiveApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens ?? 4096,
        system: systemMessage?.content || 'You are a helpful assistant.',
        messages: userMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API 调用失败: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const textContent = data.content?.find((c: { type: string }) => c.type === 'text');
    
    return {
      content: textContent?.text || '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    };
  }

  const response = await fetch(providerConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API 调用失败: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('LLM API Response:', JSON.stringify(data).substring(0, 1000));
  
  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax API 错误: ${data.base_resp.status_msg || 'Unknown error'}`);
  }
  
  // 处理 MiniMax M2.5/M2.7 新格式 (包含 thinking 字段)
  if (data.content && Array.isArray(data.content)) {
    // 首先查找 text 类型
    const textContent = data.content.find((c: { type: string }) => c.type === 'text');
    if (textContent && textContent.text) {
      return {
        content: textContent.text,
        usage: data.usage ? {
          promptTokens: data.usage.total_tokens || 0,
          completionTokens: 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
      };
    }
    
    // 如果没有 text 类型，查找 thinking 字段（MiniMax M2.7 思考模式）
    const thinkingContent = data.content.find((c: Record<string, unknown>) => 
      c && typeof c === 'object' && 'thinking' in c
    );
    if (thinkingContent && (thinkingContent as Record<string, unknown>).thinking) {
      const thinking = (thinkingContent as Record<string, unknown>).thinking as string;
      const finalMatch = thinking.match(/最终[答案输出][:：]\s*([\s\S]*?)(?=\n\n|$)/);
      if (finalMatch && finalMatch[1]) {
        return {
          content: finalMatch[1].trim(),
          usage: data.usage ? {
            promptTokens: data.usage.total_tokens || 0,
            completionTokens: 0,
            totalTokens: data.usage.total_tokens || 0,
          } : undefined,
        };
      }
      
      // 如果没有找到明确的最终答案，提取 thinking 中最后一个完整段落
      const paragraphs = thinking.split('\n\n').filter((p: string) => p.trim().length > 50);
      if (paragraphs.length > 0) {
        const lastParagraph = paragraphs[paragraphs.length - 1];
        return {
          content: lastParagraph.trim(),
          usage: data.usage ? {
            promptTokens: data.usage.total_tokens || 0,
            completionTokens: 0,
            totalTokens: data.usage.total_tokens || 0,
          } : undefined,
        };
      }
      
      // 最后手段：直接返回 thinking 内容
      return {
        content: thinking.trim(),
        usage: data.usage ? {
          promptTokens: data.usage.total_tokens || 0,
          completionTokens: 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
      };
    }
  }
  
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    if (data.reply) {
      return {
        content: data.reply,
        usage: data.usage ? {
          promptTokens: data.usage.total_tokens || 0,
          completionTokens: 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
      };
    }
    console.error('LLM API 返回格式异常:', JSON.stringify(data).substring(0, 500));
    throw new Error(`LLM API 返回格式异常: ${JSON.stringify(data).substring(0, 200)}`);
  }
  
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

export async function* streamLLM(
  messages: LLMMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<StreamChunk> {
  const config = await getLLMConfig();
  if (!config) {
    throw new Error('请先配置 LLM API');
  }

  const modelFromOption = options?.model;
  const providerFromModel = modelFromOption ? getProviderByModel(modelFromOption) : '';
  const effectiveProvider = providerFromModel || config.provider;
  const providerConfig = getProviderConfig(effectiveProvider, config.baseUrl);
  const model = modelFromOption || config.model || 'gpt-4o';
  const effectiveApiKey = config.apiKey;

  const response = await fetch(providerConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 1.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API 调用失败: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      yield { content: '', done: true };
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          yield { content: '', done: true };
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            yield { content, done: false };
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

export async function generateWithTechniques(
  stage: string,
  userPrompt: string,
  techniques: Array<{ title: string; content: string; formulas?: string | null; examples?: string | null }>
): Promise<string> {
  const techniquePrompt = techniques.map(t => {
    let prompt = `【${t.title}】\n${t.content}`;
    if (t.formulas) prompt += `\n公式：${t.formulas}`;
    if (t.examples) prompt += `\n示例：${t.examples}`;
    return prompt;
  }).join('\n\n');

  const systemPrompt = `你是一位专业的公众号文章创作者。现在正在进行文章创作的"${stage}"阶段。

请参考以下创作技巧：

${techniquePrompt}

请严格按照上述技巧进行创作，确保内容专业、有吸引力、符合公众号读者的阅读习惯。`;

  const response = await callLLM([
    { role: 'user', content: systemPrompt + '\n\n' + userPrompt },
  ]);

  return response.content;
}

export async function checkAIContent(content: string): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
  details: {
    aiPhrases: string[];
    structure: string;
    tone: string;
    authenticity: string;
  };
}> {
  const systemPrompt = `你是一位专业的内容审核专家，专门检测文章中的"AI味"。

AI写作的常见特征：

【词汇层面】
1. 过度使用连接词："首先、其次、最后、总之、综上所述"
2. AI高频词："值得注意的是、需要强调的是、不可否认、毋庸置疑"
3. 书面化表达："进行、实施、开展、推进、落实"
4. 空洞形容词："非常重要、十分关键、极其必要"

【句式层面】
1. 句式过于工整，缺乏变化
2. 频繁使用被动句
3. 长句过多，缺少短句节奏
4. 排比句式泛滥

【内容层面】
1. 缺少个人经历和真实案例
2. 缺少情感表达和个人观点
3. 缺少具体细节和生动描述
4. 观点过于中庸，缺少锐度

【结构层面】
1. 结构过于模板化（总分总、三段论）
2. 每段开头模式化
3. 缺少意外的转折和惊喜

请分析以下内容，返回JSON格式：
{
  "score": 0-100的AI味评分（0=完全人工，100=完全AI）,
  "issues": ["具体问题1", "具体问题2"],
  "suggestions": ["修改建议1", "修改建议2"],
  "details": {
    "aiPhrases": ["检测到的AI常用词组"],
    "structure": "结构分析结果",
    "tone": "语气分析结果",
    "authenticity": "真实感评估"
  }
}`;

  const response = await callLLM([
    { role: 'user', content: systemPrompt + '\n\n请分析以下内容：\n\n' + content },
  ]);

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 50,
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        details: parsed.details || {
          aiPhrases: [],
          structure: '未知',
          tone: '未知',
          authenticity: '未知',
        },
      };
    }
  } catch {
    // 解析失败返回默认值
  }

  return {
    score: 50,
    issues: ['无法分析'],
    suggestions: ['请手动检查内容'],
    details: {
      aiPhrases: [],
      structure: '未知',
      tone: '未知',
      authenticity: '未知',
    },
  };
}

export async function removeAIFlavor(content: string, options?: {
  style?: 'casual' | 'professional' | 'storytelling';
  preserveStructure?: boolean;
}): Promise<string> {
  const styleGuides = {
    casual: `口语化风格：
- 使用"你、我、咱们"拉近距离
- 多用短句，一句话一个意思
- 加入语气词"吧、呢、啊、嘛、呗"
- 用大白话解释专业概念
- 偶尔用网络流行语`,
    professional: `专业但生动风格：
- 保持专业性的同时增加可读性
- 用类比和比喻解释复杂概念
- 加入数据支撑观点
- 使用行业黑话但解释清楚
- 结构清晰但不死板`,
    storytelling: `故事化风格：
- 用故事开头，用故事结尾
- 加入时间线"那时候、后来、现在"
- 描写细节，让读者身临其境
- 用对话推进情节
- 结尾升华，给读者启发`,
  };

  const selectedStyle = options?.style || 'casual';
  const preserveStructure = options?.preserveStructure ?? false;

  const systemPrompt = `你是一位专业的内容优化专家，专门去除文章中的"AI味"。

【核心优化原则】

1. **打破模板化结构**
   - 不要每段都用"首先、其次、最后"
   - 开头不要总是"随着...的发展"
   - 结尾不要总是"综上所述"
   ${preserveStructure ? '- 保持原有段落结构' : '- 可以重新组织段落'}

2. **口语化表达**
   - 把"进行"改成"做"
   - 把"实施"改成"搞"
   - 把"开展"改成"开始"
   - 把"非常"改成"特别、超级、贼"

3. **增加真实感**
   - 加入"我记得有一次..."
   - 加入"我朋友跟我说..."
   - 加入"说实话、老实说、坦白讲"
   - 加入具体的时间、地点、人物

4. **情感表达**
   - 加入"我觉得、我认为、在我看来"
   - 加入"说实话、不瞒你说"
   - 加入"说实话，我也纠结过"
   - 加入"这事儿让我想起..."

5. **节奏变化**
   - 长短句交替
   - 偶尔用感叹句
   - 偶尔用反问句
   - 偶尔用省略句

【风格要求】
${styleGuides[selectedStyle]}

【禁止事项】
- 不要使用"首先、其次、最后、总之、综上所述"
- 不要使用"值得注意的是、需要强调的是"
- 不要使用"不可否认、毋庸置疑"
- 不要每段开头都一样
- 不要句式过于工整

请重写以下内容，保持原意但彻底去除AI味：`;

  const response = await callLLM([
    { role: 'user', content: systemPrompt + '\n\n' + content },
  ], { temperature: 0.9 });

  return response.content;
}

export async function humanizeContent(content: string): Promise<{
  original: string;
  humanized: string;
  beforeScore: number;
  afterScore: number;
  changes: string[];
}> {
  const beforeCheck = await checkAIContent(content);
  
  const humanized = await removeAIFlavor(content, { style: 'casual' });
  
  const afterCheck = await checkAIContent(humanized);

  const changes: string[] = [];
  if (beforeCheck.details.aiPhrases.length > 0) {
    changes.push(`移除了 ${beforeCheck.details.aiPhrases.length} 个AI常用词组`);
  }
  if (beforeCheck.score - afterCheck.score > 10) {
    changes.push(`AI味评分从 ${beforeCheck.score} 降至 ${afterCheck.score}`);
  }
  if (beforeCheck.details.structure !== afterCheck.details.structure) {
    changes.push(`结构从"${beforeCheck.details.structure}"优化为"${afterCheck.details.structure}"`);
  }

  return {
    original: content,
    humanized,
    beforeScore: beforeCheck.score,
    afterScore: afterCheck.score,
    changes,
  };
}

export interface ArticleForAnalysis {
  title: string;
  author: string | null;
  readCount: number;
  likeCount: number;
  commentCount: number;
  lookCount: number;
  publishTime: string | null;
  digest: string | null;
}

export interface TopicAnalysisResult {
  summary: string;
  insights: string[];
  topicSuggestions: Array<{
    title: string;
    reason: string;
    potential: '高' | '中' | '低';
  }>;
  contentTrends: string[];
  audienceInsights: string[];
}

const DEFAULT_TOPIC_ANALYSIS_PROMPT = `你是一位资深的公众号运营专家和内容分析师。你擅长分析文章数据，发现内容趋势，并给出有价值的选题建议。

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
}`;

export async function analyzeTopicsWithLLM(
  articles: ArticleForAnalysis[],
  wordCloud: Array<{ word: string; count: number }>
): Promise<TopicAnalysisResult> {
  const articlesInfo = articles.slice(0, 20).map((a, i) => 
    `${i + 1}. 《${a.title}》
   - 作者: ${a.author || '未知'}
   - 阅读数: ${(a.readCount || 0).toLocaleString()}
   - 点赞数: ${(a.likeCount || 0).toLocaleString()}
   - 评论数: ${(a.commentCount || 0).toLocaleString()}
   - 在看数: ${(a.lookCount || 0).toLocaleString()}
   - 互动率: ${(a.readCount || 0) > 0 ? (((a.likeCount || 0) + (a.lookCount || 0) + (a.commentCount || 0)) / a.readCount * 100).toFixed(2) : 0}%
   - 发布时间: ${a.publishTime ? new Date(a.publishTime).toLocaleDateString('zh-CN') : '未知'}`
  ).join('\n');

  const topWords = wordCloud.slice(0, 30).map(w => `${w.word}(${w.count}次)`).join('、');

  const statsInfo = `- 分析文章数: ${articles.length}篇
- 总阅读量: ${articles.reduce((sum, a) => sum + (a.readCount || 0), 0).toLocaleString()}
- 总点赞数: ${articles.reduce((sum, a) => sum + (a.likeCount || 0), 0).toLocaleString()}
- 平均互动率: ${articles.length > 0 ? (articles.reduce((sum, a) => sum + (a.readCount > 0 ? ((a.likeCount + a.lookCount + a.commentCount) / a.readCount * 100) : 0), 0) / articles.length).toFixed(2) : 0}%`;

  let promptTemplate = await getPromptTemplate('topic-analysis');
  if (!promptTemplate) {
    promptTemplate = DEFAULT_TOPIC_ANALYSIS_PROMPT;
  }

  const systemPrompt = promptTemplate
    .replace('{articlesInfo}', articlesInfo)
    .replace('{topWords}', topWords)
    .replace('{statsInfo}', statsInfo);

  if (!systemPrompt.trim()) {
    console.error('System prompt is empty!');
    return {
      summary: '分析失败：Prompt 为空',
      insights: [],
      topicSuggestions: [],
      contentTrends: [],
      audienceInsights: [],
    };
  }

  const response = await callLLM([
    { role: 'user', content: systemPrompt },
  ], { maxTokens: 4096, temperature: 0.7 });

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || '',
        insights: parsed.insights || [],
        topicSuggestions: (parsed.topicSuggestions || []).map((t: { title: string; reason: string; potential: string }) => ({
          title: t.title,
          reason: t.reason,
          potential: ['高', '中', '低'].includes(t.potential) ? t.potential : '中',
        })),
        contentTrends: parsed.contentTrends || [],
        audienceInsights: parsed.audienceInsights || [],
      };
    }
  } catch (error) {
    console.error('Failed to parse topic analysis result:', error);
  }

  return {
    summary: '分析完成，但无法解析结果',
    insights: [],
    topicSuggestions: [],
    contentTrends: [],
    audienceInsights: [],
  };
}
