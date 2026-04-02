import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ArticleContent {
  title: string;
  author: string;
  content: string;
  html: string;
  text: string;
  markdown: string;
  publishTime: string;
  sourceUrl: string;
  coverImage: string;
  digest: string;
  commentId: string | null;
  biz: string | null;
}

export function normalizeHtml(rawHTML: string, format: 'html' | 'text' = 'html'): string {
  const $ = cheerio.load(rawHTML);
  const $jsArticleContent = $('#js_article');

  $jsArticleContent.find('#js_content').removeAttr('style');

  $jsArticleContent.find('#js_top_ad_area').remove();
  $jsArticleContent.find('#js_tags_preview_toast').remove();
  $jsArticleContent.find('#content_bottom_area').remove();
  $jsArticleContent.find('script').remove();
  $jsArticleContent.find('#js_pc_qr_code').remove();
  $jsArticleContent.find('#wx_stream_article_slide_tip').remove();

  $('img').each((_, el) => {
    const $img = $(el);
    const imgUrl = $img.attr('src') || $img.attr('data-src');
    if (imgUrl) {
      $img.attr('src', imgUrl);
    }
  });

  if (format === 'text') {
    const text = $jsArticleContent.text().trim().replace(/\n+/g, '\n').replace(/ +/g, ' ');
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => !/^\s*$/.test(line));
    return filteredLines.join('\n');
  } else {
    const bodyCls = $('body').attr('class') || '';
    const pageContentHTML = $('<div>').append($jsArticleContent.clone()).html() || '';
    return `<!DOCTYPE html>
<html lang="zh_CN">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=0,viewport-fit=cover">
    <meta name="referrer" content="no-referrer">
    <style>
        #js_row_immersive_stream_wrap { max-width: 667px; margin: 0 auto; }
        #js_row_immersive_stream_wrap .wx_follow_avatar_pic { display: block; margin: 0 auto; }
        #page-content, #js_article_bottom_bar, .__page_content__ { max-width: 667px; margin: 0 auto; }
        img { max-width: 100%; }
        .sns_opr_btn::before { width: 16px; height: 16px; margin-right: 3px; }
    </style>
</head>
<body class="${bodyCls}">
${pageContentHTML}
</body>
</html>`;
  }
}

export function validateHTMLContent(html: string): ['Success' | 'Deleted' | 'Exception' | 'Error', string | null] {
  const $ = cheerio.load(html);
  const $jsArticle = $('#js_article');
  const $weuiMsg = $('.weui-msg');
  const $msgBlock = $('.mesg-block');

  if ($jsArticle.length === 1) {
    const commentID = extractCommentId(html);
    return ['Success', commentID];
  } else if ($weuiMsg.length === 1) {
    const msg = $('.weui-msg .weui-msg__title').text().trim().replace(/\n+/g, '').replace(/ +/g, ' ');
    if (msg && ['The content has been deleted by the author.', '该内容已被发布者删除'].includes(msg)) {
      return ['Deleted', null];
    } else {
      return ['Exception', msg];
    }
  } else if ($msgBlock.length === 1) {
    const msg = $msgBlock.text().trim().replace(/\n+/g, '').replace(/ +/g, ' ');
    return ['Exception', msg];
  } else {
    return ['Error', null];
  }
}

export function extractCommentId(html: string): string | null {
  const match = html.match(/comment_id\s*=\s*['"](\d+)['"]/);
  return match ? match[1] : null;
}

export function extractBiz(html: string): string | null {
  const match = html.match(/var\s+biz\s*=\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

export function extractArticleMeta(html: string): {
  title: string;
  author: string;
  publishTime: string;
  coverImage: string;
  digest: string;
} {
  const $ = cheerio.load(html);
  
  const title = $('#activity-name').text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                '';
  
  const author = $('#js_name').text().trim() || 
                 $('meta[property="article:author"]').attr('content') || 
                 '';
  
  const publishTime = $('#publish_time').text().trim() || 
                       $('meta[property="article:published_time"]').attr('content') || 
                       '';
  
  const coverImage = $('meta[property="og:image"]').attr('content') || 
                     $('#js_content img').first().attr('data-src') || 
                     '';
  
  const digest = $('meta[property="og:description"]').attr('content') || 
                 $('#js_content').text().trim().slice(0, 200) || 
                 '';

  return { title, author, publishTime, coverImage, digest };
}

export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  
  const normalizedHtml = normalizeHtml(html, 'html');
  return turndownService.turndown(normalizedHtml);
}

export async function fetchArticleContent(url: string): Promise<ArticleContent> {
  const response = await fetch(url, {
    headers: {
      'Referer': 'https://mp.weixin.qq.com/',
      'Origin': 'https://mp.weixin.qq.com',
      'User-Agent': USER_AGENT,
    },
  });

  const rawHtml = await response.text();
  const [status] = validateHTMLContent(rawHtml);
  
  if (status !== 'Success') {
    throw new Error(`文章获取失败: ${status}`);
  }

  const meta = extractArticleMeta(rawHtml);
  const html = normalizeHtml(rawHtml, 'html');
  const text = normalizeHtml(rawHtml, 'text');
  const markdown = htmlToMarkdown(rawHtml);
  const commentId = extractCommentId(rawHtml);
  const biz = extractBiz(rawHtml);

  return {
    ...meta,
    content: html,
    html,
    text,
    markdown,
    sourceUrl: url,
    commentId,
    biz,
  };
}

export function formatArticleForExport(article: ArticleContent, format: 'html' | 'markdown' | 'text' | 'json'): string {
  switch (format) {
    case 'html':
      return article.html;
    case 'markdown':
      return `# ${article.title}\n\n作者: ${article.author}\n发布时间: ${article.publishTime}\n\n${article.markdown}`;
    case 'text':
      return `${article.title}\n作者: ${article.author}\n发布时间: ${article.publishTime}\n\n${article.text}`;
    case 'json':
      return JSON.stringify(article, null, 2);
    default:
      return article.html;
  }
}
