import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { fetchArticleContent, ArticleContent } from '@/lib/wechat/article-parser';

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
      case 'export':
        return await exportArticles(request);
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'export':
        return await exportArticlesPost(request);
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function exportArticles(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const format = (request.nextUrl.searchParams.get('format') || 'xlsx').toLowerCase();

  if (!url) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'url不能为空' } 
    }, { status: 400 });
  }

  const decodedUrl = decodeURIComponent(url.trim());
  if (!isValidMpArticleUrl(decodedUrl)) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'url不合法' } 
    }, { status: 400 });
  }

  try {
    const article = await fetchArticleContent(decodedUrl);
    
    if (format === 'xlsx') {
      return await exportToExcel([article]);
    } else if (format === 'docx') {
      return await exportToDocx([article]);
    } else {
      return NextResponse.json({ 
        base_resp: { ret: -1, err_msg: '不支持的格式' } 
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: error instanceof Error ? error.message : '导出失败' } 
    }, { status: 500 });
  }
}

interface ExportRequest {
  articles: Array<{
    url: string;
    title?: string;
  }>;
  format: 'xlsx' | 'docx';
}

async function exportArticlesPost(request: NextRequest) {
  const body: ExportRequest = await request.json();
  const { articles, format = 'xlsx' } = body;

  if (!articles || !articles.length) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: 'articles不能为空' } 
    }, { status: 400 });
  }

  const results: ArticleContent[] = [];
  
  for (const item of articles) {
    try {
      if (!isValidMpArticleUrl(item.url)) continue;
      const article = await fetchArticleContent(item.url);
      results.push(article);
    } catch (error) {
      console.error(`Failed to fetch article: ${item.url}`, error);
    }
  }

  if (!results.length) {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: '没有成功获取任何文章' } 
    }, { status: 400 });
  }

  if (format === 'xlsx') {
    return await exportToExcel(results);
  } else if (format === 'docx') {
    return await exportToDocx(results);
  } else {
    return NextResponse.json({ 
      base_resp: { ret: -1, err_msg: '不支持的格式' } 
    }, { status: 400 });
  }
}

async function exportToExcel(articles: ArticleContent[]): Promise<Response> {
  const workbook = XLSX.utils.book_new();
  
  const summaryData = articles.map((article, index) => ({
    序号: index + 1,
    标题: article.title,
    作者: article.author,
    发布时间: article.publishTime,
    摘要: article.digest,
    原文链接: article.sourceUrl,
  }));
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 6 },
    { wch: 40 },
    { wch: 15 },
    { wch: 20 },
    { wch: 50 },
    { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, '文章列表');
  
  for (const article of articles) {
    const sheetName = article.title.slice(0, 20).replace(/[\\\/\?\*\[\]:]/g, '');
    const contentData = [
      { 字段: '标题', 内容: article.title },
      { 字段: '作者', 内容: article.author },
      { 字段: '发布时间', 内容: article.publishTime },
      { 字段: '原文链接', 内容: article.sourceUrl },
      { 字段: '摘要', 内容: article.digest },
      { 字段: '正文', 内容: article.text },
    ];
    const contentSheet = XLSX.utils.json_to_sheet(contentData);
    contentSheet['!cols'] = [{ wch: 15 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, contentSheet, sheetName);
  }
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return new Response(new Uint8Array(buffer as unknown as ArrayBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent('articles.xlsx')}"`,
    },
  });
}

async function exportToDocx(articles: ArticleContent[]): Promise<Response> {
  const children: Paragraph[] = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    
    children.push(
      new Paragraph({
        text: article.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `作者：${article.author}`, size: 22 }),
          new TextRun({ text: `    发布时间：${article.publishTime}`, size: 22 }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
    
    children.push(new Paragraph({ text: '' }));
    
    if (article.digest) {
      children.push(
        new Paragraph({
          text: '【摘要】',
          heading: HeadingLevel.HEADING_3,
        })
      );
      children.push(
        new Paragraph({
          text: article.digest,
        })
      );
      children.push(new Paragraph({ text: '' }));
    }
    
    const paragraphs = article.text.split('\n').filter(p => p.trim());
    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          text: para.trim(),
        })
      );
    }
    
    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '原文链接：', bold: true }),
          new TextRun({ text: article.sourceUrl, color: '0000FF', underline: {} }),
        ],
      })
    );
    
    if (i < articles.length - 1) {
      children.push(new Paragraph({ text: '' }));
      children.push(
        new Paragraph({
          text: '————————————',
          alignment: AlignmentType.CENTER,
        })
      );
      children.push(new Paragraph({ text: '' }));
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });
  
  const buffer = await Packer.toBuffer(doc);
  
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${encodeURIComponent('articles.docx')}"`,
    },
  });
}
