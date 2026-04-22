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
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const stats = searchParams.get('stats');

    const database = db();

    if (articleId && stats === 'true') {
      const parsedId = parseInt(articleId, 10);
      if (isNaN(parsedId)) {
        return NextResponse.json({ success: false, error: 'Invalid articleId' }, { status: 400 });
      }
      const statRecords = await database
        .select()
        .from(articleStats)
        .where(eq(articleStats.articleId, parsedId))
        .orderBy(desc(articleStats.recordTime));
      return NextResponse.json({ success: true, stats: statRecords });
    }

    const articles = await database
      .select()
      .from(publishedArticles)
      .orderBy(desc(publishedArticles.createdAt));
    
    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error('Publish API GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取发布文章失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, accountId, title, content, coverImageUrl, autoSearchImages, images, layoutStyle } = body;

    if (action === 'search-images') {
      if (!title || !content) {
        return NextResponse.json({ success: false, error: 'title和content参数不能为空' }, { status: 400 });
      }
      const images = await generateArticleImages({
        title,
        content,
        imageCount: 5,
      });
      return NextResponse.json({ 
        success: true,
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
      if (!imageUrl) {
        return NextResponse.json({ success: false, error: 'imageUrl参数不能为空' }, { status: 400 });
      }
      const result = await uploadImageFromUrl(accountId, imageUrl, type || 'image');
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'publish-with-images') {
      const account = await getWechatAccount(accountId);
      if (!account) {
        return NextResponse.json({ success: false, error: '公众号账号不存在' }, { status: 400 });
      }

      const imageMappings: { original: string; wechatUrl: string }[] = [];
      let thumbMediaId: string | undefined;

      if (images && Array.isArray(images) && images.length > 0) {
        const firstImage = images[0];

        try {
          const base64Data = firstImage.imageBase64 || firstImage;
          
          const uploadResult = await uploadImageFromUrl(accountId, 
            `data:image/jpeg;base64,${base64Data}`, 
            'thumb'
          );
          thumbMediaId = uploadResult.mediaId;
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

            const uploadResult = await uploadImageFromUrl(accountId, 
              `data:image/jpeg;base64,${base64Data}`, 
              'image'
            );
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

      let contentWithImages = content;

      if (images && images.length > 0) {
        const paragraphs = content.split('\n\n');
        const totalParagraphs = paragraphs.length;

        for (let i = images.length - 1; i >= 0; i--) {
          const img = images[i];
          const position = img.position || ((i + 1) / (images.length + 1));
          const insertIndex = Math.floor(totalParagraphs * position);
          const mappingKey = `generated-image-${i}`;
          const wechatUrl = imageMappings.find(m => m.original === mappingKey)?.wechatUrl;

          if (wechatUrl) {
            const imgTag = `\n\n<img src="${wechatUrl}" style="width:100%;display:block;margin:20px 0;" />\n\n`;
            paragraphs.splice(Math.min(insertIndex, paragraphs.length), 0, imgTag);
          }
        }

        contentWithImages = paragraphs.join('\n\n');
      }


      const wechatHtml = convertToWechatHtml(contentWithImages, imageMappings, layoutStyle);
      const plainText = content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      const digest = plainText.length > 117 ? plainText.slice(0, 117) + '...' : plainText;

      // thumbMediaId优先，如果没有则不设置封面图
      const draftThumbId = thumbMediaId || '';

      const draftResult = await createDraft(accountId, [{
        thumbMediaId: draftThumbId,
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
        return NextResponse.json({ success: false, error: '公众号账号不存在' }, { status: 400 });
      }

      let thumbMediaId: string | undefined;
      const imageMappings: { original: string; wechatUrl: string }[] = [];

      if (autoSearchImages && !coverImageUrl) {
        try {
          const images = await generateArticleImages({
            title,
            content,
            imageCount: 1,
          });
          if (images.length > 0 && images[0].base64) {
            try {
              const uploadResult = await uploadImageFromUrl(accountId,
                `data:image/png;base64,${images[0].base64}`,
                'thumb'
              );
              thumbMediaId = uploadResult.mediaId;
              if (uploadResult.url) {
                imageMappings.push({
                  original: 'ai-generated-cover',
                  wechatUrl: uploadResult.url,
                });
              }
            } catch (error) {
              console.error('[发布API] 封面图片上传失败:', error);
            }
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
          success: false, error: '缺少封面图片。请提供封面图或开启自动搜索图片功能。' 
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
      if (!content) {
        return NextResponse.json({ success: false, error: 'content参数不能为空' }, { status: 400 });
      }
      const html = convertToWechatHtml(content, images || [], layoutStyle);
      return NextResponse.json({ success: true, html });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Publish API error:', error);
    return NextResponse.json({ 
      success: false, error: error instanceof Error ? error.message : '操作失败' 
    }, { status: 500 });
  }
}
