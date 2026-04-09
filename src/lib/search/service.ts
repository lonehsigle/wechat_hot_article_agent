export interface SearchResult {
  title: string;
  url: string;
  description: string;
  content?: string;
  score?: number;
  source?: string;
}

export interface SearchResponse {
  keyword: string;
  items: SearchResult[];
  answer?: string;
  images?: string[];
  error?: string;
}

export interface SearchConfig {
  tavilyApiKey?: string;
  tiangongApiKey?: string;
  minimaxApiKey?: string;
  minimaxGroupId?: string;
  maxResults?: number;
}

const SEARCH_TIMEOUT = 8000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = SEARCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function parseSearchResults(html: string, engine: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  if (engine === 'google') {
    const googleRegex = /<a href="\/url\?q=([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<div[^>]*data-sncf[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    while ((match = googleRegex.exec(html)) !== null && results.length < 20) {
      const url = decodeURIComponent(match[1].split('&')[0]);
      if (url.startsWith('http')) {
        results.push({
          title: match[2].replace(/<[^>]+>/g, '').trim(),
          url: url,
          description: match[3].replace(/<[^>]+>/g, '').trim().substring(0, 200),
          source: 'google',
        });
      }
    }
    
    if (results.length === 0) {
      const fallbackRegex = /<div class="g"[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/g;
      while ((match = fallbackRegex.exec(html)) !== null && results.length < 20) {
        if (match[1].startsWith('http')) {
          results.push({
            title: match[2].replace(/<[^>]+>/g, '').trim(),
            url: match[1],
            description: '',
            source: 'google',
          });
        }
      }
    }
  } else if (engine === 'bing') {
    const bingRegex = /<li class="b_algo"[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g;
    let match;
    while ((match = bingRegex.exec(html)) !== null && results.length < 20) {
      if (match[1].startsWith('http')) {
        results.push({
          title: match[2].replace(/<[^>]+>/g, '').trim(),
          url: match[1],
          description: match[3].replace(/<[^>]+>/g, '').trim().substring(0, 200),
          source: 'bing',
        });
      }
    }
  } else if (engine === 'baidu') {
    const baiduRegex = /<div class="result[^"]*"[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<div class="c-abstract"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    while ((match = baiduRegex.exec(html)) !== null && results.length < 20) {
      results.push({
        title: match[2].replace(/<[^>]+>/g, '').trim(),
        url: match[1],
        description: match[3].replace(/<[^>]+>/g, '').trim().substring(0, 200),
        source: 'baidu',
      });
    }
  }
  
  return results;
}

export async function googleSearch(keyword: string, maxResults: number = 10): Promise<SearchResponse> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=${maxResults * 2}&hl=zh-CN`;
  
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
    },
  }, SEARCH_TIMEOUT);

  if (!response.ok) {
    throw new Error(`Google search failed: ${response.status}`);
  }

  const html = await response.text();
  const items = parseSearchResults(html, 'google').slice(0, maxResults);

  if (items.length === 0) {
    throw new Error('No results from Google');
  }

  return { keyword, items };
}

export async function bingSearch(keyword: string, maxResults: number = 10): Promise<SearchResponse> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(keyword)}&count=${maxResults * 2}&setlang=zh-CN`;
  
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
  }, SEARCH_TIMEOUT);

  if (!response.ok) {
    throw new Error(`Bing search failed: ${response.status}`);
  }

  const html = await response.text();
  const items = parseSearchResults(html, 'bing').slice(0, maxResults);

  if (items.length === 0) {
    throw new Error('No results from Bing');
  }

  return { keyword, items };
}

export async function baiduSearch(keyword: string, maxResults: number = 10): Promise<SearchResponse> {
  const url = `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}&rn=${maxResults * 2}`;
  
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  }, SEARCH_TIMEOUT);

  if (!response.ok) {
    throw new Error(`Baidu search failed: ${response.status}`);
  }

  const html = await response.text();
  const items = parseSearchResults(html, 'baidu').slice(0, maxResults);

  if (items.length === 0) {
    throw new Error('No results from Baidu');
  }

  return { keyword, items };
}

