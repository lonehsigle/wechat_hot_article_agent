import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collectedArticles, wechatSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const articleId = searchParams.get('articleId');
  const format = searchParams.get('format') || 'markdown';

  if (!articleId) {
    return NextResponse.json({ success: false, error: 'articleId is required' }, { status: 400 });
  }

  const parsedArticleId = parseInt(articleId);
  if (isNaN(parsedArticleId)) {
    return NextResponse.json({ success: false, error: 'Invalid articleId' }, { status: 400 });
  }

  const [article] = await db().select().from(collectedArticles).where(eq(collectedArticles.id, parsedArticleId));
  if (!article) {
    return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
  }

  let [subscription] = await db().select().from(wechatSubscriptions).where(eq(wechatSubscriptions.id, article.subscriptionId!));
  if (!subscription) {
    subscription = { name: '未知公众号', alias: null } as typeof subscription;
  }

  if (format === 'markdown') {
    const markdown = generateMarkdown(article, subscription);
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(article.title)}.md"`,
      },
    });
  }

  if (format === 'pdf') {
    const html = generatePdfHtml(article, subscription);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(article.title)}.html"`,
      },
    });
  }

  return NextResponse.json({ success: false, error: 'Invalid format' }, { status: 400 });
}

function generateMarkdown(article: typeof collectedArticles.$inferSelect, subscription: { name: string; alias: string | null }) {
  const frontMatter = `---
title: "${article.title}"
author: "${article.author || subscription.alias || subscription.name}"
source: "${article.sourceUrl}"
publishTime: "${article.publishTime?.toISOString() || ''}"
readCount: ${article.readCount}
likeCount: ${article.likeCount}
collectedAt: "${article.createdAt?.toISOString() || ''}"
---

`;

  let content = frontMatter;
  content += `# ${article.title}\n\n`;
  
  if (article.digest) {
    content += `> ${article.digest}\n\n`;
  }
  
  if (article.coverImage) {
    content += `![封面图](${article.coverImage})\n\n`;
  }
  
  content += `**来源**: ${subscription.alias || subscription.name}\n\n`;
  content += `**原文链接**: [${article.sourceUrl}](${article.sourceUrl})\n\n`;
  content += `---\n\n`;
  
  if (article.content) {
    content += article.content;
  } else {
    content += '*内容采集中...*';
  }
  
  return content;
}

function generatePdfHtml(article: typeof collectedArticles.$inferSelect, subscription: { name: string; alias: string | null }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #333;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .meta span {
      margin-right: 20px;
    }
    .digest {
      background: #f8f9fa;
      padding: 15px 20px;
      border-left: 4px solid #3b82f6;
      margin-bottom: 30px;
      font-style: italic;
    }
    .content {
      font-size: 16px;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 14px;
      color: #666;
    }
    a {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(article.title)}</h1>
  <div class="meta">
    <span>作者: ${escapeHtml(article.author || subscription.alias || subscription.name)}</span>
    <span>阅读: ${article.readCount}</span>
    <span>点赞: ${article.likeCount}</span>
  </div>
  ${article.digest ? `<div class="digest">${escapeHtml(article.digest)}</div>` : ''}
  <div class="content">
    ${escapeHtml(article.content || '内容采集中...')}
  </div>
  <div class="footer">
    <p>来源: ${escapeHtml(subscription.alias || subscription.name)}</p>
    <p>原文链接: <a href="${article.sourceUrl}">${article.sourceUrl}</a></p>
    <p>采集时间: ${article.createdAt ? new Date(article.createdAt).toLocaleString('zh-CN') : ''}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}
