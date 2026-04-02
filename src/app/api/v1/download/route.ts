import { NextRequest, NextResponse } from 'next/server';
import { fetchArticleContent, formatArticleForExport } from '@/lib/wechat/article-parser';

function isValidMpArticleUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'mp.weixin.qq.com' && parsedUrl.pathname === '/s';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const format = (request.nextUrl.searchParams.get('format') || 'html').toLowerCase();

  if (!url) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: 'url不能为空' },
    });
  }

  const decodedUrl = decodeURIComponent(url.trim());
  if (!isValidMpArticleUrl(decodedUrl)) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: 'url不合法，必须是微信公众号文章链接' },
    });
  }

  if (!['html', 'markdown', 'text', 'json'].includes(format)) {
    return NextResponse.json({
      base_resp: { ret: -1, err_msg: '不支持的格式，支持: html, markdown, text, json' },
    });
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
      base_resp: { ret: -1, err_msg: error instanceof Error ? error.message : '下载失败' },
    });
  }
}
