'use client';

import React, { useState, useEffect } from 'react';

interface CreateWorkbenchProps {
  llmConfig: {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl?: string;
    // 安全：新增字段
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

const CreateWorkbench: React.FC<CreateWorkbenchProps> = ({
  llmConfig,
  topics,
  writingStyles,
  onArticleCreated,
}) => {
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

  useEffect(() => {
    const loadCollectedArticles = async () => {
      try {
        const res = await fetch('/api/wechat-collect?action=list-articles&pageSize=50');
        const data = await res.json();
        const articles = Array.isArray(data) ? data : (data.articles || []);
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

  useEffect(() => {
    const loadWechatAccounts = async () => {
      try {
        const res = await fetch('/api/wechat-accounts');
        const data = await res.json();
        if (data.accounts && Array.isArray(data.accounts)) {
          setWechatAccounts(data.accounts.map((a: { 
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
          const defaultAccount = data.accounts.find((a: { isDefault: boolean }) => a.isDefault === true);
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

  useEffect(() => {
    const loadLayoutStyles = async () => {
      try {
        const res = await fetch('/api/styles?type=layout');
        const data = await res.json();
        if (Array.isArray(data)) {
          setLayoutStyles(data);
        }
      } catch (err) {
        console.error('Failed to load layout styles:', err);
      }
    };
    
    loadLayoutStyles();
  }, []);

  const canProceedFromInput = () => {
    if (inputSource === 'keyword') return keyword.trim().length > 0;
    if (inputSource === 'topic') return selectedTopicId !== '';
    if (inputSource === 'article') return selectedArticleIds.length > 0;
    return false;
  };

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    
    setIsLoading(true);
    setLoadingMessage('正在搜索热点话题...');
    setError('');
    
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'web-search', keyword }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSearchResults(data.content || '');
      setCurrentStep('title');
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateTitles = async () => {
    setIsLoading(true);
    setLoadingMessage('正在生成标题...');
    setError('');
    
    try {
      const selectedArticles = inputSource === 'article' && selectedArticleIds.length > 0
        ? collectedArticles.filter(a => selectedArticleIds.includes(a.id))
        : [];
      const firstArticle = selectedArticles[0] || null;
      
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-title',
          keyword: inputSource === 'keyword' ? keyword : 
                  inputSource === 'topic' ? topics.find(t => t.id === selectedTopicId)?.title : '',
          content: inputSource === 'article' ? selectedArticles.map(a => a.content).join('\n\n---\n\n').substring(0, 5000) : 
                   inputSource === 'keyword' ? searchResults : '',
          style: selectedStyleId,
          originalTitle: firstArticle?.title,
          readCount: firstArticle?.readCount,
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      let titles: TitleOption[] = (data.titles || []).map((t: string, idx: number) => ({
        text: t,
        type: idx < 3 ? 'benefit' : idx < 6 ? 'pain' : 'trend',
      }));
      
      if (firstArticle && firstArticle.readCount && firstArticle.readCount >= 10000) {
        const originalTitleOption: TitleOption = {
          text: firstArticle.title,
          type: 'benefit',
          evaluation: {
            clickScore: 90,
            viralScore: 90,
            relevanceScore: 100,
            qualityScore: 90,
            totalScore: 92,
            analysis: '原标题已验证（阅读量过万），保留使用',
            highlights: ['已验证爆款', `阅读量${firstArticle.readCount.toLocaleString()}`],
          },
        };
        titles = titles.filter(t => t.text !== firstArticle.title);
        titles.unshift(originalTitleOption);
      }
      
      setTitleOptions(titles);
      
      if (titles.length > 1) {
        await evaluateTitleList(titles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成标题失败');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const evaluateTitleList = async (titles: TitleOption[]) => {
    setEvaluatingTitles(true);
    setLoadingMessage('AI正在评估标题...');
    
    try {
      const originalTitle = inputSource === 'article' && selectedArticleIds.length > 0
        ? collectedArticles.find(a => a.id === selectedArticleIds[0])?.title 
        : undefined;
      
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate-title',
          titles: titles.map(t => t.text),
          originalTitle,
        }),
      });
      
      const data = await res.json();
      if (data.evaluations && Array.isArray(data.evaluations)) {
        const evaluatedTitles = titles.map((title, idx) => {
          const evaluation = data.evaluations.find((e: { title: string }) => e.title === title.text);
          return {
            ...title,
            evaluation: evaluation || undefined,
          };
        });
        
        evaluatedTitles.sort((a, b) => {
          const scoreA = a.evaluation?.totalScore || 0;
          const scoreB = b.evaluation?.totalScore || 0;
          return scoreB - scoreA;
        });
        
        setTitleOptions(evaluatedTitles);
        if (evaluatedTitles.length > 0 && evaluatedTitles[0].evaluation) {
          setSelectedTitle(evaluatedTitles[0].text);
        }
      }
    } catch (err) {
      console.error('Title evaluation failed:', err);
    } finally {
      setEvaluatingTitles(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedTitle) {
      setError('请先选择一个标题');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const getKeyword = () => {
        if (inputSource === 'keyword') return keyword;
        if (inputSource === 'topic') return topics.find(t => t.id === selectedTopicId)?.title || '';
        if (inputSource === 'article' && selectedArticleIds.length > 0) return collectedArticles.find(a => a.id === selectedArticleIds[0])?.title || '';
        return '';
      };

      if (inputSource === 'article' && selectedArticleIds.length > 0) {
        const articles = collectedArticles.filter(a => selectedArticleIds.includes(a.id));
        const combinedContent = articles.map(a => a.content).join('\n\n---\n\n').substring(0, 5000);
        const firstArticle = articles[0];
        
        if (combinedContent) {
          setLoadingMessage('正在拆解原文框架（Step 4.2）...');
          
          const decomposeRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'decompose-article',
              content: combinedContent,
              title: firstArticle.title,
            }),
          });
          
          const decomposeData = await decomposeRes.json();
          
          const articleContent = combinedContent.substring(0, 3000);
          
          setLoadingMessage('正在创作开头...');
          
          const openingRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate-opening',
              title: selectedTitle,
              keyword: getKeyword(),
              framework: decomposeData.framework,
              style: selectedStyleId,
              originalContent: articleContent,
            }),
          });
          const openingData = await openingRes.json();
          setOpeningContent(openingData.opening || '');
          
          setLoadingMessage('正在创作正文（参考开头）...');
          
          const bodyRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate-body',
              title: selectedTitle,
              keyword: getKeyword(),
              framework: decomposeData.framework,
              articleType: decomposeData.articleType,
              style: selectedStyleId,
              originalContent: articleContent,
              opening: openingData.opening || '',
            }),
          });
          const bodyData = await bodyRes.json();
          setArticleContent(bodyData.body || '');
          
          setLoadingMessage('正在创作结尾（参考开头和正文）...');
          
          const endingRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate-ending',
              title: selectedTitle,
              body: bodyData.body || '',
              opening: openingData.opening || '',
              originalContent: articleContent,
            }),
          });
          const endingResult = await endingRes.json();
          setEndingContent(endingResult.ending || '');
          
          setCurrentStep('content');
          return;
        }
      }
      