export async function duckDuckGoSearch(keyword: string, maxResults: number = 10): Promise<SearchResponse> {
  const response = await fetchWithTimeout(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(keyword)}&format=json&no_html=1&skip_disambig=1`,
    {
      headers: {
        'Accept': 'application/json',
      },
    },
    SEARCH_TIMEOUT
  );

  if (!response.ok) {
    throw new Error(`DuckDuckGo API error: ${response.status}`);
  }

  const data = await response.json();
  const items: SearchResult[] = [];
  
  if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics) {
      if (items.length >= maxResults) break;
      
      if (topic.Text && topic.FirstURL) {
        items.push({
          title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
          url: topic.FirstURL,
          description: topic.Text,
          source: 'duckduckgo',
        });
      } else if (topic.Topics && Array.isArray(topic.Topics)) {
        for (const subTopic of topic.Topics) {
          if (items.length >= maxResults) break;
          if (subTopic.Text && subTopic.FirstURL) {
            items.push({
              title: subTopic.Text.split(' - ')[0] || subTopic.Text.substring(0, 100),
              url: subTopic.FirstURL,
              description: subTopic.Text,
              source: 'duckduckgo',
            });
          }
        }
      }
    }
  }

  if (items.length === 0) {
    throw new Error('No results from DuckDuckGo');
  }

  return {
    keyword,
    answer: data.Abstract || data.Answer,
    items,
  };
}

export async function wikipediaSearch(keyword: string, maxResults: number = 10): Promise<SearchResponse> {
  const response = await fetchWithTimeout(
    `https://zh.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(keyword)}&limit=${maxResults}&format=json&origin=*`,
    {
      headers: {
        'Accept': 'application/json',
        'User-Agent': getRandomUserAgent(),
      },
    },
    SEARCH_TIMEOUT
  );

  if (!response.ok) {
    throw new Error(`Wikipedia API error: ${response.status}`);
  }

  const data = await response.json();
  const items: SearchResult[] = [];
  
  if (Array.isArray(data) && data.length >= 4) {
    const titles = data[1] || [];
    const descriptions = data[2] || [];
    const urls = data[3] || [];

    for (let i = 0; i < titles.length && i < maxResults; i++) {
      items.push({
        title: titles[i],
        url: urls[i],
        description: descriptions[i] || `维基百科条目: ${titles[i]}`,
        source: 'wikipedia',
      });
    }
  }

  if (items.length === 0) {
    throw new Error('No results from Wikipedia');
  }

  return {
    keyword,
    items,
  };
}

export async function tiangongSearch(
  keyword: string,
  config: { apiKey: string; maxResults?: number }
): Promise<SearchResponse> {
  const maxResults = config.maxResults || 10;
  
  const response = await fetchWithTimeout('https://api.tiangong.cn/openapi/v1/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      query: keyword,
      num: maxResults,
    }),
  }, SEARCH_TIMEOUT);

  if (!response.ok) {
    throw new Error(`Tiangong API error: ${response.status}`);
  }

  const data = await response.json();
  
  const items = (data.results || data.data || []).map((item: any) => ({
    title: item.title || item.name || '',
    url: item.url || item.link || '',
    description: item.content || item.description || item.snippet || '',
    source: 'tiangong',
  }));

  if (items.length === 0) {
    throw new Error('No results from Tiangong');
  }

  return {
    keyword,
    answer: data.answer || data.summary,
    items: items.slice(0, maxResults),
  };
}

export async function minimaxSearch(
  keyword: string,
  config: { apiKey: string; groupId?: string; maxResults?: number }
): Promise<SearchResponse> {
  const maxResults = config.maxResults || 10;
  const groupId = config.groupId || '';
  
  const url = groupId 
    ? `https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${groupId}`
    : 'https://api.minimax.chat/v1/text/chatcompletion_v2';

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: 'abab6.5s-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的搜索助手，请使用网络搜索工具搜索用户需要的信息，并整理返回搜索结果。'
        },
        {
          role: 'user',
          content: `请搜索"${keyword}"相关的内容，返回${maxResults}条最相关的搜索结果。请按照以下格式返回：\n1. 标题: xxx\n   链接: xxx\n   摘要: xxx\n\n请直接返回搜索结果，不要添加其他说明。`
        }
      ],
      tools: [
        {
          type: 'web_search'
        }
      ],
      tool_choice: 'auto',
      temperature: 0.1,
      max_tokens: 4096,
    }),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  const content = data.choices?.[0]?.message?.content || '';
  
  const items: SearchResult[] = [];
  const lines = content.split('\n');
  let currentItem: Partial<SearchResult> = {};
  
  for (const line of lines) {
    const titleMatch = line.match(/^\d+\.\s*标题[：:]\s*(.+)$/);
    const urlMatch = line.match(/链接[：:]\s*(https?:\/\/[^\s]+)/);
    const descMatch = line.match(/摘要[：:]\s*(.+)$/);
    
    if (titleMatch) {
      if (currentItem.title) {
        items.push({
          title: currentItem.title,
          url: currentItem.url || '',
          description: currentItem.description || '',
          source: 'minimax',
        });
      }
      currentItem = { title: titleMatch[1].trim() };
    } else if (urlMatch) {
      currentItem.url = urlMatch[1].trim();
    } else if (descMatch) {
      currentItem.description = descMatch[1].trim();
    }
  }
  
  if (currentItem.title) {
    items.push({
      title: currentItem.title,
      url: currentItem.url || '',
      description: currentItem.description || '',
      source: 'minimax',
    });
  }

  if (items.length === 0 && content) {
    items.push({
      title: keyword,
      url: '',
      description: content.substring(0, 500),
      source: 'minimax',
    });
  }

  return {
    keyword,
    answer: content,
    items: items.slice(0, maxResults),
  };
}

