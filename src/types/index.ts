export interface MonitorCategory {
  id: number;
  name: string;
  platforms: string[];
  keywords: string[];
  creators: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Content {
  id: number;
  categoryId?: number;
  platform: string;
  title: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  url: string;
  fetchedAt: number;
}

export interface Report {
  id: number;
  categoryId?: number;
  date: string;
  title: string;
  summary: string;
  createdAt: number;
}

export interface Insight {
  id: number;
  reportId: number;
  type: string;
  content: string;
  createdAt: number;
}

export interface Topic {
  id: number;
  reportId: number;
  title: string;
  description: string;
  reason: string;
  potential: string;
  createdAt: number;
}

export interface WechatAccount {
  id: number;
  name: string;
  appId: string;
  appSecret: string;
  authorName: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'zhipu' | 'deepseek' | 'kimi' | 'minimax';
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface PublishedArticle {
  id: number;
  title: string;
  content: string;
  coverImage: string;
  images: string[];
  wechatAccountId?: number;
  topicId?: number;
  publishStatus: 'draft' | 'published' | 'failed';
  publishTime?: number;
  wechatMediaId?: string;
  wechatArticleUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ArticleStats {
  id: number;
  articleId: number;
  recordTime: number;
  readCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  readGrowth: number;
  likeGrowth: number;
  commentGrowth: number;
  shareGrowth: number;
}

export interface ArticleStatsDaily {
  id: number;
  articleId: number;
  date: string;
  totalRead: number;
  totalLike: number;
  totalComment: number;
  totalShare: number;
  totalCollect: number;
  dailyReadGrowth: number;
  dailyLikeGrowth: number;
  dailyCommentGrowth: number;
  dailyShareGrowth: number;
}

export interface CacheRecord {
  id: number;
  cacheKey: string;
  cacheData: unknown;
  fetchedAt: number;
  expiresAt: number;
}
