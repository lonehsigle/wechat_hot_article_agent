export interface DeepContent {
  url: string;
  title: string;
  content: string;
  summary: string;
  keyPoints: string[];
  quotes: string[];
  dataPoints: string[];
  author?: string;
  publishDate?: string;
  source: string;
}

export async function fetchWithJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  
  try {
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Jina fetch failed: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Failed to fetch with Jina:', error);
    throw error;
  }
}

export async function fetchDeepContent(url: string): Promise<DeepContent> {
  const rawContent = await fetchWithJina(url);
  
  const title = extractTitle(rawContent);
  const summary = extractSummary(rawContent);
  const keyPoints = extractKeyPoints(rawContent);
  const quotes = extractQuotes(rawContent);
  const dataPoints = extractDataPoints(rawContent);
  const author = extractAuthor(rawContent);
  const publishDate = extractPublishDate(rawContent);
  const source = extractSource(url);
  
  return {
    url,
    title,
    content: rawContent,
    summary,
    keyPoints,
    quotes,
    dataPoints,
    author,
    publishDate,
    source,
  };
}

function extractTitle(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.replace('# ', '').trim();
    }
    if (trimmed.length > 10 && trimmed.length < 100 && !trimmed.startsWith('![')) {
      return trimmed;
    }
  }
  return '未知标题';
}

function extractSummary(content: string): string {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
  if (paragraphs.length > 0) {
    const firstParagraph = paragraphs[0].replace(/[#*\[\]]/g, '').trim();
    return firstParagraph.slice(0, 300) + (firstParagraph.length > 300 ? '...' : '');
  }
  return '';
}

function extractKeyPoints(content: string): string[] {
  const points: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const point = trimmed.replace(/^[-*•]\s*/, '').trim();
      if (point.length > 10 && point.length < 200) {
        points.push(point);
      }
    }
    if (trimmed.match(/^\d+[.、)]\s/)) {
      const point = trimmed.replace(/^\d+[.、)]\s*/, '').trim();
      if (point.length > 10 && point.length < 200) {
        points.push(point);
      }
    }
  }
  
  return points.slice(0, 10);
}

function extractQuotes(content: string): string[] {
  const quotes: string[] = [];
  const quotePatterns = [
    /"([^"]{10,100})"/g,
    /"([^"]{10,100})"/g,
    /「([^」]{10,100})」/g,
    /『([^』]{10,100})』/g,
    /> (.+)/g,
  ];
  
  for (const pattern of quotePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const quote = match[1] || match[0].replace('> ', '');
      if (quote && quote.length > 10 && quote.length < 100) {
        quotes.push(quote.trim());
      }
    }
  }
  
  return [...new Set(quotes)].slice(0, 5);
}

function extractDataPoints(content: string): string[] {
  const dataPoints: string[] = [];
  const dataPatterns = [
    /\d+(?:\.\d+)?%[^\n。]*/g,
    /\d+(?:,\d{3})*(?:\.\d+)?(?:万|亿|千|百)[^\n。]*/g,
    /\d+(?:,\d{3})*(?:\.\d+)?(?:元|美元|美元|人|次|个)[^\n。]*/g,
    /(?:增长|下降|提升|减少|达到)[^\n。]*\d+[^\n。]*/g,
  ];
  
  for (const pattern of dataPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const data = match[0].trim();
      if (data.length > 5 && data.length < 100) {
        dataPoints.push(data);
      }
    }
  }
  
  return [...new Set(dataPoints)].slice(0, 5);
}

function extractAuthor(content: string): string | undefined {
  const authorPatterns = [
    /作者[：:]\s*([^\n]+)/,
    /文[／/]\s*([^\n]+)/,
    /By\s+([^\n]+)/i,
    /作者简介[：:]\s*([^\n]+)/,
  ];
  
  for (const pattern of authorPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim().slice(0, 50);
    }
  }
  
  return undefined;
}

function extractPublishDate(content: string): string | undefined {
  const datePatterns = [
    /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}月\d{1,2}日)/,
    /(今天|昨天|前天|\d+天前)/,
  ];
  
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}

function extractSource(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    const sourceMap: Record<string, string> = {
      'mp.weixin.qq.com': '微信公众号',
      'zhuanlan.zhihu.com': '知乎专栏',
      'www.zhihu.com': '知乎',
      'www.jianshu.com': '简书',
      'juejin.cn': '掘金',
      'www.36kr.com': '36氪',
      'www.huxiu.com': '虎嗅',
      'www.ifanr.com': '爱范儿',
      'www.pingwest.com': '品玩',
      'www.tmtpost.com': '钛媒体',
      'www.sohu.com': '搜狐',
      'www.163.com': '网易',
      'www.sina.com.cn': '新浪',
      'www.thepaper.cn': '澎湃新闻',
      'www.guancha.cn': '观察者网',
      'www.caixin.com': '财新网',
      'www.ftchinese.com': 'FT中文网',
      'www.wsj.com': '华尔街日报',
      'www.bbc.com': 'BBC',
      'www.cnn.com': 'CNN',
    };
    
    for (const [domain, source] of Object.entries(sourceMap)) {
      if (hostname.includes(domain)) {
        return source;
      }
    }
    
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return '未知来源';
  }
}

export async function batchFetchDeepContent(urls: string[]): Promise<DeepContent[]> {
  const results: DeepContent[] = [];
  
  for (const url of urls.slice(0, 5)) {
    try {
      const content = await fetchDeepContent(url);
      results.push(content);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
    }
  }
  
  return results;
}

export function formatContentForMaterial(deepContent: DeepContent) {
  return {
    type: 'hotspot',
    source: deepContent.source,
    sourceUrl: deepContent.url,
    title: deepContent.title,
    content: deepContent.summary || deepContent.content.slice(0, 1000),
    keyPoints: deepContent.keyPoints,
    quotes: deepContent.quotes,
    dataPoints: deepContent.dataPoints,
    tags: [],
  };
}
