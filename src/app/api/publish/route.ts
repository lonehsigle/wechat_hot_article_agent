import { NextRequest, NextResponse } from 'next/server';
import {
  createDraft,
  uploadImageFromUrl,
  convertToWechatHtml,
  extractImageUrls,
  getWechatAccount,
} from '@/lib/wechat/service';
import { generateArticleImages, type ImageResult } from '@/lib/image/service';
import { db } from '@/lib/db';
import { publishedArticles, articleStats } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('articleId');
  const stats = searchParams.get('stats');

  const database = db();

  if (articleId && stats === 'true') {
    const statRecords = await database
      .select()
      .from(articleStats)
      .where(eq(articleStats.articleId, parseInt(articleId)))
      .orderBy(desc(articleStats.recordTime));
    return NextResponse.json(statRecords);
  }

  const articles = await database
    .select()
    .from(publishedArticles)
    .orderBy(desc(publishedArticles.createdAt));
  
  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, accountId, title, content, coverImageUrl, autoSearchImages, images, layoutStyle } = body;

    if (action === 'search-images') {
      const images = await generateArticleImages({
        title,
        content,
        imageCount: 5,
      });
      return NextResponse.json({ 
        images: images.map(img => ({
          id: img.id,
          url: img.url,
          base64: img.base64,
          prompt: img.prompt,
          width: img.width,
          height: img.height,
        })),
      });
    }

    if (action === 'upload-image') {
      const { imageUrl, type } = body;
      const result = await uploadImageFromUrl(accountId, imageUrl, type || 'image');
      return NextResponse.json(result);
    }

    if (action === 'publish-with-images') {
      const account = await getWechatAccount(accountId);
      if (!account) {
        return NextResponse.json({ error: '公众号账号不存在' }, { status: 400 });
      }

      console.log('[发布] 开始处理 publish-with-images');
      console.log('[发布] 接收到的 images 数量:', images?.length || 0);
      console.log('[发布] 接收到的 layoutStyle:', layoutStyle);

      const imageMappings: { original: string; wechatUrl: string }[] = [];
      let thumbMediaId: string | undefined;

      if (images && Array.isArray(images) && images.length > 0) {
        const firstImage = images[0];
        console.log('[发布] 第一张图片结构:', Object.keys(firstImage));
        console.log('[发布] 第一张图片 imageBase64 长度:', firstImage.imageBase64?.length || 0);
        
        try {
          const base64Data = firstImage.imageBase64 || firstImage;
          
          const uploadResult = await uploadImageFromUrl(accountId, 
            `data:image/jpeg;base64,${base64Data}`, 
            'thumb'
          );
          thumbMediaId = uploadResult.mediaId;
          console.log('[发布] 封面图上传成功，mediaId:', thumbMediaId, 'url:', uploadResult.url);
          if (uploadResult.url) {
            imageMappings.push({
              original: 'generated-image-0',
              wechatUrl: uploadResult.url,
            });
          }
        } catch (error) {
          console.error('[发布] 封面图上传失败:', error);
        }

        for (let i = 1; i < images.length; i++) {
          try {
            const img = images[i];
            const base64Data = img.imageBase64 || img;
            console.log(`[发布] 上传第 ${i} 张图片，base64长度:`, base64Data?.length || 0);
            
            const uploadResult = await uploadImageFromUrl(accountId, 
              `data:image/jpeg;base64,${base64Data}`, 
              'image'
            );
            console.log(`[发布] 第 ${i} 张图片上传成功，url:`, uploadResult.url);
            if (uploadResult.url) {
              imageMappings.push({
                original: `generated-image-${i}`,
                wechatUrl: uploadResult.url,
              });
            }
          } catch (error) {
            console.error(`[发布] 第 ${i} 张图片上传失败:`, error);
          }
        }
      }

      console.log('[发布] 图片映射表:', imageMappings);

      let contentWithImages = content;
      
      console.log('[发布] 原始内容长度:', content.length);
      console.log('[发布] 图片数量:', images?.length);
      console.log('[发布] 图片映射数量:', imageMappings.length);
      
      if (images && images.length > 0) {
        const paragraphs = content.split('\n\n');
        const totalParagraphs = paragraphs.length;
        console.log('[发布] 段落数量:', totalParagraphs);
        
        for (let i = images.length - 1; i >= 0; i--) {
          const img = images[i];
          const position = img.position || ((i + 1) / (images.length + 1));
          const insertIndex = Math.floor(totalParagraphs * position);
          const mappingKey = `generated-image-${i}`;
          const wechatUrl = imageMappings.find(m => m.original === mappingKey)?.wechatUrl;
          
          console.log(`[发布] 查找图片 ${i}: key=${mappingKey}, found=${!!wechatUrl}`);
          
          if (wechatUrl) {
            const imgTag = `\n\n<img src="${wechatUrl}" style="width:100%;display:block;margin:20px 0;" />\n\n`;
            paragraphs.splice(Math.min(insertIndex, paragraphs.length), 0, imgTag);
            console.log(`[发布] 在位置 ${insertIndex} 插入图片`);
          } else {
            console.log(`[发布] 未找到图片 ${i} 的映射`);
          }
        }
        
        contentWithImages = paragraphs.join('\n\n');
        console.log('[发布] 插入图片后内容长度:', contentWithImages.length);
      }

      
      console.log('[发布] 排版风格:', layoutStyle);
      const wechatHtml = convertToWechatHtml(contentWithImages, imageMappings, layoutStyle);
      console.log('[发布] 最终HTML长度:', wechatHtml.length);
      const plainText = content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      const digest = plainText.length > 117 ? plainText.slice(0, 117) + '...' : plainText;

      const accountConfig = await db().select().from(publishedArticles).limit(1);
      const thumbId = thumbMediaId || (accountConfig[0]?.coverImage ? undefined : undefined);

      const draftResult = await createDraft(accountId, [{
        thumbMediaId: thumbMediaId || '',
        author: account.authorName,
        title,
        content: wechatHtml,
        digest,
        needOpenComment: 1,
      }]);

      const database = db();
      const [insertedArticle] = await database.insert(publishedArticles).values({
        title,
        content: wechatHtml,
        coverImage: imageMappings[0]?.wechatUrl || '',
        wechatAccountId: accountId,
        publishStatus: 'draft',
        wechatMediaId: draftResult.mediaId,
      }).returning();

      return NextResponse.json({
        success: true,
        mediaId: draftResult.mediaId,
        articleId: insertedArticle.id,
        message: '文章已成功上传到微信公众号草稿箱',
      });
    }

    if (action === 'publish') {
      const account = await getWechatAccount(accountId);
      if (!account) {
        return NextResponse.json({ error: '公众号账号不存在' }, { status: 400 });
      }

      let thumbMediaId: string | undefined;
      const imageMappings: { original: string; wechatUrl: string }[] = [];

      if (autoSearchImages && !coverImageUrl) {
        console.log('[发布API] 开始生成封面图片...');
        try {
          const images = await generateArticleImages({
            title,
            content,
            imageCount: 1,
          });
          console.log(`[发布API] 生成了 ${images.length} 张图片`);
          if (images.length > 0 && images[0].base64) {
            try {
              const uploadResult = await uploadImageFromUrl(accountId, 
                `data:image/png;base64,${images[0].base64}`, 
                'thumb'
              );
              thumbMediaId = uploadResult.mediaId;
              console.log(`[发布API] 封面图片上传成功，mediaId: ${thumbMediaId}`);
              if (uploadResult.url) {
                imageMappings.push({
                  original: 'ai-generated-cover',
                  wechatUrl: uploadResult.url,
                });
              }
            } catch (error) {
              console.error('[发布API] 封面图片上传失败:', error);
            }
          } else {
            console.log('[发布API] 未生成任何封面图片');
          }
        } catch (error) {
          console.error('[发布API] 生成封面图片失败:', error);
        }
      }

      const contentImageUrls = extractImageUrls(content);
      for (const imageUrl of contentImageUrls) {
        try {
          const uploadResult = await uploadImageFromUrl(accountId, imageUrl, 'image');
          if (uploadResult.url) {
            imageMappings.push({
              original: imageUrl,
              wechatUrl: uploadResult.url,
            });
          }
        } catch (error) {
          console.error('Failed to upload content image:', error);
        }
      }

      const wechatHtml = convertToWechatHtml(content, imageMappings, layoutStyle);

      const plainText = content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      const digest = plainText.length > 117 ? plainText.slice(0, 117) + '...' : plainText;

      if (!thumbMediaId) {
        return NextResponse.json({ 
          error: '缺少封面图片。请提供封面图或开启自动搜索图片功能。' 
        }, { status: 400 });
      }

      const draftResult = await createDraft(accountId, [{
        thumbMediaId,
        author: account.authorName,
        title,
        content: wechatHtml,
        digest,
        needOpenComment: 1,
      }]);

      const database = db();
      const [insertedArticle] = await database.insert(publishedArticles).values({
        title,
        content: wechatHtml,
        coverImage: coverImageUrl || '',
        wechatAccountId: accountId,
        publishStatus: 'draft',
        wechatMediaId: draftResult.mediaId,
      }).returning();

      return NextResponse.json({
        success: true,
        mediaId: draftResult.mediaId,
        articleId: insertedArticle.id,
        message: '文章已成功上传到微信公众号草稿箱',
      });
    }

    if (action === 'preview-html') {
      const { content, images, layoutStyle } = body;
      const html = convertToWechatHtml(content, images || [], layoutStyle);
      return NextResponse.json({ html });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Publish API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '操作失败' 
    }, { status: 500 });
  }
}
