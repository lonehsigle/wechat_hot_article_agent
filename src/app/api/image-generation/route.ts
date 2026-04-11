import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { llmConfigs } from '@/lib/db/schema';
import { callLLM, type LLMMessage } from '@/lib/llm/service';
import { decrypt } from '@/lib/db/crypto';

interface ImageGenerationResponse {
  data: {
    image_base64: string[];
  };
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

async function callLLMWithPrompt(prompt: string, temperature: number = 0.7): Promise<string> {
  const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
  const result = await callLLM(messages, { temperature });
  return result.content;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'generate-image') {
      const { prompt, aspectRatio } = body;
      return await handleGenerateImage(prompt, aspectRatio);
    }

    if (action === 'generate-article-images') {
      const { content, title, imageCount } = body;
      return await handleGenerateArticleImages(content, title, imageCount);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Image generation API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
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
    apiKey: decrypt(minimaxConfig.apiKey),
    model: minimaxConfig.model || 'image-01',
  };
}

async function handleGenerateImage(prompt: string, aspectRatio: string = '16:9') {
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

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
        prompt: prompt,
        aspect_ratio: aspectRatio,
        response_format: 'base64',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[图片生成] API 错误响应:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.base_resp) {
          return NextResponse.json({ 
            error: `MiniMax API 错误: ${errorJson.base_resp.status_msg || errorText}`,
            statusCode: errorJson.base_resp.status_code 
          }, { status: response.status });
        }
      } catch {
        // 不是 JSON 格式
      }
      throw new Error(`MiniMax API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as ImageGenerationResponse;

    if (data.base_resp?.status_code !== 0) {
      console.error('[图片生成] 业务错误:', data.base_resp);
      throw new Error(data.base_resp?.status_msg || 'Image generation failed');
    }

    const images = data.data?.image_base64 || [];

    return NextResponse.json({ 
      success: true, 
      images: images,
      count: images.length,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[图片生成] fetch 错误:', error);
    if (error instanceof Error) {
      console.error('[图片生成] 错误名称:', error.name);
      console.error('[图片生成] 错误消息:', error.message);
      console.error('[图片生成] 错误堆栈:', error.stack);
      
      if (error.name === 'AbortError') {
        return NextResponse.json({ 
          error: '请求超时（60秒），请检查网络连接或稍后重试' 
        }, { status: 504 });
      }
      
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return NextResponse.json({ 
          error: `网络请求失败: ${error.message}。请检查：1) 网络连接是否正常 2) API Key 是否正确 3) 是否需要代理访问` 
        }, { status: 502 });
      }
      
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }
    return NextResponse.json({ 
      error: 'Unknown error' 
    }, { status: 500 });
  }
}

async function handleGenerateArticleImages(content: string, title: string, imageCount: number = 3) {
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const config = await getMiniMaxConfig();

  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
  
  const positions = [];
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

  const generatedImages: Array<{
    position: number;
    context: string;
    imageBase64: string;
    prompt: string;
  }> = [];

  const errors: string[] = [];

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];

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
      console.error('[文章配图] 生成图片prompt失败:', error);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const imageResponse = await fetch('https://api.minimaxi.com/v1/image_generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'image-01',
          prompt: imagePrompt,
          aspect_ratio: '16:9',
          response_format: 'base64',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (imageResponse.ok) {
        const imageData = await imageResponse.json() as ImageGenerationResponse;

        if (imageData.base_resp?.status_code !== 0) {
          const errorMsg = imageData.base_resp?.status_msg || '未知错误';
          console.error(`[文章配图] 第 ${i + 1} 张图片业务错误:`, errorMsg);
          errors.push(`第 ${i + 1} 张图片: ${errorMsg}`);
        } else if (imageData.data?.image_base64?.[0]) {
          generatedImages.push({
            position: pos.percentage,
            context: pos.context,
            imageBase64: imageData.data.image_base64[0],
            prompt: imagePrompt,
          });
        } else {
          console.error(`[文章配图] 第 ${i + 1} 张图片生成失败: 无图片数据`, imageData);
          errors.push(`第 ${i + 1} 张图片: 无图片数据返回`);
        }
      } else {
        clearTimeout(timeoutId);
        const errorText = await imageResponse.text();
        console.error(`[文章配图] 第 ${i + 1} 张图片 API 错误:`, imageResponse.status, errorText);
        errors.push(`第 ${i + 1} 张图片: API 错误 (${imageResponse.status})`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`[文章配图] 第 ${i + 1} 张图片 fetch 错误:`, fetchError);
      if (fetchError instanceof Error) {
        console.error(`[文章配图] 错误名称:`, fetchError.name);
        console.error(`[文章配图] 错误消息:`, fetchError.message);
        
        if (fetchError.name === 'AbortError') {
          errors.push(`第 ${i + 1} 张图片: 请求超时`);
        } else if (fetchError.message.includes('fetch') || fetchError.message.includes('network')) {
          errors.push(`第 ${i + 1} 张图片: 网络错误 - ${fetchError.message}`);
        } else {
          errors.push(`第 ${i + 1} 张图片: ${fetchError.message}`);
        }
      } else {
        errors.push(`第 ${i + 1} 张图片: 未知错误`);
      }
    }

    if (i < positions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (generatedImages.length === 0 && errors.length > 0) {
    return NextResponse.json({ 
      success: false, 
      error: `所有图片生成失败: ${errors.join('; ')}`,
      images: [],
      count: 0,
    }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    images: generatedImages,
    count: generatedImages.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'status') {
    try {
      const config = await getMiniMaxConfig();
      return NextResponse.json({ 
        success: true, 
        configured: true,
        model: config.model,
      });
    } catch {
      return NextResponse.json({ 
        success: false, 
        configured: false,
      });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
