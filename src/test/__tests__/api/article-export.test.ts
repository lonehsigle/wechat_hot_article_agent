import JSZip from 'jszip';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFetchArticleContent = vi.fn();

vi.mock('@/lib/wechat/article-parser', () => ({
  fetchArticleContent: mockFetchArticleContent,
}));

function createRequest(url: string, init?: RequestInit): NextRequest {
  const parsedUrl = new URL(url);
  const req = new Request(url, init) as unknown as NextRequest;
  Object.defineProperty(req, 'nextUrl', { value: parsedUrl, configurable: true, writable: true });
  return req as NextRequest;
}

function article(title: string, url: string) {
  return {
    title,
    author: '作者',
    content: '',
    html: '',
    text: `正文\u0001 ${title}`,
    markdown: '',
    publishTime: '2026-05-26',
    sourceUrl: url,
    coverImage: '',
    digest: '摘要',
    commentId: null,
    biz: null,
  };
}

describe('/api/article-export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports a valid xlsx with unique sheet names and XML-safe text', async () => {
    const { POST } = await import('@/app/api/article-export/route');
    mockFetchArticleContent
      .mockResolvedValueOnce(article('重复/标题*名称', 'https://mp.weixin.qq.com/s?__biz=a&mid=1&idx=1&sn=a'))
      .mockResolvedValueOnce(article('重复/标题*名称', 'https://mp.weixin.qq.com/s?__biz=b&mid=2&idx=1&sn=b'));

    const req = createRequest('http://localhost/api/article-export?action=export', {
      method: 'POST',
      body: JSON.stringify({
        format: 'xlsx',
        articles: [
          { url: 'https://mp.weixin.qq.com/s?__biz=a&mid=1&idx=1&sn=a' },
          { url: 'https://mp.weixin.qq.com/s?__biz=b&mid=2&idx=1&sn=b' },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const zip = await JSZip.loadAsync(await res.arrayBuffer());
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    const secondSheetXml = await zip.file('xl/worksheets/sheet2.xml')?.async('string');

    expect(workbookXml).toContain('name="重复标题名称"');
    expect(workbookXml).toContain('name="重复标题名称_2"');
    expect(secondSheetXml).not.toContain('\u0001');
    expect(secondSheetXml).toContain('正文 重复/标题*名称');
  });
});
