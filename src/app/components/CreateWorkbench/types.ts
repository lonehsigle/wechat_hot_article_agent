'use client';

import React, { useState, useEffect } from 'react';

// ============ Types ============

interface CreateWorkbenchProps {
  llmConfig: {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl?: string;
    apiKeyHint?: string | null;
    hasApiKey?: boolean;
  };
  topics: Array<{
    id: string;
    title: string;
    source: string;
    likes: number;
    selected: boolean;
  }>;
  writingStyles: Array<{
    id: number;
    name: string;
    template: string;
  }>;
  onArticleCreated?: (article: { title: string; content: string }) => void;
}

interface LayoutStyle {
  id: number;
  name: string;
  description: string | null;
  headerStyle: string | null;
  paragraphSpacing: string | null;
  listStyle: string | null;
  highlightStyle: string | null;
  emojiUsage: string | null;
  quoteStyle: string | null;
  imagePosition: string | null;
  calloutStyle: string | null;
  colorScheme: string | null;
  fontStyle: string | null;
}

type InputSource = 'keyword' | 'topic' | 'article';
type WorkflowStep = 'input' | 'title' | 'content' | 'polish' | 'images' | 'publish' | 'done';
type ContentType = 'book' | 'story' | 'news' | 'opinion' | 'tutorial' | 'unknown';

interface ContentAnalysis {
  type: ContentType;
  typeName: string;
  confidence: number;
  features: string[];
  suggestions: string[];
  styleKeywords: string[];
}

interface TitleOption {
  text: string;
  type: 'benefit' | 'pain' | 'trend';
  evaluation?: {
    clickScore: number;
    viralScore: number;
    relevanceScore: number;
    qualityScore: number;
    totalScore: number;
    analysis: string;
    highlights: string[];
  };
}

interface AICheckResult {
  score: number;
  issues: string[];
  suggestions: string[];
  highlightedParts: Array<{ text: string; issue: string }>;
}

interface GeneratedImage {
  position: number;
  context: string;
  imageBase64: string;
  prompt: string;
}

interface WechatAccount {
  id: number;
  name: string;
  authorName: string | null;
  appId: string | null;
  isDefault: boolean;
}

interface CollectedArticle {
  id: number;
  title: string;
  content: string;
  author: string;
  readCount?: number;
  likeCount?: number;
}

// ============ State & Hooks ============

export function useCreateWorkbenchState() {
  const [inputSource, setInputSource] = useState<InputSource>('keyword');
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [keyword, setKeyword] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('');
  const [layoutStyles, setLayoutStyles] = useState<LayoutStyle[]>([]);
  
  const [collectedArticles, setCollectedArticles] = useState<CollectedArticle[]>([]);
  const [searchResults, setSearchResults] = useState<string>('');
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [evaluatingTitles, setEvaluatingTitles] = useState(false);
  const [articleContent, setArticleContent] = useState('');
  const [openingContent, setOpeningContent] = useState('');
  const [endingContent, setEndingContent] = useState('');
  
  const [aiCheckResult, setAiCheckResult] = useState<AICheckResult | null>(null);
  const [polishedContent, setPolishedContent] = useState('');
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [wechatAccounts, setWechatAccounts] = useState<WechatAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [publishMessage, setPublishMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [analyzingContent, setAnalyzingContent] = useState(false);
  
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishProgress, setPublishProgress] = useState<string[]>([]);
  const [publishCurrentStep, setPublishCurrentStep] = useState('');

  // Load collected articles
  useEffect(() => {
    const loadCollectedArticles = async () => {
      try {
        const res = await fetch('/api/wechat-collect?action=list-articles&pageSize=50');
        const data = await res.json();
        const articles = data.success && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : (data.articles || []));
        if (articles.length > 0) {
          setCollectedArticles(articles.map((a: { 
            id: number; 
            title: string; 
            content: string; 
            author: string | null;
            read_count?: number;
            readCount?: number;
            like_count?: number;
            likeCount?: number;
          }) => ({
            id: a.id,
            title: a.title,
            content: a.content || '',
            author: a.author || '未知作者',
            readCount: a.read_count || a.readCount || 0,
            likeCount: a.like_count || a.likeCount || 0,
          })));
        }
      } catch (err) {
        console.error('Failed to load collected articles:', err);
      }
    };
    
    loadCollectedArticles();
  }, []);

  // Load WeChat accounts
  useEffect(() => {
    const loadWechatAccounts = async () => {
      try {
        const res = await fetch('/api/wechat-accounts');
        const data = await res.json();
        const accounts = data.success && Array.isArray(data.data) ? data.data : (data.accounts && Array.isArray(data.accounts) ? data.accounts : (Array.isArray(data) ? data : []));
        if (accounts.length > 0) {
          setWechatAccounts(accounts.map((a: { 
            id: number; 
            name: string | null; 
            authorName: string | null; 
            appId: string | null; 
            isDefault: boolean 
          }) => ({
            id: a.id,
            name: a.name || '未命名账号',
            authorName: a.authorName,
            appId: a.appId,
            isDefault: a.isDefault,
          })));
          const defaultAccount = accounts.find((a: { isDefault: boolean }) => a.isDefault === true);
          if (defaultAccount) {
            setSelectedAccountId(String(defaultAccount.id));
          }
        }
      } catch (err) {
        console.error('Failed to load WeChat accounts:', err);
      }
    };
    
    loadWechatAccounts();
  }, []);

  // Load layout styles
  useEffect(() => {
    const loadLayoutStyles = async () => {
      try {
        const res = await fetch('/api/styles?type=layout');
        const data = await res.json();
        const styles = data.success && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setLayoutStyles(styles);
      } catch (err) {
        console.error('Failed to load layout styles:', err);
      }
    };
    
    loadLayoutStyles();
  }, []);

  return {
    // State
    inputSource, setInputSource,
    currentStep, setCurrentStep,
    keyword, setKeyword,
    selectedTopicId, setSelectedTopicId,
    selectedArticleIds, setSelectedArticleIds,
    selectedStyleId, setSelectedStyleId,
    selectedLayoutId, setSelectedLayoutId,
    layoutStyles,
    collectedArticles,
    searchResults, setSearchResults,
    titleOptions, setTitleOptions,
    selectedTitle, setSelectedTitle,
    evaluatingTitles,
    articleContent, setArticleContent,
    openingContent, setOpeningContent,
    endingContent, setEndingContent,
    aiCheckResult, setAiCheckResult,
    polishedContent, setPolishedContent,
    generatedImages, setGeneratedImages,
    wechatAccounts, setWechatAccounts,
    selectedAccountId, setSelectedAccountId,
    publishStatus, setPublishStatus,
    publishMessage, setPublishMessage,
    isLoading, setIsLoading,
    loadingMessage, setLoadingMessage,
    error, setError,
    contentAnalysis, setContentAnalysis,
    analyzingContent,
    showPublishModal, setShowPublishModal,
    publishProgress, setPublishProgress,
    publishCurrentStep, setPublishCurrentStep,
  };
}

export type { 
  CreateWorkbenchProps,
  WorkflowStep,
  InputSource,
  LayoutStyle,
  ContentAnalysis,
  TitleOption,
  AICheckResult,
  GeneratedImage,
  WechatAccount,
  CollectedArticle,
};
