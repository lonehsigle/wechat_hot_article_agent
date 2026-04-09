import { db } from '@/lib/db';
import { llmConfigs } from '@/lib/db/schema';
import { callLLM, type LLMMessage } from '@/lib/llm/service';

export interface ImageResult {
  id: string;
  url: string;
  base64: string;
  prompt: string;
  width: number;
  height: number;
}

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '2:3' | '3:4' | '9:16' | '21:9';
  n?: number;
}

export interface ArticleImageGenerationOptions {
  title: string;
  content: string;
  imageCount?: number;
}

async function callLLMWithPrompt(prompt: string, temperature: number = 0.7): Promise<string> {
  const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
  const result = await callLLM(messages, { temperature });
  return result.content;
}

async function getMiniMaxConfig() {
  const configs = await db().select().from(llmConfigs);
  const minimaxConfig = configs.find(c => 
    c.provider === 'minimax' || 
    c.provider === 'minimax-m2.7' ||
    c.provider?.startsWith('minimax')
  );
  
  if (!minimaxConfig || !minimaxConfig.apiKey) {
    throw new Error('请先在系统设置中配置MiniMax API Key');
  }
  
  return {
    apiKey: minimaxConfig.apiKey,
    model: minimaxConfig.model || 'image-01',
  };
}

export async function generateImage(options: ImageGenerationOptions): Promise<ImageResult[]> {
  const config = await getMiniMaxConfig();
  
  const endpoint = 'https://api.minimaxi.com/v1/image_generation';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 60000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'image-01',
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio || '16:9',
        response_format: 'base64',
        n: options.n || 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generateImage] API 错误响应:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.base_resp) {
          throw new Error(`MiniMax API 错误: ${errorJson.base_resp.status_msg || errorText}`);
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('MiniMax API')) {
          throw parseError;
        }
      }
      throw new Error(`MiniMax API错误 (${response.status}): ${errorText}`);
    }

    const data = await response.json() as {
      data?: {
        image_base64?: string[];
      };
      base_resp?: {
        status_code: number;
        status_msg: string;
      };
    };

    if (data.base_resp?.status_code !== 0) {
      throw new Error(data.base_resp?.status_msg || '图片生成失败');
    }

    const images = data.data?.image_base64 || [];

    const dimensions = getAspectRatioDimensions(options.aspectRatio || '16:9');
  
    return images.map((base64, index) => ({
      id: `minimax-${Date.now()}-${index}`,
      url: `data:image/png;base64,${base64}`,
      base64: base64,
      prompt: options.prompt,
      width: dimensions.width,
      height: dimensions.height,
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[generateImage] 错误:', error);
    
    if (error instanceof Error) {
      console.error('[generateImage] 错误名称:', error.name);
      console.error('[generateImage] 错误消息:', error.message);
      console.error('[generateImage] 错误堆栈:', error.stack);
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时（60秒），请检查网络连接或稍后重试');
      }
      
      if (error.message.includes('fetch') || error.message.includes('network') || 
          error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error(`网络请求失败: ${error.message}。请检查：1) 网络连接是否正常 2) API Key 是否正确 3) 是否需要代理访问`);
      }
    }
    
    throw error;
  }
}

function getAspectRatioDimensions(aspectRatio: string): { width: number; height: number } {
  const dimensionsMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1280, height: 720 },
    '4:3': { width: 1152, height: 864 },
    '3:2': { width: 1248, height: 832 },
    '2:3': { width: 832, height: 1248 },
    '3:4': { width: 864, height: 1152 },
    '9:16': { width: 720, height: 1280 },
    '21:9': { width: 1344, height: 576 },
  };
  
  return dimensionsMap[aspectRatio] || { width: 1280, height: 720 };
}

export async function generateArticleImages(options: ArticleImageGenerationOptions): Promise<ImageResult[]> {
  const { title, content, imageCount = 3 } = options;

  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);

  const positions: Array<{
    percentage: number;
    context: string;
    paragraphIndex: number;
  }> = [];

  const totalParagraphs = paragraphs.length;

  if (totalParagraphs > 0) {
    const positionPercentages = [0.3, 0.6, 0.9];
    for (let i = 0; i < Math.min(imageCount, positionPercentages.length); i++) {
      const targetIndex = Math.floor(totalParagraphs * positionPercentages[i]);
      const contextParagraphs = paragraphs.slice(Math.max(0, targetIndex - 2), targetIndex + 2);
      positions.push({
        percentage: positionPercentages[i],
        context: contextParagraphs.join('\n\n').substring(0, 500),
        paragraphIndex: Math.min(targetIndex, totalParagraphs - 1),
      });
    }
  }

  const results = await Promise.allSettled(
    positions.map(async (pos) => {
      const promptText = `请根据以下文章片段，生成一个适合作为配图的英文prompt。要求：
1. 图片要与内容主题相关
2. 风格要专业、现代、适合公众号文章
3. 不要出现文字
4. 简洁明了，不超过100个英文单词

文章标题：${title}
文章片段：
${pos.context}

请直接输出英文prompt，不要有任何解释。`;

      let imagePrompt = `Professional illustration for article about ${title}, modern style, clean design, no text`;

      try {
        imagePrompt = await callLLMWithPrompt(promptText, 0.7);
      } catch (error) {
        console.error('生成图片prompt失败:', error);
      }

      try {
        const images = await generateImage({
          prompt: imagePrompt,
          aspectRatio: '16:9',
        });

        return images.length > 0 ? images[0] : null;
      } catch (error) {
        console.error('生成图片失败:', error);
        return null;
      }
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ImageResult> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map(r => r.value);
}

export function getKeywordsFromTitle(title: string): string[] {
  const stopWords = new Set([
    '的', '了', '是', '在', '有', '和', '与', '或', '这', '那', '我', '你', '他', '她', '它',
    '们', '着', '过', '会', '能', '可', '要', '想', '看', '说', '做', '去', '来', '就',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
  ]);
  
  const words = title
    .replace(/[【】\[\]「」『』《》<>]/g, ' ')
    .replace(/[？?！!，,。.：:；;、]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word.toLowerCase()));
  
  return [...new Set(words)];
}

export async function searchImagesForArticle(
  title: string,
  content: string,
  count: number = 3
): Promise<ImageResult[]> {
  return generateArticleImages({
    title,
    content,
    imageCount: count,
  });
}

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
