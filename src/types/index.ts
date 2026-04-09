// src/types/index.ts - 从 page.tsx 提取的共享类型

export interface MonitorCategory {
  id: string;
  name: string;
  platforms: string[];
  keywords: string[];
  creators: string[];
  contents: Content[];
  reports: Report[];
}

export interface Content {
  id: string;
  platform: string;
  title: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  url: string;
}

export interface Report {
  id: string;
  date: string;
  title: string;
  summary: string;
  insights: Insight[];
  topics: Topic[];
}

export interface Insight {
  type: 'trend' | 'hot' | 'recommendation';
  content: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  reason: string;
  potential: string;
}

export interface SelectedTopic {
  id: string;
  title: string;
  source: string;
  likes: number;
  selected: boolean;
}

export interface SearchResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  description: string;
  photographer: string;
  source: string;
}

export interface ArticleDraft {
  topicId: string;
  title: string;
  content: string;
  coverImage: string;
  images: string[];
  status: 'draft' | 'generating' | 'writing' | 'humanizing' | 'images' | 'uploading' | 'done' | 'error';
  progress: number;
  selectedCover?: string;
  searchResults?: SearchResult[];
}

export interface WechatAccount {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  authorName: string;
  isDefault: boolean;
  targetAudience?: string;
  readerPersona?: string;
  contentStyle?: string;
  mainTopics?: string[];
  tonePreference?: string;
}

export interface ImageSourceConfig {
  aiGenerated: boolean;
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
  wechatAccountId: number | null;
  publishStatus: string;
  publishTime: Date | null;
  wechatArticleUrl: string | null;
  createdAt: Date | null;
}

export interface ArticleStat {
  id: number;
  articleId: number;
  recordTime: Date;
  readCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  readGrowth: number;
  likeGrowth: number;
}
