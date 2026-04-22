import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  googleSearch,
  bingSearch,
  baiduSearch,
  duckDuckGoSearch,
  wikipediaSearch,
  tiangongSearch,
  tavilySearch,
  minimaxSearch,
  unifiedSearch,
} from '@/lib/search/service';

describe('search-service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockFetch = (body: unknown, ok = true, status = 200) => {
    global.fetch = vi.fn().mockResolvedValue({
      ok,
      status,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
      json: async () => body,
    } as Response);
  };

  describe('duckDuckGoSearch', () => {
    it('returns results on success', async () => {
      mockFetch({
        RelatedTopics: [
          { Text: 'Topic One - Description', FirstURL: 'https://example.com/1' },
          { Topics: [{ Text: 'Sub - Desc', FirstURL: 'https://example.com/2' }] },
        ],
        Abstract: 'Abstract text',
      });
      const res = await duckDuckGoSearch('test');
      expect(res.keyword).toBe('test');
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.answer).toBe('Abstract text');
    });

    it('throws when no results', async () => {
      mockFetch({ RelatedTopics: [] });
      await expect(duckDuckGoSearch('test')).rejects.toThrow('No results');
    });

    it('throws on non-ok response', async () => {
      mockFetch({}, false, 500);
      await expect(duckDuckGoSearch('test')).rejects.toThrow('DuckDuckGo API error');
    });
  });

  describe('wikipediaSearch', () => {
    it('returns results on success', async () => {
      mockFetch([
        'test',
        ['Title One', 'Title Two'],
        ['Desc One', 'Desc Two'],
        ['https://wikipedia.org/1', 'https://wikipedia.org/2'],
      ]);
      const res = await wikipediaSearch('test');
      expect(res.items.length).toBe(2);
      expect(res.items[0].source).toBe('wikipedia');
    });

    it('throws when no results', async () => {
      mockFetch(['test', [], [], []]);
      await expect(wikipediaSearch('test')).rejects.toThrow('No results');
    });
  });

  describe('tavilySearch', () => {
    it('returns results with answer and images', async () => {
      mockFetch({
        answer: 'Answer text',
        images: ['https://img.com/1.jpg'],
        results: [{ title: 'R1', url: 'https://r1.com', content: 'content', score: 0.9 }],
      });
      const res = await tavilySearch('test', { apiKey: 'key' });
      expect(res.answer).toBe('Answer text');
      expect(res.images).toEqual(['https://img.com/1.jpg']);
      expect(res.items[0].score).toBe(0.9);
    });

    it('throws on error', async () => {
      mockFetch({}, false, 403);
      await expect(tavilySearch('test', { apiKey: 'key' })).rejects.toThrow('Tavily API error');
    });
  });

  describe('tiangongSearch', () => {
    it('returns mapped results', async () => {
      mockFetch({ results: [{ title: 'T1', url: 'https://t1.com', content: 'c1' }] });
      const res = await tiangongSearch('test', { apiKey: 'key' });
      expect(res.items[0].source).toBe('tiangong');
    });

    it('throws when empty results', async () => {
      mockFetch({ results: [] });
      await expect(tiangongSearch('test', { apiKey: 'key' })).rejects.toThrow('No results');
    });
  });

  describe('minimaxSearch', () => {
    it('parses formatted content into items', async () => {
      const content = '1. 标题: Title One\n   链接: https://a.com\n   摘要: Desc One\n\n2. 标题: Title Two\n   链接: https://b.com\n   摘要: Desc Two';
      mockFetch({ choices: [{ message: { content } }] });
      const res = await minimaxSearch('test', { apiKey: 'key' });
      expect(res.items.length).toBe(2);
      expect(res.items[0].title).toBe('Title One');
    });

    it('falls back to raw content when no formatted items', async () => {
      mockFetch({ choices: [{ message: { content: 'some raw text' } }] });
      const res = await minimaxSearch('test', { apiKey: 'key' });
      expect(res.items.length).toBe(1);
      expect(res.items[0].description).toBe('some raw text');
    });

    it('throws on non-ok', async () => {
      mockFetch({}, false, 401);
      await expect(minimaxSearch('test', { apiKey: 'key' })).rejects.toThrow('MiniMax API error');
    });
  });

  describe('unifiedSearch', () => {
    it('uses tavily when apiKey provided', async () => {
      mockFetch({ results: [{ title: 'T', url: 'https://t.com', content: 'c' }] });
      const res = await unifiedSearch('test', { tavilyApiKey: 'key' });
      expect(res.items.length).toBe(1);
    });

    it('falls back through engines and returns error when all fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('network'));
      const res = await unifiedSearch('test');
      expect(res.items).toHaveLength(0);
      expect(res.error).toContain('搜索失败');
    });

    it('uses tiangong when tavily fails', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('tavily fail'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => '{}',
          json: async () => ({ results: [{ title: 'TG', url: 'https://tg.com', content: 'c' }] }),
        } as Response);
      const res = await unifiedSearch('test', { tavilyApiKey: 'k', tiangongApiKey: 'k2' });
      expect(res.items.length).toBe(1);
    });
  });

  describe('googleSearch / bingSearch / baiduSearch', () => {
    it('googleSearch returns parsed results', async () => {
      const html = `<a href="/url?q=https://example.com/page&amp;sa=U">Link</a><h3>Title</h3><div data-sncf>Desc</div>`;
      mockFetch(html);
      const res = await googleSearch('query');
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.items[0].source).toBe('google');
    });

    it('bingSearch returns parsed results', async () => {
      const html = `<li class="b_algo"><a href="https://bing.com/1">Title</a><p>Desc</p></li>`;
      mockFetch(html);
      const res = await bingSearch('query');
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.items[0].source).toBe('bing');
    });

    it('baiduSearch returns parsed results', async () => {
      const html = `<div class="result"><a href="https://baidu.com/1">Title</a><div class="c-abstract">Desc</div></div>`;
      mockFetch(html);
      const res = await baiduSearch('query');
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.items[0].source).toBe('baidu');
    });

    it('throws when no results from google', async () => {
      mockFetch('<html></html>');
      await expect(googleSearch('q')).rejects.toThrow('No results');
    });

    it('throws on non-ok from bing', async () => {
      mockFetch('', false, 503);
      await expect(bingSearch('q')).rejects.toThrow('Bing search failed');
    });
  });
});
