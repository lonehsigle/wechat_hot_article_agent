import { NextRequest, NextResponse } from 'next/server';
import { fetchArticleContent, formatArticleForExport, ArticleContent } from '@/lib/wechat/article-parser';

function isValidMpArticleUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'mp.weixin.qq.com' && parsedUrl.pathname === '/s';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'download':
        return await downloadArticle(request);
      case 'batch':
        return await batchDownload(request);
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Article download error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function downloadArticle(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const format = (request.nextUrl.searchParams.get('format') || 'html').toLowerCase();

  if (!url) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'url不能为空' } 
    }, { status: 400 });
  }

  const decodedUrl = decodeURIComponent(url.trim());
  if (!isValidMpArticleUrl(decodedUrl)) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'url不合法，必须是微信公众号文章链接' } 
    }, { status: 400 });
  }

  if (!['html', 'markdown', 'text', 'json'].includes(format)) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: '不支持的格式，支持: html, markdown, text, json' } 
    }, { status: 400 });
  }

  try {
    const article = await fetchArticleContent(decodedUrl);
    const content = formatArticleForExport(article, format as 'html' | 'markdown' | 'text' | 'json');

    const contentTypeMap: Record<string, string> = {
      html: 'text/html; charset=UTF-8',
      markdown: 'text/markdown; charset=UTF-8',
      text: 'text/plain; charset=UTF-8',
      json: 'application/json; charset=UTF-8',
    };

    const filename = `${article.title || 'article'}.${format === 'markdown' ? 'md' : format}`;

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': contentTypeMap[format],
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: error instanceof Error ? error.message : '下载失败' } 
    }, { status: 500 });
  }
}

interface BatchDownloadItem {
  url: string;
  title?: string;
}

async function batchDownload(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const articles: BatchDownloadItem[] = body.articles || [];
  const format = (body.format || 'json').toLowerCase();

  if (!articles.length) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'articles不能为空' } 
    }, { status: 400 });
  }

  const results: Array<{
    url: string;
    success: boolean;
    article?: ArticleContent;
    error?: string;
  }> = [];

  for (const item of articles) {
    try {
      if (!isValidMpArticleUrl(item.url)) {
        results.push({ url: item.url, success: false, error: 'url不合法' });
        continue;
      }

      const article = await fetchArticleContent(item.url);
      results.push({ url: item.url, success: true, article });
    } catch (error) {
      results.push({ 
        url: item.url, 
        success: false, 
        error: error instanceof Error ? error.message : '下载失败' 
      });
    }
  }

  if (format === 'json') {
    return NextResponse.json({ 
      success: true, 
      results,
      total: results.length,
      successCount: results.filter(r => r.success).length,
    });
  }

  const successArticles = results.filter(r => r.success && r.article);
  let content = '';

  if (format === 'markdown') {
    content = successArticles.map(r => {
      const a = r.article!;
      return `# ${a.title}\n\n作者: ${a.author}\n发布时间: ${a.publishTime}\n原文链接: ${a.sourceUrl}\n\n${a.markdown}\n\n---\n\n`;
    }).join('');
  } else if (format === 'text') {
    content = successArticles.map(r => {
      const a = r.article!;
      return `${a.title}\n作者: ${a.author}\n发布时间: ${a.publishTime}\n原文链接: ${a.sourceUrl}\n\n${a.text}\n\n---\n\n`;
    }).join('');
  } else {
    content = successArticles.map(r => {
      const a = r.article!;
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${a.title}</title></head><body><h1>${a.title}</h1><p>作者: ${a.author}</p><p>发布时间: ${a.publishTime}</p><hr>${a.html}<hr></body></html>`;
    }).join('\n\n');
  }

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': format === 'markdown' ? 'text/markdown; charset=UTF-8' : 
                      format === 'text' ? 'text/plain; charset=UTF-8' : 
                      'text/html; charset=UTF-8',
    },
  });
}