export async function tavilySearch(
  keyword: string,
  config: { apiKey: string; maxResults?: number }
): Promise<SearchResponse> {
  const maxResults = config.maxResults || 10;
  
  const response = await fetchWithTimeout('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      query: keyword,
      max_results: maxResults,
      include_answer: true,
      include_raw_content: false,
      search_depth: 'basic',
    }),
  }, SEARCH_TIMEOUT);

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    keyword,
    answer: data.answer,
    images: data.images,
    items: (data.results || []).map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      description: item.content || item.description || '',
      content: item.raw_content || '',
      score: item.score || 0,
      source: 'tavily',
    })),
  };
}

export async function unifiedSearch(
  keyword: string,
  config: SearchConfig = {}
): Promise<SearchResponse> {
  const maxResults = config.maxResults || 10;
  const errors: string[] = [];
  
  if (config.tavilyApiKey) {
    try {
      return await tavilySearch(keyword, { apiKey: config.tavilyApiKey, maxResults });
    } catch (error) {
      errors.push(`Tavily: ${error instanceof Error ? error.message : 'failed'}`);
      console.warn('[Search] Tavily failed:', error);
    }
  }
  
  if (config.tiangongApiKey) {
    try {
      return await tiangongSearch(keyword, { apiKey: config.tiangongApiKey, maxResults });
    } catch (error) {
      errors.push(`Tiangong: ${error instanceof Error ? error.message : 'failed'}`);
      console.warn('[Search] Tiangong failed:', error);
    }
  }
  
  if (config.minimaxApiKey) {
    try {
      return await minimaxSearch(keyword, { 
        apiKey: config.minimaxApiKey, 
        groupId: config.minimaxGroupId,
        maxResults 
      });
    } catch (error) {
      errors.push(`MiniMax: ${error instanceof Error ? error.message : 'failed'}`);
      console.warn('[Search] MiniMax failed:', error);
    }
  }
  
  try {
    return await wikipediaSearch(keyword, maxResults);
  } catch (error) {
    errors.push(`Wikipedia: ${error instanceof Error ? error.message : 'failed'}`);
    console.warn('[Search] Wikipedia failed:', error);
  }
  
  try {
    return await bingSearch(keyword, maxResults);
  } catch (error) {
    errors.push(`Bing: ${error instanceof Error ? error.message : 'failed'}`);
    console.warn('[Search] Bing failed:', error);
  }
  
  try {
    const ddgResult = await duckDuckGoSearch(keyword, maxResults);
    if (ddgResult.items.length > 0) {
      return ddgResult;
    }
  } catch (error) {
    errors.push(`DuckDuckGo: ${error instanceof Error ? error.message : 'failed'}`);
    console.warn('[Search] DuckDuckGo failed:', error);
  }
  
  try {
    return await baiduSearch(keyword, maxResults);
  } catch (error) {
    errors.push(`Baidu: ${error instanceof Error ? error.message : 'failed'}`);
    console.warn('[Search] Baidu failed:', error);
  }
  
  try {
    return await googleSearch(keyword, maxResults);
  } catch (error) {
    errors.push(`Google: ${error instanceof Error ? error.message : 'failed'}`);
    console.warn('[Search] Google failed:', error);
  }
  
  console.error('[Search] All search methods failed:', errors.join('; '));
  
  return {
    keyword,
    items: [],
    error: `搜索失败，所有搜索源均无法访问。错误详情：${errors.join('；')}`,
  };
}