      setLoadingMessage('正在使用完整创作流程（并行请求）...');
      
      const articleContent = inputSource === 'article' && selectedArticleIds.length > 0
        ? collectedArticles.filter(a => selectedArticleIds.includes(a.id)).map(a => a.content).join('\n\n---\n\n').substring(0, 5000)
        : '';
      
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'full-creation-workflow',
          keyword: getKeyword(),
          title: selectedTitle,
          style: selectedStyleId,
          originalContent: articleContent,
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setOpeningContent(data.opening || '');
      setArticleContent(data.body || '');
      setEndingContent(data.ending || '');
      setCurrentStep('content');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成文章失败');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateOpening = async () => {
    if (!selectedTitle) return;
    
    setIsLoading(true);
    setLoadingMessage('正在生成开头...');
    
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-opening',
          title: selectedTitle,
          keyword: inputSource === 'keyword' ? keyword : '',
          style: selectedStyleId,
        }),
      });
      
      const data = await res.json();
      setOpeningContent(data.opening || '');
    } catch (err) {
      console.error('Generate opening failed:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateEnding = async () => {
    if (!selectedTitle || !articleContent) return;
    
    setIsLoading(true);
    setLoadingMessage('正在生成结尾（参考开头和正文）...');
    
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-ending',
          title: selectedTitle,
          body: articleContent,
          opening: openingContent,
          originalContent: selectedArticleIds.length > 0 ? collectedArticles.find(a => a.id === selectedArticleIds[0])?.content?.substring(0, 3000) || '' : '',
        }),
      });
      
      const data = await res.json();
      setEndingContent(data.ending || '');
    } catch (err) {
      console.error('Generate ending failed:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePolish = async () => {
    const fullContent = `${openingContent}\n\n${articleContent}\n\n${endingContent}`.trim();
    if (!fullContent) {
      setError('请先生成文章内容');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('正在进行润色优化...');
    setError('');
    
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'polish-content', 
          content: fullContent,
        }),
      });
      
      const data = await res.json();
      if (data.content) {
        setPolishedContent(data.content);
        setAiCheckResult(data.aiCheckResult || null);
      } else {
        setPolishedContent(fullContent);
      }
      setCurrentStep('polish');
    } catch (err) {
      setError(err instanceof Error ? err.message : '润色优化失败');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleHumanize = async () => {
    const fullContent = `${openingContent}\n\n${articleContent}\n\n${endingContent}`.trim();
    if (!fullContent) return;
    
    setIsLoading(true);
    setLoadingMessage('正在去除AI味...');
    
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'humanize-content', content: fullContent }),
      });
      
      const data = await res.json();
      if (data.content) {
        setPolishedContent(data.content);
      }
    } catch (err) {
      console.error('Humanize failed:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePolishFromContent = async () => {
    const contentToPolish = polishedContent || `${openingContent}\n\n${articleContent}\n\n${endingContent}`.trim();
    if (!contentToPolish) return;
    
    setIsLoading(true);
    setLoadingMessage('正在针对性优化...');
    
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'polish-content', 
          content: contentToPolish,
          aiCheckResult: aiCheckResult,
          isRepolish: true,
        }),
      });
      
      const data = await res.json();
      if (data.content) {
        setPolishedContent(data.content);
        setAiCheckResult(data.aiCheckResult || null);
        setCurrentStep('polish');
      }
    } catch (err) {
      console.error('Polish failed:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateImages = async () => {
    const content = polishedContent || `${openingContent}\n\n${articleContent}\n\n${endingContent}`.trim();
    if (!content || !selectedTitle) {
      setError('请先完成文章创作');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('正在生成配图（30%/60%/90%位置）...');
    setError('');
    
    try {
      const res = await fetch('/api/image-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-article-images',
          content,
          title: selectedTitle,
          imageCount: 3,
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setGeneratedImages(data.images || []);
      setCurrentStep('images');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成配图失败');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePublish = async () => {
    const content = polishedContent || `${openingContent}\n\n${articleContent}\n\n${endingContent}`.trim();
    if (!content || !selectedTitle) {
      setError('请先完成文章创作');
      return;
    }
    
    if (!selectedAccountId) {
      setError('请选择发布账号');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('正在保存改写内容...');
    setError('');
    
    try {
      const saveRes = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-rewrite',
          sourceArticleIds: selectedArticleIds.length > 0 ? selectedArticleIds : [],
          title: selectedTitle,
          content,
          style: selectedStyleId,
          wordCount: content.length,
          aiScore: aiCheckResult?.score,
        }),
      });
      
      const saveData = await saveRes.json();
      if (!saveData.success) {
        console.warn('保存改写内容失败:', saveData.error);
      }
      
      setLoadingMessage('正在发布到微信草稿箱...');
      setPublishStatus('uploading');
      
      const selectedLayoutStyle = layoutStyles.find(s => String(s.id) === selectedLayoutId);
      const layoutStyleConfig = selectedLayoutStyle ? {
        headerStyle: selectedLayoutStyle.headerStyle,
        paragraphSpacing: selectedLayoutStyle.paragraphSpacing,
        listStyle: selectedLayoutStyle.listStyle,
        highlightStyle: selectedLayoutStyle.highlightStyle,
        emojiUsage: selectedLayoutStyle.emojiUsage,
        quoteStyle: selectedLayoutStyle.quoteStyle,
        imagePosition: selectedLayoutStyle.imagePosition,
        calloutStyle: selectedLayoutStyle.calloutStyle,
        colorScheme: selectedLayoutStyle.colorScheme,
        fontStyle: selectedLayoutStyle.fontStyle,
      } : null;
      
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish-with-images',
          accountId: parseInt(selectedAccountId),
          title: selectedTitle,
          content,
          images: generatedImages,
          layoutStyle: layoutStyleConfig,
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setPublishStatus('success');
      setPublishMessage('文章已成功发布到微信草稿箱！');
      setCurrentStep('publish');
    } catch (err) {
      setPublishStatus('error');
      setPublishMessage(err instanceof Error ? err.message : '发布失败');
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSaveDraft = async () => {
    const content = polishedContent || `${openingContent}\n\n${articleContent}\n\n${endingContent}`.trim();
    if (!content || !selectedTitle) {
      setError('请先完成文章创作');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('正在保存草稿...');
    setError('');
    
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-rewrite',
          sourceArticleIds: selectedArticleIds.length > 0 ? selectedArticleIds : [],
          title: selectedTitle,
          content,
          summary: content.substring(0, 200) + '...',
          style: selectedStyleId,
          wordCount: content.length,
          aiScore: aiCheckResult?.score,
        }),
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setPublishStatus('success');
      setPublishMessage('草稿已保存！可在"待发布管理"中查看和发布');
      setCurrentStep('publish');
    } catch (err) {
      setPublishStatus('error');
      setPublishMessage(err instanceof Error ? err.message : '保存失败');
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleOneClickPublish = async () => {
    if (selectedArticleIds.length === 0 || !selectedStyleId) {
      setError('请选择文章和写作风格');
      return;
    }
    
    setShowPublishModal(true);
    setPublishProgress([]);
    setPublishCurrentStep('');
    
    const addProgress = (message: string) => {
      setPublishProgress(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };
    
    const articles = collectedArticles.filter(a => selectedArticleIds.includes(a.id));
    const totalArticles = articles.length;
    let successCount = 0;
    let failCount = 0;
    
    addProgress(`🚀 开始批量改写发布流程，共 ${totalArticles} 篇文章...`);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const articleNum = i + 1;
      
      try {
        addProgress(`\n━━━ 📄 第 ${articleNum}/${totalArticles} 篇: ${article.title.substring(0, 25)}... ━━━`);
        
        const articleContent = article.content?.substring(0, 5000) || '';
        
        setPublishCurrentStep('generate-title');
        addProgress(`[第${articleNum}篇] 📝 正在生成标题...`);
        
        const titleRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-title',
            content: articleContent,
            style: selectedStyleId,
            originalTitle: article.title,
            readCount: article.readCount,
          }),
        });
        
        const titleData = await titleRes.json();
        let titles = titleData.titles || [];
        
        if (titles.length > 0) {
          addProgress(`[第${articleNum}篇] 📊 正在评估标题...`);
          
          const evalRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'evaluate-title',
              titles: titles,
              originalTitle: article.title,
            }),
          });
          
          const evalData = await evalRes.json();
          if (evalData.evaluations && evalData.evaluations.length > 0) {
            evalData.evaluations.sort((a: { totalScore: number }, b: { totalScore: number }) => b.totalScore - a.totalScore);
            titles = evalData.evaluations.map((e: { title: string }) => e.title);
          }
        }
        
        const finalTitle = titles[0] || article.title || '未命名文章';
        addProgress(`[第${articleNum}篇] ✅ 选定标题: ${finalTitle.substring(0, 30)}...`);
        
        setPublishCurrentStep('generate-content');
        addProgress(`[第${articleNum}篇] ✍️ 正在拆解原文框架...`);
        
        const decomposeRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'decompose-article',
            content: articleContent,
            title: finalTitle,
          }),
        });
        const decomposeData = await decomposeRes.json();
        
        addProgress(`[第${articleNum}篇] ✍️ 正在创作开头...`);
        const openingRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-opening',
            title: finalTitle,
            keyword: article.title || '',
            framework: decomposeData.framework,
            style: selectedStyleId,
            originalContent: articleContent.substring(0, 3000),
          }),
        });
        const openingData = await openingRes.json();
        
        addProgress(`[第${articleNum}篇] ✍️ 正在创作正文...`);
        const bodyRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-body',
            title: finalTitle,
            keyword: article.title || '',
            framework: decomposeData.framework,
            articleType: decomposeData.articleType,
            style: selectedStyleId,
            originalContent: articleContent.substring(0, 3000),
            opening: openingData.opening || '',
          }),
        });
        const bodyData = await bodyRes.json();
        
        addProgress(`[第${articleNum}篇] ✍️ 正在创作结尾...`);
        const endingRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-ending',
            title: finalTitle,
            body: bodyData.body || '',
            opening: openingData.opening || '',
            originalContent: articleContent.substring(0, 3000),
          }),
        });
        const endingData = await endingRes.json();
        
        const fullContent = `${openingData.opening || ''}\n\n${bodyData.body || ''}\n\n${endingData.ending || ''}`.trim();
        
        setPublishCurrentStep('polish');
        addProgress(`[第${articleNum}篇] 🎨 正在进行AI检测和润色优化...`);
        
        const checkRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check-ai', content: fullContent }),
        });
        const aiResult = await checkRes.json();
        
        const polishRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'polish-content', 
            content: fullContent,
            aiCheckResult: aiResult,
          }),
        });
        const polishData = await polishRes.json();
        const finalContent = polishData.content || fullContent;
        
        addProgress(`[第${articleNum}篇] ✅ 润色完成`);
        
        setPublishCurrentStep('save');
        addProgress(`[第${articleNum}篇] 💾 正在保存到草稿箱...`);
        
        const saveRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save-rewrite',
            sourceArticleIds: [article.id],
            title: finalTitle,
            content: finalContent,
            summary: finalContent.substring(0, 200) + '...',
            style: selectedStyleId,
            wordCount: finalContent.length,
            aiScore: aiResult?.score,
          }),
        });
        
        const saveData = await saveRes.json();
        if (!saveData.success) {
          throw new Error(saveData.error || '保存失败');
        }
        
        addProgress(`[第${articleNum}篇] 🎉 完成！已保存到草稿箱`);
        successCount++;
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '处理失败';
        addProgress(`[第${articleNum}篇] ❌ 失败: ${errorMsg}`);
        failCount++;
      }
    }
    
    addProgress(`\n━━━ 📊 批量处理完成 ━━━`);
    addProgress(`✅ 成功: ${successCount} 篇`);
    if (failCount > 0) {
      addProgress(`❌ 失败: ${failCount} 篇`);
    }
    
    setPublishCurrentStep('done');
    
    if (successCount > 0) {
      addProgress(`🎉 全部完成！${successCount} 篇文章已保存到草稿箱`);
    }
  };

  const handleComplete = () => {
    const finalContent = polishedContent || `${openingContent}\n\n${articleContent}\n\n${endingContent}`.trim();
    if (onArticleCreated && selectedTitle && finalContent) {
      onArticleCreated({ title: selectedTitle, content: finalContent });
    }
    setCurrentStep('done');
  };

  const handleReset = () => {
    setInputSource('keyword');
    setCurrentStep('input');
    setKeyword('');
    setSelectedTopicId('');
    setSelectedArticleIds([]);
    setSearchResults('');
    setTitleOptions([]);
    setSelectedTitle('');
    setArticleContent('');
    setOpeningContent('');
    setEndingContent('');
    setAiCheckResult(null);
    setPolishedContent('');
    setGeneratedImages([]);
    setPublishStatus('idle');
    setPublishMessage('');
    setError('');
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      maxWidth: '1200px',
      width: '100%',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
    },
    workflowSteps: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '24px',
      padding: '12px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    },
    stepItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    stepActive: {
      backgroundColor: '#3b82f6',
      color: '#fff',
    },
    stepCompleted: {
      backgroundColor: '#10b981',
      color: '#fff',
    },
    stepPending: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
    },
    stepArrow: {
      color: '#cbd5e1',
      fontSize: '14px',
      flexShrink: 0,
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: '24px',
    },
    mainContentSingle: {
      display: 'block',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      marginBottom: '16px',
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    inputGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    inputFocus: {
      border: '1px solid #3b82f6',
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#fff',
      cursor: 'pointer',
    },
    sourceTabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
    },
    sourceTab: {
      flex: 1,
      padding: '12px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#fff',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s',
    },
    sourceTabActive: {
      border: '2px solid #3b82f6',
      backgroundColor: '#eff6ff',
    },
    sourceTabTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '4px',
    },
    sourceTabDesc: {
      fontSize: '12px',
      color: '#64748b',
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    buttonSecondary: {
      padding: '10px 20px',
      backgroundColor: '#fff',
      color: '#3b82f6',
      border: '1px solid #3b82f6',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
    },
    buttonDisabled: {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px',
    },
    titleList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    titleItem: {
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    titleItemSelected: {
      border: '2px solid #3b82f6',
      backgroundColor: '#eff6ff',
    },
    titleText: {
      fontSize: '14px',
      color: '#1e293b',
      lineHeight: '1.5',
    },
    titleType: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600',
      marginTop: '8px',
    },
    typeBenefit: {
      backgroundColor: '#dcfce7',
      color: '#166534',
    },
    typePain: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    typeTrend: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
    },
    contentEditor: {
      width: '100%',
      minHeight: '300px',
      padding: '16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '1.8',
      resize: 'vertical',
      outline: 'none',
    },
    previewContent: {
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '1.8',
      whiteSpace: 'pre-wrap',
      maxHeight: '400px',
      overflowY: 'auto',
    },
    aiCheckResult: {
      marginTop: '16px',
    },
    scoreDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px',
    },
    scoreCircle: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: '700',
    },
    scoreLow: {
      backgroundColor: '#dcfce7',
      color: '#166534',
    },
    scoreMedium: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    scoreHigh: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    issuesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    issueItem: {
      padding: '12px',
      backgroundColor: '#fef2f2',
      borderRadius: '6px',
      fontSize: '13px',
      color: '#991b1b',
    },
    suggestionItem: {
      padding: '12px',
      backgroundColor: '#f0fdf4',
      borderRadius: '6px',
      fontSize: '13px',
      color: '#166534',
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    loadingCard: {
      backgroundColor: '#fff',
      padding: '32px 48px',
      borderRadius: '12px',
      textAlign: 'center',
    },
    loadingSpinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #e2e8f0',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 16px',
    },
    loadingText: {
      fontSize: '16px',
      color: '#1e293b',
    },
    errorAlert: {
      padding: '12px 16px',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      color: '#991b1b',
      fontSize: '14px',
      marginBottom: '16px',
    },
    styleChips: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    styleChip: {
      padding: '8px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: '#fff',
    },
    styleChipActive: {
      backgroundColor: '#8b5cf6',
      color: '#fff',
      border: '1px solid #8b5cf6',
    },
    configCard: {
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '16px',
    },
    configRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    configLabel: {
      fontSize: '13px',
      color: '#64748b',
    },
    configValue: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#1e293b',
    },
    doneCard: {
      textAlign: 'center',
      padding: '48px',
    },
    doneIcon: {
      fontSize: '64px',
      marginBottom: '16px',
    },
    doneTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '8px',
    },
    doneDesc: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '24px',
    },
  };

  const getStepStyle = (step: WorkflowStep) => {
    const steps: WorkflowStep[] = ['input', 'title', 'content', 'polish', 'images', 'publish', 'done'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return { ...styles.stepItem, ...styles.stepCompleted };
    if (stepIndex === currentIndex) return { ...styles.stepItem, ...styles.stepActive };
    return { ...styles.stepItem, ...styles.stepPending };
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return styles.scoreLow;
    if (score <= 60) return styles.scoreMedium;
    return styles.scoreHigh;
  };

  const getTitleTypeLabel = (type: string) => {
    switch (type) {
      case 'benefit': return '利益结果型';
      case 'pain': return '场景痛点型';
      case 'trend': return '新机会趋势型';
      default: return '';
    }
  };

  const getTitleTypeStyle = (type: string) => {
    switch (type) {
      case 'benefit': return styles.typeBenefit;
      case 'pain': return styles.typePain;
      case 'trend': return styles.typeTrend;
      default: return {};
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title} data-cw-title>✍️ 创作工作台</h2>
        <p style={styles.subtitle} data-cw-subtitle>一键式创作文章 · 从选题到发布的完整工作流</p>
      </div>

      <div style={styles.workflowSteps} data-cw-workflow-steps>
        <div style={getStepStyle('input')} data-cw-step-item>
          <span>1️⃣</span> 输入来源
        </div>
        <span style={styles.stepArrow} data-cw-step-arrow>→</span>
        <div style={getStepStyle('title')} data-cw-step-item>
          <span>2️⃣</span> 生成标题
        </div>
        <span style={styles.stepArrow} data-cw-step-arrow>→</span>
        <div style={getStepStyle('content')} data-cw-step-item>
          <span>3️⃣</span> 创作内容
        </div>
        <span style={styles.stepArrow} data-cw-step-arrow>→</span>
        <div style={getStepStyle('polish')} data-cw-step-item>
          <span>4️⃣</span> 润色优化
        </div>
        <span style={styles.stepArrow} data-cw-step-arrow>→</span>
        <div style={getStepStyle('images')} data-cw-step-item>
          <span>5️⃣</span> 生成配图
        </div>
        <span style={styles.stepArrow} data-cw-step-arrow>→</span>
        <div style={getStepStyle('publish')} data-cw-step-item>
          <span>6️⃣</span> 发布
        </div>
        <span style={styles.stepArrow} data-cw-step-arrow>→</span>
        <div style={getStepStyle('done')} data-cw-step-item>
          <span>✅</span> 完成
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          ⚠️ {error}
        </div>
      )}

      {currentStep === 'input' && (
        <div style={styles.mainContentSingle}>
          <div style={styles.card} data-cw-card>
            <h3 style={styles.cardTitle} data-cw-card-title>📥 选择输入来源</h3>
            
            <div style={styles.sourceTabs} data-cw-source-tabs>
              <div 
                style={{ ...styles.sourceTab, ...(inputSource === 'keyword' ? styles.sourceTabActive : {}) }}
                onClick={() => setInputSource('keyword')}
                data-cw-source-tab
              >
                <div style={styles.sourceTabTitle} data-cw-source-tab-title>🔍 关键词搜索</div>
                <div style={styles.sourceTabDesc} data-cw-source-tab-desc>输入关键词搜索热点</div>
              </div>
              <div 
                style={{ ...styles.sourceTab, ...(inputSource === 'topic' ? styles.sourceTabActive : {}) }}
                onClick={() => setInputSource('topic')}
                data-cw-source-tab
              >
                <div style={styles.sourceTabTitle} data-cw-source-tab-title>📌 选题库</div>
                <div style={styles.sourceTabDesc} data-cw-source-tab-desc>从已有选题中选择</div>
              </div>
              <div 
                style={{ ...styles.sourceTab, ...(inputSource === 'article' ? styles.sourceTabActive : {}) }}
                onClick={() => setInputSource('article')}
                data-cw-source-tab
              >
                <div style={styles.sourceTabTitle} data-cw-source-tab-title>📄 已采集文章</div>
                <div style={styles.sourceTabDesc} data-cw-source-tab-desc>改写已有文章</div>
              </div>
            </div>

            {inputSource === 'keyword' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>输入关键词</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="如：AI编程、Claude Code、职场效率"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  data-cw-input
                />
              </div>
            )}

            {inputSource === 'topic' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>选择选题</label>
                <select
                  style={styles.select}
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  data-cw-input
                >
                  <option value="">请选择选题...</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title} ({topic.source})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {inputSource === 'article' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>选择文章（可多选）</label>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  padding: '8px'
                }}>
                  {collectedArticles.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                      暂无已采集的文章，请先在"内容监控"中采集文章
                    </div>
                  ) : (
                    collectedArticles.map(article => (
                      <label 
                        key={article.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          padding: '12px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          backgroundColor: selectedArticleIds.includes(article.id) ? '#f0f9ff' : 'transparent',
                          borderRadius: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedArticleIds.includes(article.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedArticleIds([...selectedArticleIds, article.id]);
                            } else {
                              setSelectedArticleIds(selectedArticleIds.filter(id => id !== article.id));
                            }
                          }}
                          style={{ marginTop: '4px', marginRight: '12px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>
                            {article.title}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            {article.author}
                            {article.readCount && article.readCount >= 10000 ? ` · 🔥${(article.readCount / 10000).toFixed(1)}万阅读` : 
                             article.readCount && article.readCount >= 1000 ? ` · ${(article.readCount / 1000).toFixed(1)}k阅读` : ''}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {selectedArticleIds.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#059669' }}>
                    已选择 {selectedArticleIds.length} 篇文章
                  </div>
                )}
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>写作风格</label>
              <div style={styles.styleChips}>
                <div 
                  style={{ ...styles.styleChip, ...(selectedStyleId === '' ? styles.styleChipActive : {}) }}
                  onClick={() => setSelectedStyleId('')}
                  data-cw-style-chip
                >
                  默认风格
                </div>
                {writingStyles.map(style => (
                  <div 
                    key={style.id}
                    style={{ ...styles.styleChip, ...(selectedStyleId === String(style.id) ? styles.styleChipActive : {}) }}
                    onClick={() => setSelectedStyleId(String(style.id))}
                    data-cw-style-chip
                  >
                    {style.name}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>排版风格</label>
              <div style={styles.styleChips}>
                <div 
                  style={{ ...styles.styleChip, ...(selectedLayoutId === '' ? styles.styleChipActive : {}) }}
                  onClick={() => setSelectedLayoutId('')}
                  data-cw-style-chip
                >
                  默认排版
                </div>
                {layoutStyles.map(style => (
                  <div 
                    key={style.id}
                    style={{ ...styles.styleChip, ...(selectedLayoutId === String(style.id) ? styles.styleChipActive : {}) }}
                    onClick={() => setSelectedLayoutId(String(style.id))}
                    title={style.description || ''}
                    data-cw-style-chip
                  >
                    {style.name}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.configCard} data-cw-config-card>
              <div style={styles.configRow} data-cw-config-row>
                <span style={styles.configLabel}>当前大模型</span>
                <span style={styles.configValue}>
                  {llmConfig.model || '未配置'}
                </span>
              </div>
              <div style={styles.configRow} data-cw-config-row>
                <span style={styles.configLabel}>API状态</span>
                <span style={{ ...styles.configValue, color: llmConfig.apiKey ? '#10b981' : '#ef4444' }}>
                  {llmConfig.apiKey ? '✓ 已配置' : '⚠ 未配置'}
                </span>
              </div>
            </div>

            <div style={styles.buttonGroup} data-cw-btn-group>
              {inputSource === 'keyword' ? (
                <button 
                  style={{ ...styles.button, ...(!canProceedFromInput() || isLoading ? styles.buttonDisabled : {}) }}
                  onClick={handleSearch}
                  disabled={!canProceedFromInput() || isLoading}
                  data-cw-btn
                >
                  🔍 搜索热点话题
                </button>
              ) : (
                <>
                  <button 
                    style={{ ...styles.button, ...(!canProceedFromInput() || isLoading ? styles.buttonDisabled : {}) }}
                    onClick={() => setCurrentStep('title')}
                    disabled={!canProceedFromInput() || isLoading}
                    data-cw-btn
                  >
                    下一步 →
                  </button>
                  {inputSource === 'article' && selectedArticleIds.length > 0 && selectedStyleId && (
                    <button 
                      style={{ ...styles.button, backgroundColor: '#10b981', ...(!canProceedFromInput() || isLoading ? styles.buttonDisabled : {}) }}
                      onClick={handleOneClickPublish}
                      disabled={!canProceedFromInput() || isLoading}
                      data-cw-btn
                    >
                      ⚡ 批量改写发布
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {currentStep === 'title' && (
        <div style={styles.mainContent} data-cw-grid>
          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>
                📝 选择标题
                {evaluatingTitles && <span style={{ fontSize: '12px', color: '#8b5cf6', marginLeft: '8px' }}>AI评估中...</span>}
              </h3>
              
              {titleOptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  <p>点击下方按钮生成标题</p>
                </div>
              ) : (
                <div style={styles.titleList}>
                  {titleOptions.map((title, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        ...styles.titleItem, 
                        ...(selectedTitle === title.text ? styles.titleItemSelected : {}),
                        position: 'relative',
                      }}
                      onClick={() => setSelectedTitle(title.text)}
                      data-cw-title-item
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ ...styles.titleText, flex: 1 }}>
                          {title.evaluation?.totalScore && title.evaluation.totalScore >= 80 && (
                            <span style={{ 
                              display: 'inline-block',
                              padding: '2px 6px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600',
                              marginRight: '6px'
                            }}>
                              🔥 推荐
                            </span>
                          )}
                          {title.text}
                        </div>
                        {title.evaluation && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            backgroundColor: title.evaluation.totalScore >= 80 ? '#dcfce7' : title.evaluation.totalScore >= 60 ? '#fef3c7' : '#f1f5f9',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: title.evaluation.totalScore >= 80 ? '#166534' : title.evaluation.totalScore >= 60 ? '#92400e' : '#64748b',
                            whiteSpace: 'nowrap',
                          }}>
                            <span>{title.evaluation.totalScore}分</span>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ ...styles.titleType, ...getTitleTypeStyle(title.type) }}>
                          {getTitleTypeLabel(title.type)}
                        </span>
                        
                        {title.evaluation && (
                          <>
                            {title.evaluation.clickScore !== undefined && (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                点击{title.evaluation.clickScore}%
                              </span>
                            )}
                            {title.evaluation.viralScore !== undefined && (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                热门{title.evaluation.viralScore}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      
                      {title.evaluation?.analysis && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '8px 10px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#64748b',
                          lineHeight: '1.4',
                        }}>
                          💡 {title.evaluation.analysis}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.buttonGroup} data-cw-btn-group>
                <button 
                  style={styles.buttonSecondary}
                  onClick={handleGenerateTitles}
                  disabled={isLoading || evaluatingTitles}
                  data-cw-btn
                >
                  🔄 重新生成
                </button>
                <button 
                  style={{ ...styles.button, ...(!selectedTitle || isLoading ? styles.buttonDisabled : {}) }}
                  onClick={handleGenerateContent}
                  disabled={!selectedTitle || isLoading}
                  data-cw-btn
                >
                  确认标题，生成内容 →
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📊 输入信息</h3>
              <div style={styles.configCard} data-cw-config-card>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>输入来源</span>
                  <span style={styles.configValue}>
                    {inputSource === 'keyword' ? '关键词搜索' : 
                     inputSource === 'topic' ? '选题库' : '已采集文章'}
                  </span>
                </div>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>关键词/主题</span>
                  <span style={styles.configValue}>
                    {inputSource === 'keyword' ? keyword : 
                     inputSource === 'topic' ? topics.find(t => t.id === selectedTopicId)?.title?.substring(0, 20) + '...' :
                     selectedArticleIds.length > 0 ? `${selectedArticleIds.length}篇文章` : ''}
                  </span>
                </div>
                {inputSource === 'article' && selectedArticleIds.length > 0 && (
                  <div style={{ ...styles.configRow, borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }} data-cw-config-row>
                    <span style={styles.configLabel}>参考文章</span>
                    <span style={{ ...styles.configValue, fontSize: '12px', maxWidth: '200px', wordBreak: 'break-all' }}>
                      {collectedArticles.filter(a => selectedArticleIds.includes(a.id)).map(a => a.title).join('、').substring(0, 50)}...
                    </span>
                  </div>
                )}
                
                {contentAnalysis && (
                  <div style={{ 
                    ...styles.configRow, 
                    borderTop: '1px solid #e2e8f0', 
                    paddingTop: '12px', 
                    marginTop: '8px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }} data-cw-config-row>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <span style={styles.configLabel}>内容类型</span>
                      <span style={{ 
                        padding: '2px 8px', 
                        backgroundColor: '#dbeafe', 
                        color: '#1e40af', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: '500',
                      }}>
                        {contentAnalysis.typeName}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        置信度 {contentAnalysis.confidence}%
                      </span>
                    </div>
                    
                    {contentAnalysis.features?.length > 0 && (
                      <div style={{ width: '100%' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>特征识别：</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {contentAnalysis.features.map((f, i) => (
                            <span key={i} style={{ 
                              fontSize: '10px', 
                              padding: '2px 6px', 
                              backgroundColor: '#f1f5f9', 
                              color: '#475569',
                              borderRadius: '3px',
                            }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {contentAnalysis.suggestions?.length > 0 && (
                      <div style={{ width: '100%' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>改写建议：</span>
                        <div style={{ fontSize: '11px', color: '#059669', lineHeight: '1.5' }}>
                          {contentAnalysis.suggestions.map((s, i) => (
                            <div key={i} style={{ marginBottom: '2px' }}>• {s}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {searchResults && (
                <div style={{ marginTop: '16px' }}>
                  <label style={styles.label}>搜索结果</label>
                  <div style={{ ...styles.previewContent, maxHeight: '200px', fontSize: '12px' }} data-cw-preview>
                    {searchResults}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>💡 标题模型说明</h3>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
                <p><strong style={{ color: '#166534' }}>利益结果型：</strong>人群 + 痛点/需求 + 解决方案/结果</p>
                <p><strong style={{ color: '#92400e' }}>场景痛点型：</strong>具体场景 + 痛点描述 + 转折/解决</p>
                <p><strong style={{ color: '#1e40af' }}>新机会趋势型：</strong>新趋势 + 影响人群 + 行动建议</p>
              </div>
            </div>
            
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📈 评分说明</h3>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                <p><strong>点击概率(40%)：</strong>引发好奇、利益点、情感共鸣</p>
                <p><strong>热门潜力(30%)：</strong>热点趋势、传播价值、话题性</p>
                <p><strong>内容匹配(20%)：</strong>标题与内容匹配度</p>
                <p><strong>表达质量(10%)：</strong>语言精炼度</p>
                {inputSource === 'article' && (
                  <p style={{ color: '#8b5cf6', marginTop: '8px' }}>
                    ⭐ 文章改写模式：以原标题为高标准基准进行参照评分
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'content' && (
        <div style={styles.mainContent} data-cw-grid>
          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>✍️ 文章内容</h3>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>开头（身份+痛点+确定结果）</label>
                <textarea
                  style={styles.contentEditor}
                  value={openingContent}
                  onChange={(e) => setOpeningContent(e.target.value)}
                  placeholder="点击生成开头，或手动编辑..."
                  rows={4}
                  data-cw-textarea
                />
                <button 
                  style={{ ...styles.buttonSecondary, marginTop: '8px' }}
                  onClick={handleGenerateOpening}
                  disabled={isLoading}
                  data-cw-btn
                >
                  ✨ 生成开头
                </button>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>正文</label>
                <textarea
                  style={{ ...styles.contentEditor, minHeight: '400px' }}
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="文章正文内容..."
                  data-cw-textarea
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>结尾（总结+行动+互动）</label>
                <textarea
                  style={styles.contentEditor}
                  value={endingContent}
                  onChange={(e) => setEndingContent(e.target.value)}
                  placeholder="点击生成结尾，或手动编辑..."
                  rows={4}
                  data-cw-textarea
                />
                <button 
                  style={{ ...styles.buttonSecondary, marginTop: '8px' }}
                  onClick={handleGenerateEnding}
                  disabled={isLoading}
                  data-cw-btn
                >
                  ✨ 生成结尾
                </button>
              </div>

              <div style={styles.buttonGroup} data-cw-btn-group>
                <button 
                  style={styles.buttonSecondary}
                  onClick={() => setCurrentStep('title')}
                  data-cw-btn
                >
                  ← 返回修改标题
                </button>
                <button 
                  style={styles.button}
                  onClick={handlePolish}
                  disabled={isLoading}
                  data-cw-btn
                >
                  🎨 润色优化 →
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📋 当前标题</h3>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', lineHeight: '1.5' }}>
                {selectedTitle}
              </div>
            </div>

            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📊 字数统计</h3>
              <div style={styles.configCard} data-cw-config-card>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>开头</span>
                  <span style={styles.configValue}>{openingContent.length} 字</span>
                </div>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>正文</span>
                  <span style={styles.configValue}>{articleContent.length} 字</span>
                </div>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>结尾</span>
                  <span style={styles.configValue}>{endingContent.length} 字</span>
                </div>
                <div style={{ ...styles.configRow, borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }} data-cw-config-row>
                  <span style={{ ...styles.configLabel, fontWeight: '600' }}>总计</span>
                  <span style={{ ...styles.configValue, fontWeight: '600', color: '#3b82f6' }}>
                    {openingContent.length + articleContent.length + endingContent.length} 字
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'polish' && (
        <div style={styles.mainContent} data-cw-grid>
          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>🎨 润色优化</h3>
              
              {aiCheckResult && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '16px', 
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: aiCheckResult.score >= 80 ? '#dcfce7' : aiCheckResult.score >= 50 ? '#fef3c7' : '#fee2e2',
                      color: aiCheckResult.score >= 80 ? '#166534' : aiCheckResult.score >= 50 ? '#92400e' : '#991b1b'
                    }}>
                      AI味评分: {aiCheckResult.score}分
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {aiCheckResult.score >= 80 ? '✅ 低AI味（好）' : 
                       aiCheckResult.score >= 50 ? '⚠️ 中等AI味' : '❌ 高AI味（需优化）'}
                    </span>
                  </div>
                  {aiCheckResult.issues.length > 0 && (
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      <strong>检测到的问题：</strong>{aiCheckResult.issues.slice(0, 3).join('；')}
                      {aiCheckResult.issues.length > 3 && `等${aiCheckResult.issues.length}个问题`}
                    </div>
                  )}
                </div>
              )}
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>润色后的内容</label>
                <textarea
                  style={{ ...styles.contentEditor, minHeight: '500px' }}
                  value={polishedContent}
                  onChange={(e) => setPolishedContent(e.target.value)}
                  placeholder="润色后的内容将显示在这里..."
                  data-cw-textarea
                />
              </div>

              <div style={styles.buttonGroup} data-cw-btn-group>
                <button 
                  style={styles.buttonSecondary}
                  onClick={() => setCurrentStep('content')}
                  data-cw-btn
                >
                  ← 返回修改内容
                </button>
                <button 
                  style={{ ...styles.button, backgroundColor: '#f59e0b' }}
                  onClick={handlePolish}
                  disabled={isLoading}
                  data-cw-btn
                >
                  🔄 重新润色
                </button>
                <button 
                  style={{ ...styles.button, backgroundColor: '#8b5cf6' }}
                  onClick={handleGenerateImages}
                  disabled={isLoading || !polishedContent}
                  data-cw-btn
                >
                  🖼️ 生成配图 →
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📊 对比</h3>
              <div style={styles.configCard} data-cw-config-card>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>原文字数</span>
                  <span style={styles.configValue}>
                    {openingContent.length + articleContent.length + endingContent.length} 字
                  </span>
                </div>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>润色后字数</span>
                  <span style={{ ...styles.configValue, color: '#10b981' }}>
                    {polishedContent.length} 字
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📋 标题</h3>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', lineHeight: '1.5' }}>
                {selectedTitle}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'images' && (
        <div style={styles.mainContent} data-cw-grid>
          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>🖼️ 文章配图</h3>
              
              {generatedImages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  <p>点击下方按钮生成配图</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    将在文章30%、60%、90%位置生成配图
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {generatedImages.map((img, idx) => (
                    <div key={idx} style={{ 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f8fafc',
                        fontSize: '12px',
                        color: '#64748b',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        📍 位置：{Math.round(img.position * 100)}% | Prompt: {img.prompt.substring(0, 50)}...
                      </div>
                      <img 
                        src={`data:image/jpeg;base64,${img.imageBase64}`}
                        alt={`配图${idx + 1}`}
                        style={{ width: '100%', display: 'block' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.buttonGroup} data-cw-btn-group>
                <button 
                  style={styles.buttonSecondary}
                  onClick={() => setCurrentStep('polish')}
                  data-cw-btn
                >
                  ← 返回润色
                </button>
                <button 
                  style={{ ...styles.button, backgroundColor: '#8b5cf6' }}
                  onClick={handleGenerateImages}
                  disabled={isLoading}
                  data-cw-btn
                >
                  🔄 重新生成配图
                </button>
                <button 
                  style={{ ...styles.button, backgroundColor: '#10b981' }}
                  onClick={() => setCurrentStep('publish')}
                  disabled={isLoading}
                  data-cw-btn
                >
                  确认配图，去发布 →
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📋 文章预览</h3>
              <div style={{ ...styles.previewContent, maxHeight: '400px' }} data-cw-preview>
                <strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>{selectedTitle}</strong>
                {polishedContent.substring(0, 500)}...
              </div>
            </div>

            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📊 配图信息</h3>
              <div style={styles.configCard} data-cw-config-card>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>配图数量</span>
                  <span style={styles.configValue}>{generatedImages.length} 张</span>
                </div>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>图片尺寸</span>
                  <span style={styles.configValue}>16:9 横版</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'publish' && (
        <div style={styles.mainContent} data-cw-grid>
          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📤 发布到微信公众号</h3>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>选择发布账号</label>
                <select
                  style={styles.select}
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  data-cw-input
                >
                  <option value="">请选择公众号账号...</option>
                  {wechatAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}{account.isDefault ? '（默认）' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAccountId && (
                <div style={styles.configCard} data-cw-config-card>
                  <div style={styles.configRow} data-cw-config-row>
                    <span style={styles.configLabel}>账号状态</span>
                    <span style={{ 
                      ...styles.configValue, 
                      color: wechatAccounts.find(a => a.id === parseInt(selectedAccountId))?.appId ? '#10b981' : '#ef4444'
                    }}>
                      {wechatAccounts.find(a => a.id === parseInt(selectedAccountId))?.appId ? '✓ 已配置' : '⚠ 未配置AppID'}
                    </span>
                  </div>
                </div>
              )}

              {publishStatus === 'success' && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#dcfce7', 
                  borderRadius: '8px', 
                  color: '#166534',
                  marginBottom: '16px'
                }}>
                  ✅ {publishMessage}
                </div>
              )}

              {publishStatus === 'error' && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#fee2e2', 
                  borderRadius: '8px', 
                  color: '#991b1b',
                  marginBottom: '16px'
                }}>
                  ❌ {publishMessage}
                </div>
              )}

              <div style={styles.buttonGroup} data-cw-btn-group>
                <button 
                  style={styles.buttonSecondary}
                  onClick={() => setCurrentStep('images')}
                  data-cw-btn
                >
                  ← 返回配图
                </button>
                <button 
                  style={{ ...styles.button, backgroundColor: '#6b7280' }}
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  data-cw-btn
                >
                  💾 保存草稿
                </button>
                <button 
                  style={{ ...styles.button, backgroundColor: '#10b981' }}
                  onClick={handlePublish}
                  disabled={isLoading || !selectedAccountId || publishStatus === 'success'}
                  data-cw-btn
                >
                  📤 发布到草稿箱
                </button>
                {publishStatus === 'success' && (
                  <button 
                    style={styles.button}
                    onClick={handleComplete}
                    data-cw-btn
                  >
                    ✅ 完成创作
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>📋 发布预览</h3>
              <div style={styles.configCard} data-cw-config-card>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>文章标题</span>
                  <span style={styles.configValue}>{selectedTitle}</span>
                </div>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>文章字数</span>
                  <span style={styles.configValue}>{polishedContent.length} 字</span>
                </div>
                <div style={styles.configRow} data-cw-config-row>
                  <span style={styles.configLabel}>配图数量</span>
                  <span style={styles.configValue}>{generatedImages.length} 张</span>
                </div>
              </div>
            </div>

            <div style={styles.card} data-cw-card>
              <h3 style={styles.cardTitle} data-cw-card-title>🖼️ 配图预览</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {generatedImages.map((img, idx) => (
                  <img 
                    key={idx}
                    src={`data:image/jpeg;base64,${img.imageBase64}`}
                    alt={`配图${idx + 1}`}
                    style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                    data-cw-image-preview
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'done' && (
        <div style={styles.card} data-cw-card>
          <div style={styles.doneCard} data-cw-done-card>
            <div style={styles.doneIcon} data-cw-done-icon>🎉</div>
            <h3 style={styles.doneTitle} data-cw-done-title>创作完成！</h3>
            <p style={styles.doneDesc}>
              文章《{selectedTitle}》已创作完成并发布
            </p>
            <div style={styles.configCard} data-cw-config-card>
              <div style={styles.configRow} data-cw-config-row>
                <span style={styles.configLabel}>文章字数</span>
                <span style={styles.configValue}>{polishedContent.length} 字</span>
              </div>
              <div style={styles.configRow} data-cw-config-row>
                <span style={styles.configLabel}>配图数量</span>
                <span style={styles.configValue}>{generatedImages.length} 张</span>
              </div>
              <div style={styles.configRow} data-cw-config-row>
                <span style={styles.configLabel}>发布状态</span>
                <span style={{ ...styles.configValue, color: '#10b981' }}>✓ 已发布到草稿箱</span>
              </div>
            </div>
            <div style={styles.buttonGroup} data-cw-btn-group>
              <button 
                style={styles.buttonSecondary}
                onClick={handleReset}
                data-cw-btn
              >
                🔄 创作新文章
              </button>
              <button 
                style={styles.button}
                onClick={() => {
                  navigator.clipboard.writeText(polishedContent);
                  alert('内容已复制到剪贴板！');
                }}
                data-cw-btn
              >
                📋 复制内容
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingCard} data-cw-loading-card>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>{loadingMessage}</div>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                ⚡ 批量改写发布进度
              </h3>
              <button
                onClick={() => setShowPublishModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}>
              {['generate-title', 'generate-content', 'polish', 'save', 'done'].map((step, idx) => {
                const labels = ['生成标题', '创作内容', '润色优化', '保存草稿', '完成'];
                const isActive = publishCurrentStep === step;
                const isDone = ['generate-title', 'generate-content', 'polish', 'save', 'done'].indexOf(publishCurrentStep) > idx;
                return (
                  <div
                    key={step}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: isActive ? '#dbeafe' : isDone ? '#dcfce7' : '#f1f5f9',
                      color: isActive ? '#1d4ed8' : isDone ? '#166534' : '#64748b',
                    }}
                  >
                    {isDone ? '✓' : `${idx + 1}.`} {labels[idx]}
                  </div>
                );
              })}
            </div>
            
            <div style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.6',
            }}>
              {publishProgress.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center' }}>准备中...</div>
              ) : (
                publishProgress.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', color: '#475569' }}>
                    {log}
                  </div>
                ))
              )}
            </div>
            
            {publishCurrentStep === 'done' && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#dcfce7',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#166534',
                fontWeight: '500',
              }}>
                🎉 发布成功！文章已保存到草稿箱
              </div>
            )}
            
            {publishCurrentStep === 'error' && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fee2e2',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#991b1b',
                fontWeight: '500',
              }}>
                ❌ 发布失败，请重试
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          [data-cw-grid] {
            grid-template-columns: 1fr !important;
          }
          [data-cw-card] {
            padding: 16px !important;
            margin-bottom: 12px !important;
          }
          [data-cw-title] {
            font-size: 20px !important;
            margin-bottom: 6px !important;
          }
          [data-cw-subtitle] {
            font-size: 13px !important;
          }
          [data-cw-card-title] {
            font-size: 15px !important;
            margin-bottom: 12px !important;
          }
          [data-cw-input] {
            padding: 10px 12px !important;
            font-size: 16px !important;
          }
          [data-cw-textarea] {
            min-height: 200px !important;
            padding: 12px !important;
            font-size: 15px !important;
          }
          [data-cw-btn] {
            padding: 10px 16px !important;
            font-size: 14px !important;
          }
          [data-cw-btn-group] {
            flex-direction: column !important;
            gap: 8px !important;
          }
          [data-cw-btn-group] > button {
            width: 100% !important;
          }
          [data-cw-source-tab] {
            padding: 10px 8px !important;
          }
          [data-cw-source-tab-title] {
            font-size: 13px !important;
          }
          [data-cw-source-tab-desc] {
            font-size: 11px !important;
          }
          [data-cw-style-chip] {
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
          [data-cw-config-row] {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }
          [data-cw-title-item] {
            padding: 10px 12px !important;
          }
          [data-cw-preview] {
            max-height: 250px !important;
            padding: 12px !important;
            font-size: 13px !important;
          }
          [data-cw-score-circle] {
            width: 60px !important;
            height: 60px !important;
            font-size: 20px !important;
          }
          [data-cw-issue-item] {
            padding: 10px !important;
            font-size: 12px !important;
          }
          [data-cw-loading-card] {
            padding: 24px 32px !important;
            margin: 16px !important;
          }
          [data-cw-done-card] {
            padding: 32px 16px !important;
          }
          [data-cw-done-icon] {
            font-size: 48px !important;
          }
          [data-cw-done-title] {
            font-size: 20px !important;
          }
          [data-cw-image-preview] {
            width: 60px !important;
            height: 34px !important;
          }
        }
        
        @media (max-width: 480px) {
          [data-cw-card] {
            padding: 12px !important;
          }
          [data-cw-title] {
            font-size: 18px !important;
          }
          [data-cw-step-item] {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
          [data-cw-step-arrow] {
            font-size: 12px !important;
          }
          [data-cw-source-tabs] {
            flex-direction: column !important;
          }
          [data-cw-source-tab] {
            padding: 8px !important;
          }
          [data-cw-textarea] {
            min-height: 150px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateWorkbench;
