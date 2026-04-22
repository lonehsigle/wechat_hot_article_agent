'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';

const safeSanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html;
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'img', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'section', 'figure', 'figcaption', 'dl', 'dt', 'dd', 'sup', 'sub', 'hr'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'data-src', 'data-type', 'id', 'colspan', 'rowspan'],
    });
  } catch {
    return html;
  }
};
import MarkdownEditor from './MarkdownEditor';
import { htmlToMarkdown, markdownToHtml } from '@/lib/utils/html-markdown';

function WechatCollectPage({ mode = 'collect' }: { mode?: 'collect' | 'account' } = {}) {
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [articles, setArticles] = useState<Array<{
    id: number;
    title: string;
    author: string | null;
    digest: string | null;
    content: string | null;
    contentHtml: string | null;
    coverImage: string | null;
    sourceUrl: string;
    publishTime: string | null;
    readCount: number;
    likeCount: number;
    commentCount: number;
    recommendCount: number;
    shareCount: number;
    engagementRate: number;
  }>>([]);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [copyingField, setCopyingField] = useState<{articleId: number; field: string} | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<number | null>(null);
  const [editingArticle, setEditingArticle] = useState<{id: number; title: string; content: string; contentHtml: string} | null>(null);
  const [editingArticleData, setEditingArticleData] = useState<{id: number; title: string; readCount: number; likeCount: number; commentCount: number; recommendCount: number; shareCount: number; publishTime: string} | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [isFullscreenEdit, setIsFullscreenEdit] = useState(false);
  const [editMode, setEditMode] = useState<'markdown' | 'html' | 'preview'>('markdown');
  const [markdownContent, setMarkdownContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubscriptionUrl, setNewSubscriptionUrl] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);
  const [parsingUrl, setParsingUrl] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<{biz: string; nickname: string; articleTitle: string} | null>(null);
  
  const [activeTab, setActiveTab] = useState<'collect' | 'accounts' | 'library' | 'subscriptions'>(mode === 'account' ? 'accounts' : 'collect');
  const [subscriptions, setSubscriptions] = useState<Array<{
    id: number;
    biz: string;
    name: string;
    alias: string | null;
    avatar: string | null;
    description: string | null;
    lastArticleTime: string | null;
    totalArticles: number;
    monitorEnabled: boolean;
    monitorInterval: number;
    lastMonitorAt: string | null;
    status: string;
  }>>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [monitorRunning, setMonitorRunning] = useState(false);
  const [wechatAuthKey, setWechatAuthKey] = useState<string | null>(null);
  const [wechatLoggedIn, setWechatLoggedIn] = useState(false);
  const [wechatQrCode, setWechatQrCode] = useState<string | null>(null);
  const [wechatUuid, setWechatUuid] = useState<string | null>(null);
  const [wechatScanStatus, setWechatScanStatus] = useState<'waiting' | 'scanned' | 'confirmed' | 'expired' | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    fakeid: string;
    nickname: string;
    alias: string;
    round_head_img: string;
    service_type: number;
  }>>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{
    fakeid: string;
    nickname: string;
    round_head_img: string;
  } | null>(null);
  const [accountArticles, setAccountArticles] = useState<Array<{
    aid: string;
    title: string;
    link: string;
    cover: string;
    create_time: number;
    author_name?: string;
    copyright_stat?: number;
    copyright_type?: number;
    is_deleted?: boolean;
  }>>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articlesPage, setArticlesPage] = useState(0);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [drafts, setDrafts] = useState<Array<{
    id: number;
    mediaId: string;
    title: string;
    author: string | null;
    digest: string | null;
    coverImage: string | null;
    status: string;
    createTime: string | null;
    updateTime: string | null;
    note: string | null;
  }>>([]);
  const [draftStats, setDraftStats] = useState<{total: number; published: number; draft: number}>({total: 0, published: 0, draft: 0});
  const [selectedDrafts, setSelectedDrafts] = useState<Set<number>>(new Set());
  const [syncingDrafts, setSyncingDrafts] = useState(false);
  const [deletingDrafts, setDeletingDrafts] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieInput, setCookieInput] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [authPolling, setAuthPolling] = useState(false);
  const [authMode, setAuthMode] = useState<'qrcode' | 'cookie'>('qrcode');
  const [articleUrlInput, setArticleUrlInput] = useState('');
  const [collectingArticle, setCollectingArticle] = useState(false);
  
  const [downloadFormat, setDownloadFormat] = useState<'html' | 'markdown' | 'text' | 'json'>('html');
  const [downloadingArticle, setDownloadingArticle] = useState<string | null>(null);
  const [albumInfo, setAlbumInfo] = useState<{
    albumId: string;
    title: string;
    articleCount: number;
    articles: Array<{ title: string; url: string; cover: string }>;
  } | null>(null);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [albumInput, setAlbumInput] = useState('');
  const [wxdownConfig, setWxdownConfig] = useState<{
    enabled: boolean;
    websocketUrl: string;
    proxyUrl: string;
  }>({ enabled: false, websocketUrl: 'ws://127.0.0.1:65001', proxyUrl: 'http://127.0.0.1:65000' });
  const [showWxdownSettings, setShowWxdownSettings] = useState(false);
  const [articleComments, setArticleComments] = useState<Array<{
    id: string;
    content: string;
    author: string;
    avatar: string;
    likeCount: number;
    replies?: Array<{ content: string; author: string }>;
  }>>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showCommentsArticle, setShowCommentsArticle] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'docx'>('xlsx');
  const [exportingArticles, setExportingArticles] = useState(false);
  
  const [articleFilter, setArticleFilter] = useState<{
    keyword: string;
    author: string;
    dateFrom: string;
    dateTo: string;
    isOriginal: 'all' | 'original' | 'reprint';
    showDeleted: boolean;
  }>({
    keyword: '',
    author: '',
    dateFrom: '',
    dateTo: '',
    isOriginal: 'all',
    showDeleted: true,
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  const [collectingStyle, setCollectingStyle] = useState<string | null>(null);
  const [styleAnalysisResult, setStyleAnalysisResult] = useState<{
    articleTitle: string;
    analysis: any;
    suggestedName: string;
    suggestedDescription: string;
    styleConfig: any;
  } | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [customStyleName, setCustomStyleName] = useState('');

  const collectArticleStyle = async (articleLink: string, articleTitle: string) => {
    setCollectingStyle(articleLink);
    try {
      const res = await fetch('/api/wechat-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-content', url: articleLink }),
      });
      const data = await res.json();
      
      if (!data.content) {
        alert('无法获取文章内容，请稍后重试');
        setCollectingStyle(null);
        return;
      }
      
      const analysisRes = await fetch('/api/style-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          title: articleTitle,
          content: data.content,
        }),
      });
      const analysisData = await analysisRes.json();
      
      if (analysisData.success) {
        setStyleAnalysisResult({
          articleTitle,
          analysis: analysisData.analysis,
          suggestedName: analysisData.suggestedName,
          suggestedDescription: analysisData.suggestedDescription,
          styleConfig: analysisData.styleConfig,
        });
        setCustomStyleName(analysisData.suggestedName);
        setShowStyleModal(true);
      } else {
        alert('风格分析失败：' + (analysisData.error || '未知错误'));
      }
    } catch (error) {
      console.error('Style collection error:', error);
      alert('风格采集失败，请稍后重试');
    } finally {
      setCollectingStyle(null);
    }
  };

  const saveStyleToDb = async () => {
    if (!styleAnalysisResult) return;
    
    try {
      const res = await fetch('/api/style-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          title: styleAnalysisResult.articleTitle,
          content: '',
          styleName: customStyleName,
          saveToDb: true,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        alert('风格已保存：' + customStyleName);
        setShowStyleModal(false);
        setStyleAnalysisResult(null);
      } else {
        alert('保存失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Save style error:', error);
      alert('保存风格失败');
    }
  };

  const filterArticles = (articles: typeof accountArticles) => {
    return articles.filter(article => {
      if (articleFilter.keyword && !article.title.toLowerCase().includes(articleFilter.keyword.toLowerCase())) {
        return false;
      }
      if (articleFilter.author && article.author_name && !article.author_name.toLowerCase().includes(articleFilter.author.toLowerCase())) {
        return false;
      }
      if (articleFilter.dateFrom) {
        const fromDate = new Date(articleFilter.dateFrom).getTime() / 1000;
        if (article.create_time < fromDate) return false;
      }
      if (articleFilter.dateTo) {
        const toDate = new Date(articleFilter.dateTo).getTime() / 1000 + 86400;
        if (article.create_time > toDate) return false;
      }
      if (articleFilter.isOriginal === 'original' && !(article.copyright_stat === 1 && article.copyright_type === 1)) {
        return false;
      }
      if (articleFilter.isOriginal === 'reprint' && article.copyright_stat === 1 && article.copyright_type === 1) {
        return false;
      }
      if (!articleFilter.showDeleted && article.is_deleted) {
        return false;
      }
      return true;
    });
  };

  const clearFilter = () => {
    setArticleFilter({
      keyword: '',
      author: '',
      dateFrom: '',
      dateTo: '',
      isOriginal: 'all',
      showDeleted: true,
    });
  };

  const loadSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const res = await fetch('/api/subscriptions?action=list');
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const addSubscription = async (account: { fakeid: string; nickname: string; round_head_img: string }) => {
    try {
      const res = await fetch('/api/subscriptions?action=add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biz: account.fakeid,
          name: account.nickname,
          avatar: account.round_head_img,
          monitorEnabled: true,
          monitorInterval: 300,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubscriptions();
        return true;
      } else {
        alert(data.error || '添加订阅失败');
        return false;
      }
    } catch (error) {
      alert('添加订阅失败');
      return false;
    }
  };

  const toggleSubscription = async (id: number, enabled: boolean) => {
    try {
      const res = await fetch('/api/subscriptions?action=update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, monitorEnabled: enabled }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubscriptions();
      }
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
    }
  };

  const deleteSubscription = async (id: number) => {
    if (!confirm('确定要删除此订阅吗？')) return;
    try {
      const res = await fetch(`/api/subscriptions?action=delete&id=${id}`);
      const data = await res.json();
      if (data.success) {
        loadSubscriptions();
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    }
  };

  const runMonitor = async () => {
    if (!wechatAuthKey) {
      alert('请先登录微信');
      return;
    }
    setMonitorRunning(true);
    try {
      const res = await fetch(`/api/subscriptions?action=run&auth_key=${wechatAuthKey}`);
      const data = await res.json();
      if (data.success) {
        alert(`监控完成！处理了 ${data.results?.length || 0} 个订阅`);
        loadSubscriptions();
      } else {
        alert(data.error || '监控失败');
      }
    } catch (error) {
      alert('监控失败');
    } finally {
      setMonitorRunning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      loadSubscriptions();
    }
  }, [activeTab]);

  const filteredArticles = filterArticles(accountArticles);

  const exportArticle = async (url: string, title: string) => {
    setExportingArticles(true);
    try {
      const res = await fetch(`/api/article-export?action=export&url=${encodeURIComponent(url)}&format=${exportFormat}`);
      if (!res.ok) {
        throw new Error('导出失败');
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${title || 'article'}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert('导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setExportingArticles(false);
    }
  };

  const exportMultipleArticles = async (articles: Array<{ link: string; title: string }>) => {
    setExportingArticles(true);
    try {
      const res = await fetch('/api/article-export?action=export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: articles.map(a => ({ url: a.link, title: a.title })),
          format: exportFormat,
        }),
      });
      if (!res.ok) {
        throw new Error('导出失败');
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `articles.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert('导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setExportingArticles(false);
    }
  };

  const downloadArticle = async (url: string, title: string) => {
    setDownloadingArticle(url);
    try {
      const res = await fetch(`/api/article-download?action=download&url=${encodeURIComponent(url)}&format=${downloadFormat}`);
      if (!res.ok) {
        throw new Error('下载失败');
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const ext = downloadFormat === 'markdown' ? 'md' : downloadFormat;
      a.download = `${title || 'article'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert('下载失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setDownloadingArticle(null);
    }
  };

  const fetchAlbum = async () => {
    if (!albumInput.trim()) {
      alert('请输入合集链接或ID');
      return;
    }
    setLoadingAlbum(true);
    try {
      let albumId = albumInput;
      const urlMatch = albumInput.match(/album_id=(\w+)/);
      if (urlMatch) {
        albumId = urlMatch[1];
      }
      const res = await fetch(`/api/album?action=get&album_id=${albumId}&authKey=${wechatAuthKey || ''}`);
      const data = await res.json();
      if (data.success && data.album) {
        setAlbumInfo(data.album);
      } else {
        alert('获取合集失败: ' + (data.base_resp?.err_msg || '未知错误'));
      }
    } catch (error) {
      alert('获取合集失败');
    } finally {
      setLoadingAlbum(false);
    }
  };

  const loadComments = async (url: string, biz?: string) => {
    setLoadingComments(true);
    try {
      const params = new URLSearchParams({ action: 'get', url });
      if (biz) params.append('biz', biz);
      const res = await fetch(`/api/comment?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setArticleComments(data.comments);
      } else {
        setArticleComments([]);
        if (data.message) {
          // 评论获取提示
        }
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      setArticleComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadWxdownConfig = async () => {
    try {
      const res = await fetch('/api/comment?action=config');
      const data = await res.json();
      if (data.success && data.config) {
        setWxdownConfig(data.config);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const saveWxdownConfig = async () => {
    try {
      const res = await fetch('/api/comment?action=config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wxdownConfig),
      });
      const data = await res.json();
      if (data.success) {
        alert('配置保存成功');
        setShowWxdownSettings(false);
      } else {
        alert('配置保存失败');
      }
    } catch (error) {
      alert('配置保存失败');
    }
  };

  const collectArticleByUrl = async () => {
    if (!articleUrlInput.trim()) {
      alert('请输入文章链接');
      return;
    }
    
    setCollectingArticle(true);
    try {
      const res = await fetch('/api/wechat-collect?action=collect-article-by-url&url=' + encodeURIComponent(articleUrlInput));
      const data = await res.json();
      
      if (data.error) {
        alert('采集失败: ' + data.error);
      } else {
        alert('文章采集成功: ' + data.title);
        setArticleUrlInput('');
        loadArticles();
      }
    } catch (error) {
      alert('采集失败，请检查链接是否正确');
    } finally {
      setCollectingArticle(false);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/wechat-collect?action=check-auth');
      if (!res.ok) {
        console.error('Check auth failed:', res.status);
        setAuthorized(false);
        return;
      }
      const data = await res.json();
      setAuthorized(data.authorized);
    } catch (error) {
      console.error('Failed to check auth:', error);
      setAuthorized(false);
    }
  };

  const loadArticles = async (subscriptionId?: number) => {
    try {
      const url = subscriptionId 
        ? `/api/wechat-collect?action=list-articles&subscriptionId=${subscriptionId}`
        : '/api/wechat-collect?action=list-articles';
      const res = await fetch(url);
      const data = await res.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const loadDrafts = async () => {
    try {
      const res = await fetch('/api/wechat-drafts?action=list');
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  };

  const loadDraftStats = async () => {
    try {
      const res = await fetch('/api/wechat-drafts?action=stats');
      const data = await res.json();
      setDraftStats(data);
    } catch (error) {
      console.error('Failed to load draft stats:', error);
    }
  };

  const checkWechatLogin = async () => {
    if (!wechatAuthKey) return;
    try {
      const res = await fetch(`/api/wechat?action=status&authKey=${wechatAuthKey}`);
      const data = await res.json();
      setWechatLoggedIn(data.loggedIn);
    } catch {
      setWechatLoggedIn(false);
    }
  };

  const getWechatQrCode = async () => {
    try {
      const res = await fetch('/api/wechat?action=getqrcode');
      const data = await res.json();
      if (data.success) {
        setWechatQrCode(data.qrcode);
        setWechatUuid(data.uuid);
        setWechatScanStatus('waiting');
        pollScanStatus(data.uuid, data.setCookie);
      }
    } catch (error) {
      console.error('Failed to get QR code:', error);
    }
  };

  const pollScanStatus = async (uuid: string, setCookie: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/wechat?action=scan&uuid=${uuid}&cookie=${encodeURIComponent(setCookie)}`);
        const data = await res.json();
        
        if (data.status === 4) {
          setWechatScanStatus('scanned');
          setTimeout(poll, 1000);
        } else if (data.status === 2) {
          setWechatScanStatus('confirmed');
          const loginRes = await fetch(`/api/wechat?action=login&uuid=${uuid}&cookie=${encodeURIComponent(setCookie)}`);
          const loginData = await loginRes.json();
          if (loginData.success && loginData.authKey) {
            setWechatAuthKey(loginData.authKey);
            setWechatLoggedIn(true);
          }
        } else if (data.status === 0) {
          setWechatScanStatus('expired');
        } else {
          setTimeout(poll, 1000);
        }
      } catch {
        setTimeout(poll, 2000);
      }
    };
    poll();
  };

  const searchWechatAccounts = async () => {
    if (!searchKeyword.trim() || !wechatAuthKey) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/wechat?action=search&authKey=${wechatAuthKey}&keyword=${encodeURIComponent(searchKeyword)}`);
      const data = await res.json();
      if (data.base_resp && data.base_resp.ret === 0) {
        setSearchResults(data.list || []);
      } else {
        alert('搜索失败: ' + (data.base_resp?.err_msg || '未知错误'));
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const loadAccountArticles = async (fakeid: string, page: number = 0) => {
    if (!wechatAuthKey) return;
    setLoadingArticles(true);
    try {
      const res = await fetch(`/api/wechat?action=articles&authKey=${wechatAuthKey}&fakeid=${fakeid}&begin=${page * 5}&count=5`);
      const data = await res.json();
      if (data.success) {
        setAccountArticles(data.articles || []);
        setArticlesTotal(data.total || 0);
        setArticlesPage(page);
      } else {
        alert('获取文章失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
      alert('获取文章失败');
    } finally {
      setLoadingArticles(false);
    }
  };

  const collectArticle = async (article: { title: string; link: string; cover: string }) => {
    try {
      const res = await fetch('/api/wechat-collect?action=collect-article-by-url&url=' + encodeURIComponent(article.link));
      const data = await res.json();
      if (data.error) {
        alert('采集失败: ' + data.error);
      } else {
        alert('文章采集成功: ' + article.title);
        loadArticles();
      }
    } catch {
      alert('采集失败');
    }
  };

  useEffect(() => {
    checkAuth();
    loadSubscriptions();
    loadDrafts();
    loadDraftStats();
    loadWxdownConfig();
    if (wechatAuthKey) {
      checkWechatLogin();
    }
  }, []);

  useEffect(() => {
    if (selectedSubscription) {
      loadArticles(selectedSubscription);
    } else {
      loadArticles();
    }
  }, [selectedSubscription]);

  const syncDrafts = async () => {
    setSyncingDrafts(true);
    try {
      const res = await fetch('/api/wechat-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`同步完成，共获取 ${data.count} 篇草稿`);
        loadDrafts();
        loadDraftStats();
      } else {
        alert('同步失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to sync drafts:', error);
      alert('同步失败');
    } finally {
      setSyncingDrafts(false);
    }
  };

  const deleteSelectedDrafts = async () => {
    if (selectedDrafts.size === 0) {
      alert('请先选择要删除的草稿');
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedDrafts.size} 篇草稿吗？`)) return;
    
    setDeletingDrafts(true);
    try {
      const res = await fetch('/api/wechat-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'batch-delete', 
          ids: Array.from(selectedDrafts) 
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`成功删除 ${data.deleted} 篇草稿`);
        setSelectedDrafts(new Set());
        loadDrafts();
        loadDraftStats();
      } else {
        alert('删除失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to delete drafts:', error);
      alert('删除失败');
    } finally {
      setDeletingDrafts(false);
    }
  };

  const clearPublishedDrafts = async () => {
    if (draftStats.published === 0) {
      alert('没有已发布的草稿需要清理');
      return;
    }
    if (!confirm(`确定要清空所有已发布的草稿（共 ${draftStats.published} 篇）吗？`)) return;
    
    setDeletingDrafts(true);
    try {
      const res = await fetch('/api/wechat-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-published' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`成功清理 ${data.deleted} 篇已发布草稿`);
        loadDrafts();
        loadDraftStats();
      } else {
        alert('清理失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to clear published drafts:', error);
      alert('清理失败');
    } finally {
      setDeletingDrafts(false);
    }
  };

  const clearAllDrafts = async () => {
    if (draftStats.total === 0) {
      alert('草稿箱为空');
      return;
    }
    if (!confirm(`确定要清空所有草稿（共 ${draftStats.total} 篇）吗？此操作不可恢复！`)) return;
    if (!confirm('再次确认：这将删除所有草稿，是否继续？')) return;
    
    setDeletingDrafts(true);
    try {
      const res = await fetch('/api/wechat-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-all' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`成功清空 ${data.deleted} 篇草稿`);
        setSelectedDrafts(new Set());
        loadDrafts();
        loadDraftStats();
      } else {
        alert('清空失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to clear all drafts:', error);
      alert('清空失败');
    } finally {
      setDeletingDrafts(false);
    }
  };

  const toggleDraftSelection = (id: number) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDrafts(newSelected);
  };

  const toggleAllDrafts = () => {
    if (selectedDrafts.size === drafts.length) {
      setSelectedDrafts(new Set());
    } else {
      setSelectedDrafts(new Set(drafts.map(d => d.id)));
    }
  };

  const startAuth = async () => {
    setAuthMode('qrcode');
    setQrCodeUrl(null);
    setShowCookieModal(true);
    
    try {
      const res = await fetch('/api/wechat-collect?action=start-qrcode-auth');
      const data = await res.json();
      
      if (data.success) {
        setQrCodeUrl(data.qrcodeUrl);
        pollAuthStatus();
      } else if (data.error?.includes('授权流程正在运行')) {
        const clearRes = await fetch('/api/wechat-collect?action=clear-lock');
        const clearData = await clearRes.json();
        if (clearData.success) {
          const retryRes = await fetch('/api/wechat-collect?action=start-qrcode-auth');
          const retryData = await retryRes.json();
          if (retryData.success) {
            setQrCodeUrl(retryData.qrcodeUrl);
            pollAuthStatus();
          } else {
            alert('启动授权失败：' + (retryData.error || '未知错误'));
          }
        } else {
          alert('清理锁失败，请刷新页面重试');
        }
      } else {
        alert('启动授权失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to start auth:', error);
      alert('启动授权失败，请重试');
    }
  };

  const pollAuthStatus = async () => {
    setAuthPolling(true);
    let attempts = 0;
    const maxAttempts = 60;
    
    const poll = async () => {
      try {
        const res = await fetch('/api/wechat-collect?action=check-auth');
        const data = await res.json();
        
        if (data.authorized) {
          setAuthorized(true);
          setShowCookieModal(false);
          setQrCodeUrl(null);
          setAuthPolling(false);
          alert('授权成功！');
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setAuthPolling(false);
          alert('授权超时，请重新扫码');
        }
      } catch (error) {
        console.error('Poll auth status failed:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setAuthPolling(false);
        }
      }
    };
    
    poll();
  };

  const refreshQRCode = async () => {
    setQrCodeUrl(null);
    try {
      const res = await fetch('/api/wechat-collect?action=start-qrcode-auth');
      const data = await res.json();
      
      if (data.success) {
        setQrCodeUrl(data.qrcodeUrl);
      } else {
        alert('刷新二维码失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to refresh QR code:', error);
      alert('刷新二维码失败');
    }
  };

  const submitCookie = async () => {
    if (!cookieInput.trim()) {
      alert('请输入微信Cookie');
      return;
    }
    
    setAuthLoading(true);
    try {
      const res = await fetch('/api/wechat-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'complete-auth', 
          cookie: cookieInput.trim() 
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('授权成功！');
        setAuthorized(true);
        setShowCookieModal(false);
        setCookieInput('');
      } else {
        alert('授权失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to start auth:', error);
      alert('授权失败，请重试');
    } finally {
      setAuthLoading(false);
    }
  };

  const parseArticleUrl = async () => {
    if (!newSubscriptionUrl.trim()) {
      alert('请输入文章链接');
      return;
    }
    
    setParsingUrl(true);
    setParsedInfo(null);
    try {
      const res = await fetch(`/api/wechat-collect?action=get-article-info&url=${encodeURIComponent(newSubscriptionUrl.trim())}`);
      const data = await res.json();
      if (data.success) {
        setParsedInfo({
          biz: data.biz,
          nickname: data.nickname,
          articleTitle: data.articleTitle || '',
        });
      } else {
        alert('解析失败：' + (data.error || '请确认链接是有效的微信公众号文章'));
      }
    } catch (error) {
      console.error('Failed to parse article URL:', error);
      alert('解析失败，请检查链接格式');
    } finally {
      setParsingUrl(false);
    }
  };

  const addSubscriptionFromUrl = async () => {
    if (!parsedInfo) {
      alert('请先解析文章链接');
      return;
    }
    
    try {
      const res = await fetch('/api/wechat-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-subscription',
          biz: parsedInfo.biz,
          name: parsedInfo.nickname,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`成功添加公众号：${parsedInfo.nickname}`);
        loadSubscriptions();
        setShowAddModal(false);
        setNewSubscriptionUrl('');
        setParsedInfo(null);
      } else {
        alert('添加失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to add subscription:', error);
      alert('添加失败，请重试');
    }
  };

  const startCollect = async (subscriptionId: number) => {
    if (!authorized) {
      alert('请先完成微信授权');
      return;
    }
    
    setCollecting(true);
    try {
      const res = await fetch('/api/wechat-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-collect',
          subscriptionId,
          type: 'incremental',
          count: 5,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`采集完成，共采集 ${data.collected} 篇文章`);
        loadSubscriptions();
        loadArticles(subscriptionId);
      } else {
        alert('采集失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to start collect:', error);
      alert('采集失败');
    } finally {
      setCollecting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {mode === 'account' ? '🔍 公众号采集' : '📚 文章采集'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {mode === 'account' ? '搜索公众号，批量采集文章，管理订阅' : '采集公众号文章，管理文章库'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {authorized && (
            <span style={{ padding: '6px 12px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✅ 已授权
            </span>
          )}
          <button
            onClick={startAuth}
            disabled={authLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: authLoading ? '#9ca3af' : authorized ? '#6b7280' : '#07c160',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: authLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {authLoading ? '授权中...' : authorized ? '🔄 重新授权' : '📱 配置授权'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {mode === 'collect' && (
          <>
            <button
              onClick={() => setActiveTab('collect')}
              style={{
                padding: '10px 24px',
                backgroundColor: activeTab === 'collect' ? '#10b981' : '#fff',
                color: activeTab === 'collect' ? '#fff' : '#374151',
                border: `1px solid ${activeTab === 'collect' ? '#10b981' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              📥 文章采集
            </button>
            <button
              onClick={() => setActiveTab('library')}
              style={{
                padding: '10px 24px',
                backgroundColor: activeTab === 'library' ? '#f59e0b' : '#fff',
                color: activeTab === 'library' ? '#fff' : '#374151',
                border: `1px solid ${activeTab === 'library' ? '#f59e0b' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              📚 文章库 ({articles.length})
            </button>
          </>
        )}
        {mode === 'account' && (
          <>
            <button
              onClick={() => setActiveTab('accounts')}
              style={{
                padding: '10px 24px',
                backgroundColor: activeTab === 'accounts' ? '#8b5cf6' : '#fff',
                color: activeTab === 'accounts' ? '#fff' : '#374151',
                border: `1px solid ${activeTab === 'accounts' ? '#8b5cf6' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              🔍 公众号采集
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              style={{
                padding: '10px 24px',
                backgroundColor: activeTab === 'subscriptions' ? '#06b6d4' : '#fff',
                color: activeTab === 'subscriptions' ? '#fff' : '#374151',
                border: `1px solid ${activeTab === 'subscriptions' ? '#06b6d4' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              🔔 订阅管理 ({subscriptions.length})
            </button>
          </>
        )}
      </div>

      {activeTab === 'collect' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>📥 采集指定文章</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            粘贴微信公众号文章链接，直接采集文章内容
          </p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              value={articleUrlInput}
              onChange={(e) => setArticleUrlInput(e.target.value)}
              placeholder="粘贴微信公众号文章链接，如：https://mp.weixin.qq.com/s/xxxxx"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={collectArticleByUrl}
              disabled={collectingArticle || !articleUrlInput.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: collectingArticle || !articleUrlInput.trim() ? '#e5e7eb' : '#10b981',
                color: collectingArticle || !articleUrlInput.trim() ? '#9ca3af' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: collectingArticle || !articleUrlInput.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {collectingArticle ? '采集中...' : '开始采集'}
            </button>
          </div>
          
          {parsedInfo && (
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>✅ 文章信息预览</h4>
              <div style={{ fontSize: '13px', color: '#374151' }}>
                <p><strong>公众号：</strong>{parsedInfo.nickname}</p>
                <p><strong>文章标题：</strong>{parsedInfo.articleTitle}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'accounts' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {!wechatLoggedIn ? (
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '32px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>🔍 公众号采集</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                需要扫码登录微信公众号后台才能搜索和采集公众号文章
              </p>
              {wechatQrCode ? (
                <div>
                  <img src={wechatQrCode} alt="登录二维码" style={{ width: '200px', height: '200px', marginBottom: '16px' }} />
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {wechatScanStatus === 'waiting' && '请使用微信扫码登录'}
                    {wechatScanStatus === 'scanned' && '✅ 已扫码，请在手机上确认登录'}
                    {wechatScanStatus === 'confirmed' && '✅ 登录成功'}
                    {wechatScanStatus === 'expired' && '❌ 二维码已过期，请刷新'}
                  </div>
                  {wechatScanStatus === 'expired' && (
                    <button
                      onClick={getWechatQrCode}
                      style={{
                        marginTop: '16px',
                        padding: '10px 24px',
                        backgroundColor: '#8b5cf6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      刷新二维码
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={getWechatQrCode}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#07c160',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  📱 扫码登录
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>📥 下载格式</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(['html', 'markdown', 'text', 'json'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setDownloadFormat(fmt)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: downloadFormat === fmt ? '#f59e0b' : '#f3f4f6',
                          color: downloadFormat === fmt ? '#fff' : '#374151',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {fmt === 'markdown' ? 'MD' : fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>📊 导出格式</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(['xlsx', 'docx'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: exportFormat === fmt ? '#10b981' : '#f3f4f6',
                          color: exportFormat === fmt ? '#fff' : '#374151',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                    {accountArticles.length > 0 && (
                      <button
                        onClick={() => exportMultipleArticles(accountArticles)}
                        disabled={exportingArticles}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: exportingArticles ? '#e5e7eb' : '#E8652D',
                          color: exportingArticles ? '#9ca3af' : '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: exportingArticles ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {exportingArticles ? '导出中...' : `导出全部(${accountArticles.length})`}
                      </button>
                    )}
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>📚 合集下载</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={albumInput}
                      onChange={(e) => setAlbumInput(e.target.value)}
                      placeholder="输入合集链接或ID"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={fetchAlbum}
                      disabled={loadingAlbum || !albumInput.trim()}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: loadingAlbum || !albumInput.trim() ? '#e5e7eb' : '#10b981',
                        color: loadingAlbum || !albumInput.trim() ? '#9ca3af' : '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: loadingAlbum || !albumInput.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loadingAlbum ? '获取中...' : '获取'}
                    </button>
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>🔧 wxdown-service</span>
                    <button
                      onClick={() => setShowWxdownSettings(true)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      配置
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: wxdownConfig.enabled ? '#10b981' : '#9ca3af' 
                    }}></span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {wxdownConfig.enabled ? '已启用 (可获取阅读量/评论)' : '未启用'}
                    </span>
                  </div>
                </div>
              </div>
              
              {albumInfo && (
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{albumInfo.title}</h3>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>共 {albumInfo.articleCount} 篇文章</div>
                    </div>
                    <button
                      onClick={() => setAlbumInfo(null)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      关闭
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {albumInfo.articles.map((article, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                        {article.cover && (
                          <img src={article.cover} alt="" style={{ width: '60px', height: '45px', borderRadius: '4px', objectFit: 'cover' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {article.title}
                          </div>
                        </div>
                        <button
                          onClick={() => downloadArticle(article.url, article.title)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#f59e0b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          下载
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {showWxdownSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '400px', maxWidth: '90%' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>wxdown-service 配置</h3>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
                        <input
                          type="checkbox"
                          checked={wxdownConfig.enabled}
                          onChange={(e) => setWxdownConfig({ ...wxdownConfig, enabled: e.target.checked })}
                        />
                        启用 wxdown-service
                      </label>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>WebSocket 地址</label>
                      <input
                        type="text"
                        value={wxdownConfig.websocketUrl}
                        onChange={(e) => setWxdownConfig({ ...wxdownConfig, websocketUrl: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>代理地址</label>
                      <input
                        type="text"
                        value={wxdownConfig.proxyUrl}
                        onChange={(e) => setWxdownConfig({ ...wxdownConfig, proxyUrl: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', color: '#92400e' }}>
                      <strong>使用说明：</strong><br />
                      1. 下载并运行 wxdown-service (Python服务)<br />
                      2. 配置浏览器代理为上述地址<br />
                      3. 安装 mitmproxy 证书<br />
                      4. 通过代理访问微信文章获取阅读量/评论
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setShowWxdownSettings(false)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        取消
                      </button>
                      <button
                        onClick={saveWxdownConfig}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchWechatAccounts()}
                    placeholder="输入公众号名称搜索..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={searchWechatAccounts}
                    disabled={searching || !searchKeyword.trim()}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: searching || !searchKeyword.trim() ? '#e5e7eb' : '#8b5cf6',
                      color: searching || !searchKeyword.trim() ? '#9ca3af' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: searching || !searchKeyword.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {searching ? '搜索中...' : '搜索'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {searchResults.map((account) => (
                      <div
                        key={account.fakeid}
                        onClick={() => {
                          setSelectedAccount({
                            fakeid: account.fakeid,
                            nickname: account.nickname,
                            round_head_img: account.round_head_img,
                          });
                          loadAccountArticles(account.fakeid, 0);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: selectedAccount?.fakeid === account.fakeid ? '#f5f3ff' : '#f9fafb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: `1px solid ${selectedAccount?.fakeid === account.fakeid ? '#8b5cf6' : '#e5e7eb'}`,
                        }}
                      >
                        <img
                          src={account.round_head_img}
                          alt={account.nickname}
                          style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                        />
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937' }}>{account.nickname}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{account.alias || '微信号：未设置'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAccount && (
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <img
                      src={selectedAccount.round_head_img}
                      alt={selectedAccount.nickname}
                      style={{ width: '48px', height: '48px', borderRadius: '12px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{selectedAccount.nickname}</h3>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>共 {articlesTotal} 篇文章</div>
                    </div>
                    <button
                      onClick={() => addSubscription({
                        fakeid: selectedAccount.fakeid,
                        nickname: selectedAccount.nickname,
                        round_head_img: selectedAccount.round_head_img,
                      })}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#06b6d4',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      🔔 添加订阅
                    </button>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          onClick={() => setShowFilterPanel(!showFilterPanel)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: showFilterPanel ? '#f59e0b' : '#f3f4f6',
                            color: showFilterPanel ? '#fff' : '#374151',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          🔍 过滤 {filteredArticles.length !== accountArticles.length ? `(${filteredArticles.length}/${accountArticles.length})` : ''}
                        </button>
                        {(articleFilter.keyword || articleFilter.author || articleFilter.dateFrom || articleFilter.dateTo || articleFilter.isOriginal !== 'all' || !articleFilter.showDeleted) && (
                          <button
                            onClick={clearFilter}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            清除过滤
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        显示 {filteredArticles.length} / {accountArticles.length} 篇
                      </div>
                    </div>
                    
                    {showFilterPanel && (
                      <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>标题关键词</label>
                            <input
                              type="text"
                              value={articleFilter.keyword}
                              onChange={(e) => setArticleFilter({ ...articleFilter, keyword: e.target.value })}
                              placeholder="搜索标题..."
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                outline: 'none',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>作者</label>
                            <input
                              type="text"
                              value={articleFilter.author}
                              onChange={(e) => setArticleFilter({ ...articleFilter, author: e.target.value })}
                              placeholder="搜索作者..."
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                outline: 'none',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>开始日期</label>
                            <input
                              type="date"
                              value={articleFilter.dateFrom}
                              onChange={(e) => setArticleFilter({ ...articleFilter, dateFrom: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                outline: 'none',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>结束日期</label>
                            <input
                              type="date"
                              value={articleFilter.dateTo}
                              onChange={(e) => setArticleFilter({ ...articleFilter, dateTo: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                outline: 'none',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>原创类型</label>
                            <select
                              value={articleFilter.isOriginal}
                              onChange={(e) => setArticleFilter({ ...articleFilter, isOriginal: e.target.value as 'all' | 'original' | 'reprint' })}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                outline: 'none',
                                backgroundColor: '#fff',
                              }}
                            >
                              <option value="all">全部</option>
                              <option value="original">仅原创</option>
                              <option value="reprint">仅转载</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={articleFilter.showDeleted}
                                onChange={(e) => setArticleFilter({ ...articleFilter, showDeleted: e.target.checked })}
                                style={{ width: '16px', height: '16px' }}
                              />
                              显示已删除文章
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {loadingArticles ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>加载中...</div>
                  ) : filteredArticles.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {filteredArticles.map((article) => (
                        <div
                          key={article.aid}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          {article.cover && (
                            <img
                              src={article.cover}
                              alt={article.title}
                              style={{ width: '80px', height: '60px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', marginBottom: '8px' }}>
                              {article.title}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                {new Date(article.create_time * 1000).toLocaleDateString('zh-CN')}
                              </span>
                              <button
                                onClick={() => collectArticle(article)}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: '#10b981',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                采集
                              </button>
                              <button
                                onClick={() => collectArticleStyle(article.link, article.title)}
                                disabled={collectingStyle === article.link}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: collectingStyle === article.link ? '#e5e7eb' : '#ec4899',
                                  color: collectingStyle === article.link ? '#9ca3af' : '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: collectingStyle === article.link ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {collectingStyle === article.link ? '采集中...' : '🎨 采集风格'}
                              </button>
                              <button
                                onClick={() => downloadArticle(article.link, article.title)}
                                disabled={downloadingArticle === article.link}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: downloadingArticle === article.link ? '#e5e7eb' : '#f59e0b',
                                  color: downloadingArticle === article.link ? '#9ca3af' : '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: downloadingArticle === article.link ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {downloadingArticle === article.link ? '下载中...' : '下载'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowCommentsArticle(showCommentsArticle === article.link ? null : article.link);
                                  if (showCommentsArticle !== article.link) {
                                    loadComments(article.link);
                                  }
                                }}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: showCommentsArticle === article.link ? '#8b5cf6' : '#f3f4f6',
                                  color: showCommentsArticle === article.link ? '#fff' : '#374151',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                💬 评论
                              </button>
                              <button
                                onClick={() => exportArticle(article.link, article.title)}
                                disabled={exportingArticles}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: exportingArticles ? '#e5e7eb' : '#8b5cf6',
                                  color: exportingArticles ? '#9ca3af' : '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: exportingArticles ? 'not-allowed' : 'pointer',
                                }}
                              >
                                📊 导出
                              </button>
                              <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: '#E8652D',
                                  color: '#fff',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  textDecoration: 'none',
                                }}
                              >
                                查看
                              </a>
                            </div>
                            {showCommentsArticle === article.link && (
                              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                                  💬 文章评论 {wxdownConfig.enabled ? '' : '(需启用 wxdown-service)'}
                                </div>
                                {loadingComments ? (
                                  <div style={{ color: '#6b7280', fontSize: '12px' }}>加载中...</div>
                                ) : articleComments.length > 0 ? (
                                  <div style={{ display: 'grid', gap: '8px' }}>
                                    {articleComments.slice(0, 5).map((comment) => (
                                      <div key={comment.id} style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                          <img src={comment.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{comment.author}</span>
                                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>👍 {comment.likeCount}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#4b5563' }}>{comment.content}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                                    {wxdownConfig.enabled ? '暂无评论' : '请先启动 wxdown-service 并配置'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {articlesTotal > 5 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                          <button
                            onClick={() => loadAccountArticles(selectedAccount.fakeid, articlesPage - 1)}
                            disabled={articlesPage === 0}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: articlesPage === 0 ? '#e5e7eb' : '#f3f4f6',
                              color: articlesPage === 0 ? '#9ca3af' : '#374151',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: articlesPage === 0 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            上一页
                          </button>
                          <span style={{ padding: '8px 16px', color: '#6b7280' }}>
                            第 {articlesPage + 1} 页
                          </span>
                          <button
                            onClick={() => loadAccountArticles(selectedAccount.fakeid, articlesPage + 1)}
                            disabled={(articlesPage + 1) * 5 >= articlesTotal}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: (articlesPage + 1) * 5 >= articlesTotal ? '#e5e7eb' : '#f3f4f6',
                              color: (articlesPage + 1) * 5 >= articlesTotal ? '#9ca3af' : '#374151',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: (articlesPage + 1) * 5 >= articlesTotal ? 'not-allowed' : 'pointer',
                            }}
                          >
                            下一页
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>暂无文章</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                暂无采集的文章，请在"文章采集"标签页中输入文章链接进行采集
              </div>
            </div>
          ) : (
            articles.map((article) => (
              <div 
                key={article.id} 
                style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  border: '1px solid #e5e7eb', 
                  padding: '16px',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px', 
                    backgroundColor: '#fef3c7',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}>
                    📄
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', lineHeight: '1.4' }}>
                        {article.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                      {article.author && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>✍️</span> {article.author}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📅</span> {formatDate(article.publishTime)}
                      </span>
                      {article.readCount && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>👁️</span> {formatNumber(article.readCount)}
                        </span>
                      )}
                      {article.likeCount && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>👍</span> {formatNumber(article.likeCount)}
                        </span>
                      )}
                    </div>
                    {article.digest && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#6b7280', 
                        marginBottom: '12px',
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        lineHeight: '1.5',
                      }}>
                        {article.digest}
                      </div>
                    )}
                    {expandedArticle === article.id && (article.contentHtml || article.content) && (
                      <div style={{ 
                        marginBottom: '12px',
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>正文内容</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{article.content ? `${article.content.length} 字` : '暂无'}</span>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          lineHeight: '1.8',
                          color: '#374151',
                          maxHeight: '500px',
                          overflowY: 'auto',
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}>
                          {article.contentHtml ? (
                            <div 
                              style={{ 
                                padding: '16px',
                              }}
                              dangerouslySetInnerHTML={{ __html: safeSanitizeHtml(article.contentHtml) }}
                              className="wechat-article-content"
                            />
                          ) : (
                            <div style={{ 
                              padding: '16px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}>
                              {article.content}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: expandedArticle === article.id ? '#E8652D' : '#f3f4f6',
                          color: expandedArticle === article.id ? '#fff' : '#374151',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {expandedArticle === article.id ? '📖 收起正文' : '📖 查看正文'}
                      </button>
                      <button
                        onClick={async () => {
                          setCopyingField({ articleId: article.id, field: 'title' });
                          try {
                            await navigator.clipboard.writeText(article.title);
                            alert('标题已复制');
                          } catch (err) {
                            alert('复制失败');
                          }
                          setTimeout(() => setCopyingField(null), 1000);
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: copyingField?.articleId === article.id && copyingField.field === 'title' ? '#10b981' : '#fff',
                          color: copyingField?.articleId === article.id && copyingField.field === 'title' ? '#fff' : '#374151',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {copyingField?.articleId === article.id && copyingField.field === 'title' ? '✅ 已复制' : '📋 复制标题'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!article.content) {
                            alert('暂无正文');
                            return;
                          }
                          setCopyingField({ articleId: article.id, field: 'content' });
                          try {
                            await navigator.clipboard.writeText(article.content);
                            alert('正文已复制');
                          } catch (err) {
                            alert('复制失败');
                          }
                          setTimeout(() => setCopyingField(null), 1000);
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: copyingField?.articleId === article.id && copyingField.field === 'content' ? '#10b981' : '#E8652D',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {copyingField?.articleId === article.id && copyingField.field === 'content' ? '✅ 已复制' : '📝 复制正文'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!article.content) {
                            alert('暂无正文内容，无法复刻改写');
                            return;
                          }
                          try {
                            const res = await fetch('/api/rewrite', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                content: article.content,
                                title: article.title,
                                style: '专业正式'
                              }),
                            });
                            const data = await res.json();
                            if (data.success && data.result) {
                              await navigator.clipboard.writeText(data.result);
                              alert('复刻改写完成，已复制到剪贴板！');
                            } else {
                              alert('复刻改写失败: ' + (data.error || '未知错误'));
                            }
                          } catch (err) {
                            alert('复刻改写失败，请检查网络连接');
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        ✨ 复刻改写
                      </button>
                      <button
                        onClick={() => {
                          const articleData = {
                            id: article.id,
                            title: article.title,
                            content: article.content || '',
                            contentHtml: article.contentHtml || '',
                          };
                          setEditingArticle(articleData);
                          const md = htmlToMarkdown(article.contentHtml || article.content || '');
                          setMarkdownContent(md);
                          setEditMode('markdown');
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#8b5cf6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ 编辑正文
                      </button>
                      <button
                        onClick={() => setEditingArticleData({
                          id: article.id,
                          title: article.title,
                          readCount: article.readCount || 0,
                          likeCount: article.likeCount || 0,
                          commentCount: article.commentCount || 0,
                          recommendCount: article.recommendCount || 0,
                          shareCount: article.shareCount || 0,
                          publishTime: article.publishTime ? new Date(article.publishTime).toISOString().slice(0, 16) : '',
                        })}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#06b6d4',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        📊 编辑数据
                      </button>
                      {article.sourceUrl && (
                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            backgroundColor: '#f3f4f6',
                            color: '#E8652D',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          🔗 原文
                        </a>
                      )}
                      <button
                        onClick={() => setDeletingArticleId(article.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>🔔 订阅管理</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={runMonitor}
                  disabled={monitorRunning || !wechatLoggedIn || subscriptions.filter(s => s.monitorEnabled).length === 0}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: monitorRunning || !wechatLoggedIn || subscriptions.filter(s => s.monitorEnabled).length === 0 ? '#e5e7eb' : '#06b6d4',
                    color: monitorRunning || !wechatLoggedIn || subscriptions.filter(s => s.monitorEnabled).length === 0 ? '#9ca3af' : '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: monitorRunning || !wechatLoggedIn || subscriptions.filter(s => s.monitorEnabled).length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {monitorRunning ? '监控中...' : '▶️ 运行监控'}
                </button>
              </div>
            </div>
            
            {!wechatLoggedIn && (
              <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: '#92400e' }}>⚠️ 请先在"公众号采集"标签页登录微信，才能运行监控</p>
              </div>
            )}

            {loadingSubscriptions ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>加载中...</div>
            ) : subscriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p>暂无订阅，请在"公众号采集"标签页搜索公众号后添加订阅</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {subscriptions.map(sub => (
                  <div key={sub.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '16px', 
                    backgroundColor: sub.monitorEnabled ? '#f0fdf4' : '#f9fafb', 
                    borderRadius: '10px', 
                    border: `1px solid ${sub.monitorEnabled ? '#86efac' : '#e5e7eb'}` 
                  }}>
                    {sub.avatar && (
                      <img src={sub.avatar} alt={sub.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{sub.name}</span>
                        <span style={{ 
                          padding: '2px 8px', 
                          backgroundColor: sub.monitorEnabled ? '#dcfce7' : '#fee2e2', 
                          color: sub.monitorEnabled ? '#166534' : '#991b1b', 
                          borderRadius: '4px', 
                          fontSize: '12px' 
                        }}>
                          {sub.monitorEnabled ? '监控中' : '已暂停'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>📄 文章: {sub.totalArticles || 0}</span>
                        <span>⏱️ 间隔: {sub.monitorInterval || 300}秒</span>
                        {sub.lastMonitorAt && (
                          <span>🕐 上次监控: {new Date(sub.lastMonitorAt).toLocaleString('zh-CN')}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleSubscription(sub.id, !sub.monitorEnabled)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: sub.monitorEnabled ? '#fef3c7' : '#dcfce7',
                          color: sub.monitorEnabled ? '#92400e' : '#166534',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {sub.monitorEnabled ? '⏸️ 暂停' : '▶️ 启用'}
                      </button>
                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {deletingArticleId && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            width: '400px', 
            maxWidth: '90vw', 
            padding: '24px' 
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#dc2626' }}>
              ⚠️ 确认删除
            </h3>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '24px' }}>
              确定要删除这篇文章吗？此操作不可撤销。
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeletingArticleId(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/wechat-collect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'delete-article', id: deletingArticleId }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setArticles(articles.filter(a => a.id !== deletingArticleId));
                      setDeletingArticleId(null);
                    } else {
                      alert('删除失败: ' + data.error);
                    }
                  } catch (err) {
                    alert('删除失败');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {editingArticle && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: isFullscreenEdit ? '0' : '12px', 
            width: isFullscreenEdit ? '100vw' : '1100px',
            maxWidth: '100vw',
            height: isFullscreenEdit ? '100vh' : 'auto',
            maxHeight: isFullscreenEdit ? '100vh' : '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                ✏️ 编辑正文内容
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  HTML内容: {editingArticle.contentHtml.length} 字符
                </span>
                <button
                  onClick={() => setIsFullscreenEdit(!isFullscreenEdit)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: isFullscreenEdit ? '#E8652D' : '#f3f4f6',
                    color: isFullscreenEdit ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {isFullscreenEdit ? '⬜ 退出全屏' : '⛶ 全屏编辑'}
                </button>
                <button
                  onClick={() => {
                    setEditingArticle(null);
                    setIsFullscreenEdit(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ✕ 关闭
                </button>
              </div>
            </div>
            
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>文章标题</div>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937' }}>{editingArticle.title}</div>
            </div>

            <div style={{ padding: '16px 24px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>编辑模式:</span>
                <button
                  onClick={() => setEditMode('markdown')}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: editMode === 'markdown' ? '#10b981' : '#f3f4f6',
                    color: editMode === 'markdown' ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  📝 可视化编辑
                </button>
                <button
                  onClick={() => setEditMode('html')}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: editMode === 'html' ? '#8b5cf6' : '#f3f4f6',
                    color: editMode === 'html' ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ HTML源码
                </button>
                <button
                  onClick={() => setEditMode('preview')}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: editMode === 'preview' ? '#f59e0b' : '#f3f4f6',
                    color: editMode === 'preview' ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  👁️ 预览效果
                </button>
                <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>
                  {editMode === 'markdown' ? '可视化编辑自动转换为Markdown格式' : 
                   editMode === 'html' ? '直接编辑HTML源码，适合高级用户' : 
                   '预览HTML渲染效果'}
                </span>
              </div>
              
              {editMode === 'markdown' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: isFullscreenEdit ? 'calc(100vh - 250px)' : '400px' }}>
                  <MarkdownEditor
                    value={markdownContent}
                    onChange={(newMd) => {
                      setMarkdownContent(newMd);
                      const newHtml = markdownToHtml(newMd);
                      setEditingArticle({ ...editingArticle, contentHtml: newHtml });
                    }}
                    height="100%"
                    placeholder="在此编辑文章内容..."
                  />
                </div>
              ) : editMode === 'html' ? (
                <textarea
                  value={editingArticle.contentHtml}
                  onChange={(e) => {
                    setEditingArticle({ ...editingArticle, contentHtml: e.target.value });
                    setMarkdownContent(htmlToMarkdown(e.target.value));
                  }}
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: isFullscreenEdit ? '14px' : '12px',
                    lineHeight: '1.6',
                    resize: 'none',
                    fontFamily: 'Monaco, Menlo, monospace',
                    backgroundColor: '#1e1e1e',
                    color: '#d4d4d4',
                    minHeight: isFullscreenEdit ? 'calc(100vh - 250px)' : '300px',
                  }}
                  placeholder="HTML内容..."
                  spellCheck={false}
                />
              ) : (
                <div 
                  style={{ 
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    minHeight: isFullscreenEdit ? 'calc(100vh - 250px)' : '300px',
                  }}
                  dangerouslySetInnerHTML={{ __html: safeSanitizeHtml(editingArticle.contentHtml) }}
                  className="wechat-article-content"
                />
              )}
            </div>

            <div style={{ 
              padding: '12px 24px', 
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              backgroundColor: '#f9fafb',
            }}>
              <button
                onClick={() => {
                  setEditingArticle(null);
                  setIsFullscreenEdit(false);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={async () => {
                  setSavingEdit(true);
                  try {
                    const plainContent = editingArticle.contentHtml.replace(/<[^>]*>/g, '').trim();
                    const res = await fetch('/api/wechat-collect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'update-article',
                        articleId: editingArticle.id,
                        content: plainContent,
                        contentHtml: editingArticle.contentHtml,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setArticles(articles.map(a => 
                        a.id === editingArticle.id 
                          ? { ...a, content: plainContent, contentHtml: editingArticle.contentHtml }
                          : a
                      ));
                      setEditingArticle(null);
                      setIsFullscreenEdit(false);
                      alert('保存成功！');
                    } else {
                      alert('保存失败: ' + data.error);
                    }
                  } catch (err) {
                    alert('保存失败');
                  }
                  setSavingEdit(false);
                }}
                disabled={savingEdit}
                style={{
                  padding: '10px 24px',
                  backgroundColor: savingEdit ? '#9ca3af' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: savingEdit ? 'not-allowed' : 'pointer',
                }}
              >
                {savingEdit ? '保存中...' : '💾 保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingArticleData && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            width: '500px',
            maxWidth: '95vw',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                📊 编辑文章数据
              </h3>
              <button
                onClick={() => setEditingArticleData(null)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕ 关闭
              </button>
            </div>
            
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', padding: '8px 12px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
              文章: {editingArticleData.title}
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  📖 阅读量
                </label>
                <input
                  type="number"
                  value={editingArticleData.readCount}
                  onChange={(e) => setEditingArticleData({ ...editingArticleData, readCount: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="输入阅读量"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  👍 点赞数
                </label>
                <input
                  type="number"
                  value={editingArticleData.likeCount}
                  onChange={(e) => setEditingArticleData({ ...editingArticleData, likeCount: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="输入点赞数"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  💬 评论数
                </label>
                <input
                  type="number"
                  value={editingArticleData.commentCount}
                  onChange={(e) => setEditingArticleData({ ...editingArticleData, commentCount: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="输入评论数"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  👍 推荐数
                </label>
                <input
                  type="number"
                  value={editingArticleData.recommendCount}
                  onChange={(e) => setEditingArticleData({ ...editingArticleData, recommendCount: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="输入推荐数"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  🔄 转发数
                </label>
                <input
                  type="number"
                  value={editingArticleData.shareCount}
                  onChange={(e) => setEditingArticleData({ ...editingArticleData, shareCount: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="输入转发数"
                />
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  互动率将自动计算：(评论 + 转发 + 点赞 + 推荐) / 阅读量 × 100%
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  📅 发布时间
                </label>
                <input
                  type="datetime-local"
                  value={editingArticleData.publishTime}
                  onChange={(e) => setEditingArticleData({ ...editingArticleData, publishTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingArticleData(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={async () => {
                  setSavingEdit(true);
                  try {
                    const res = await fetch('/api/wechat-collect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'update-article',
                        articleId: editingArticleData.id,
                        readCount: editingArticleData.readCount,
                        likeCount: editingArticleData.likeCount,
                        commentCount: editingArticleData.commentCount,
                        recommendCount: editingArticleData.recommendCount,
                        shareCount: editingArticleData.shareCount,
                        publishTime: editingArticleData.publishTime ? new Date(editingArticleData.publishTime).toISOString() : null,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      const calculatedEngagementRate = editingArticleData.readCount > 0 
                        ? Number(((editingArticleData.commentCount + editingArticleData.shareCount + editingArticleData.likeCount + editingArticleData.recommendCount) / editingArticleData.readCount * 100).toFixed(2))
                        : 0;
                      setArticles(articles.map(a => 
                        a.id === editingArticleData.id 
                          ? { 
                              ...a, 
                              readCount: editingArticleData.readCount,
                              likeCount: editingArticleData.likeCount,
                              commentCount: editingArticleData.commentCount,
                              recommendCount: editingArticleData.recommendCount,
                              shareCount: editingArticleData.shareCount,
                              engagementRate: calculatedEngagementRate,
                              publishTime: editingArticleData.publishTime || null,
                            }
                          : a
                      ));
                      setEditingArticleData(null);
                      alert('保存成功！');
                    } else {
                      alert('保存失败: ' + data.error);
                    }
                  } catch (err) {
                    alert('保存失败');
                  }
                  setSavingEdit(false);
                }}
                disabled={savingEdit}
                style={{
                  padding: '10px 24px',
                  backgroundColor: savingEdit ? '#9ca3af' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: savingEdit ? 'not-allowed' : 'pointer',
                }}
              >
                {savingEdit ? '保存中...' : '💾 保存数据'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '500px', maxWidth: '90vw', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>➕ 添加公众号</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>公众号文章链接</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newSubscriptionUrl}
                  onChange={(e) => { setNewSubscriptionUrl(e.target.value); setParsedInfo(null); }}
                  placeholder="https://mp.weixin.qq.com/s/..."
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
                <button
                  onClick={parseArticleUrl}
                  disabled={parsingUrl || !newSubscriptionUrl.trim()}
                  style={{ padding: '10px 16px', backgroundColor: parsingUrl ? '#9ca3af' : '#E8652D', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: parsingUrl ? 'not-allowed' : 'pointer' }}
                >
                  {parsingUrl ? '解析中...' : '解析'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>输入任意一篇该公众号的文章链接，点击"解析"获取公众号信息</p>
            </div>
            
            {parsedInfo && (
              <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📰</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#166534' }}>{parsedInfo.nickname}</span>
                </div>
                {parsedInfo.articleTitle && (
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    示例文章：{parsedInfo.articleTitle}
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>取消</button>
              <button onClick={addSubscriptionFromUrl} disabled={!parsedInfo} style={{ padding: '8px 16px', backgroundColor: parsedInfo ? '#10b981' : '#e5e7eb', color: parsedInfo ? '#fff' : '#9ca3af', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: parsedInfo ? 'pointer' : 'not-allowed' }}>添加公众号</button>
            </div>
          </div>
        </div>
      )}

      {showStyleModal && styleAnalysisResult && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '16px', 
            width: '600px', 
            maxWidth: '90vw', 
            maxHeight: '85vh', 
            overflow: 'auto',
            padding: '24px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>🎨 风格分析结果</h3>
              <button 
                onClick={() => { setShowStyleModal(false); setStyleAnalysisResult(null); }} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '13px', color: '#166534', marginBottom: '4px' }}>文章标题</div>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937' }}>{styleAnalysisResult.articleTitle}</div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>风格名称</label>
              <input
                type="text"
                value={customStyleName}
                onChange={(e) => setCustomStyleName(e.target.value)}
                placeholder="输入风格名称..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>风格特征</div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>标题风格</div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>{styleAnalysisResult.analysis.titleStyle?.description || '常规风格'}</div>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>段落结构</div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    {styleAnalysisResult.analysis.paragraphStyle?.structure === 'short' ? '短小精悍' : 
                     styleAnalysisResult.analysis.paragraphStyle?.structure === 'long' ? '详尽深入' : '长短适中'}
                    ，平均 {styleAnalysisResult.analysis.paragraphStyle?.averageLength || 0} 字/段
                  </div>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>语言风格</div>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    {styleAnalysisResult.analysis.languageStyle?.formality === 'formal' ? '正式严谨' : 
                     styleAnalysisResult.analysis.languageStyle?.formality === 'casual' ? '轻松口语' : '半正式风格'}
                    ，情感基调：
                    {styleAnalysisResult.analysis.languageStyle?.emotionalTone === 'positive' ? '积极正面' : 
                     styleAnalysisResult.analysis.languageStyle?.emotionalTone === 'negative' ? '批判反思' : 
                     styleAnalysisResult.analysis.languageStyle?.emotionalTone === 'mixed' ? '情感丰富' : '中性客观'}
                  </div>
                </div>
                
                {styleAnalysisResult.analysis.writingTechniques && (
                  <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>写作技巧</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {styleAnalysisResult.analysis.writingTechniques.storytelling && (
                        <span style={{ padding: '4px 10px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', fontSize: '12px' }}>📖 故事叙述</span>
                      )}
                      {styleAnalysisResult.analysis.writingTechniques.dataCitation && (
                        <span style={{ padding: '4px 10px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px', fontSize: '12px' }}>📊 数据支撑</span>
                      )}
                      {styleAnalysisResult.analysis.writingTechniques.questionHook && (
                        <span style={{ padding: '4px 10px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '12px' }}>❓ 问题引导</span>
                      )}
                      {styleAnalysisResult.analysis.writingTechniques.callToAction && (
                        <span style={{ padding: '4px 10px', backgroundColor: '#fce7f3', color: '#db2777', borderRadius: '4px', fontSize: '12px' }}>📢 行动号召</span>
                      )}
                      {styleAnalysisResult.analysis.writingTechniques.contrastTechnique && (
                        <span style={{ padding: '4px 10px', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '4px', fontSize: '12px' }}>⚖️ 对比论证</span>
                      )}
                    </div>
                  </div>
                )}
                
                {styleAnalysisResult.analysis.vocabulary?.topWords && styleAnalysisResult.analysis.vocabulary.topWords.length > 0 && (
                  <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>高频词汇</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {styleAnalysisResult.analysis.vocabulary.topWords.slice(0, 10).map((word: string, i: number) => (
                        <span key={i} style={{ padding: '3px 8px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', color: '#374151' }}>
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowStyleModal(false); setStyleAnalysisResult(null); }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={saveStyleToDb}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ec4899',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                💾 保存风格
              </button>
            </div>
          </div>
        </div>
      )}

      {showCookieModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCookieModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '500px', maxWidth: '90vw', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>📱 微信授权配置</h3>
            
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setAuthMode('qrcode')}
                style={{ 
                  flex: 1, 
                  padding: '10px 16px', 
                  backgroundColor: authMode === 'qrcode' ? '#07c160' : '#f3f4f6', 
                  color: authMode === 'qrcode' ? '#fff' : '#374151',
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  cursor: 'pointer' 
                }}
              >
                扫码授权
              </button>
              <button
                onClick={() => setAuthMode('cookie')}
                style={{ 
                  flex: 1, 
                  padding: '10px 16px', 
                  backgroundColor: authMode === 'cookie' ? '#E8652D' : '#f3f4f6', 
                  color: authMode === 'cookie' ? '#fff' : '#374151',
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  cursor: 'pointer' 
                }}
              >
                Cookie授权
              </button>
            </div>
            
            {authMode === 'qrcode' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                {qrCodeUrl ? (
                  <div>
                    <img 
                      src={qrCodeUrl} 
                      alt="微信扫码登录" 
                      style={{ width: '200px', height: '200px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
                      {authPolling ? '⏳ 等待扫码授权中...' : '请使用微信扫描二维码'}
                    </p>
                    {authPolling && (
                      <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '8px' }}>
                        授权中，请勿关闭此窗口...
                      </p>
                    )}
                    <button
                      onClick={startAuth}
                      disabled={authPolling}
                      style={{ 
                        marginTop: '12px', 
                        padding: '8px 16px', 
                        backgroundColor: authPolling ? '#d1d5db' : '#f3f4f6', 
                        color: '#374151', 
                        border: 'none', 
                        borderRadius: '6px', 
                        fontSize: '13px', 
                        cursor: authPolling ? 'not-allowed' : 'pointer' 
                      }}
                    >
                      刷新二维码
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                      点击下方按钮启动扫码授权流程
                    </p>
                    <button
                      onClick={startAuth}
                      disabled={authLoading}
                      style={{ 
                        padding: '12px 24px', 
                        backgroundColor: authLoading ? '#d1d5db' : '#07c160', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '14px', 
                        cursor: authLoading ? 'not-allowed' : 'pointer' 
                      }}
                    >
                      {authLoading ? '启动中...' : '🚀 启动扫码授权'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>微信 Cookie</label>
                <textarea
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  placeholder="请粘贴从微信公众平台获取的Cookie..."
                  style={{ width: '100%', height: '80px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '4px' }}><strong>获取方法：</strong></p>
                  <p>1. 登录 <a href="https://mp.weixin.qq.com" target="_blank" rel="noopener noreferrer" style={{ color: '#E8652D' }}>微信公众平台</a></p>
                  <p>2. 打开浏览器开发者工具 (F12)</p>
                  <p>3. 切换到 Network 标签，刷新页面</p>
                  <p>4. 找到任意请求，复制 Cookie 值</p>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => setShowCookieModal(false)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>取消</button>
              {authMode === 'cookie' && (
                <button onClick={submitCookie} disabled={authLoading} style={{ padding: '8px 16px', backgroundColor: authLoading ? '#9ca3af' : '#07c160', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: authLoading ? 'not-allowed' : 'pointer' }}>
                  {authLoading ? '授权中...' : '确认授权'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WechatCollectPage;
