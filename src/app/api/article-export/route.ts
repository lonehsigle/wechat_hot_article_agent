import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
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
  const usedSheetNames = new Set<string>(['文章列表']);
  const summaryData = articles.map((article, index) => ({
    序号: index + 1,
    标题: article.title,
    作者: article.author,
    发布时间: article.publishTime,
    摘要: article.digest,
    原文链接: article.sourceUrl,
  }));
  const sheets: Array<{ name: string; rows: Array<Array<string | number>>; widths: number[] }> = [
    {
      name: '文章列表',
      rows: [
        ['序号', '标题', '作者', '发布时间', '摘要', '原文链接'],
        ...summaryData.map(article => [
          article.序号,
          article.标题,
          article.作者,
          article.发布时间,
          article.摘要,
          article.原文链接,
        ]),
      ],
      widths: [6, 40, 15, 20, 50, 50],
    },
  ];

  for (const [index, article] of articles.entries()) {
    const sheetName = createUniqueSheetName(article.title, index + 1, usedSheetNames);
    const contentData = [
      { 字段: '标题', 内容: article.title },
      { 字段: '作者', 内容: article.author },
      { 字段: '发布时间', 内容: article.publishTime },
      { 字段: '原文链接', 内容: article.sourceUrl },
      { 字段: '摘要', 内容: article.digest },
      { 字段: '正文', 内容: article.text },
    ];
    sheets.push({
      name: sheetName,
      rows: [
        ['字段', '内容'],
        ...contentData.map(row => [row.字段, row.内容]),
      ],
      widths: [15, 100],
    });
  }
  
  const buffer = await createXlsx(sheets);
  
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent('articles.xlsx')}"`,
    },
  });
}

function createUniqueSheetName(title: string, index: number, usedNames: Set<string>): string {
  const baseName = sanitizeSheetName(title) || `文章${index}`;
  let candidate = baseName;
  let suffix = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    const suffixText = `_${suffix}`;
    candidate = `${baseName.slice(0, 31 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function sanitizeSheetName(name: string): string {
  return normalizeXmlText(name)
    .replace(/[\\\/\?\*\[\]:]/g, '')
    .replace(/^'+|'+$/g, '')
    .trim()
    .slice(0, 31);
}

async function createXlsx(sheets: Array<{ name: string; rows: Array<Array<string | number>>; widths: number[] }>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  const sheetRefs = sheets.map((sheet, index) => ({ ...sheet, id: index + 1 }));

  zip.file('[Content_Types].xml', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    ...sheetRefs.map(sheet => `<Override PartName="/xl/worksheets/sheet${sheet.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`),
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    '</Types>',
  ].join(''));
  zip.file('_rels/.rels', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
    '</Relationships>',
  ].join(''));
  zip.file('docProps/core.xml', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">',
    '<dc:creator>Content Monitor</dc:creator>',
    `<dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${new Date().toISOString()}</dcterms:created>`,
    '</cp:coreProperties>',
  ].join(''));
  zip.file('docProps/app.xml', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">',
    '<Application>Content Monitor</Application>',
    '</Properties>',
  ].join(''));
  zip.file('xl/workbook.xml', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<sheets>',
    ...sheetRefs.map(sheet => `<sheet name="${escapeXml(sheet.name)}" sheetId="${sheet.id}" r:id="rId${sheet.id}"/>`),
    '</sheets>',
    '</workbook>',
  ].join(''));
  zip.file('xl/_rels/workbook.xml.rels', [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    ...sheetRefs.map(sheet => `<Relationship Id="rId${sheet.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheet.id}.xml"/>`),
    '</Relationships>',
  ].join(''));

  for (const sheet of sheetRefs) {
    zip.file(`xl/worksheets/sheet${sheet.id}.xml`, buildWorksheetXml(sheet.rows, sheet.widths));
  }

  return await zip.generateAsync({ type: 'arraybuffer' });
}

function buildWorksheetXml(rows: Array<Array<string | number>>, widths: number[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<cols>',
    ...widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`),
    '</cols>',
    '<sheetData>',
    ...rows.map((row, rowIndex) => [
      `<row r="${rowIndex + 1}">`,
      ...row.map((cell, columnIndex) => buildCellXml(rowIndex + 1, columnIndex + 1, cell)),
      '</row>',
    ].join('')),
    '</sheetData>',
    '</worksheet>',
  ].join('');
}

function buildCellXml(row: number, column: number, value: string | number): string {
  const ref = `${columnName(column)}${row}`;
  if (typeof value === 'number') {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function columnName(column: number): string {
  let name = '';
  let current = column;
  while (current > 0) {
    current -= 1;
    name = String.fromCharCode(65 + (current % 26)) + name;
    current = Math.floor(current / 26);
  }
  return name;
}

function escapeXml(value: string): string {
  return normalizeXmlText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeXmlText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
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
