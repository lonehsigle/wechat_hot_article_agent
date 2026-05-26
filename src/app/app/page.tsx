'use client';

import React, { useState, useEffect } from 'react';
import styles, { mobileStyles } from '../styles';

import CreateWorkbench from '../components/CreateWorkbench';
import PendingPublishPage from '../components/PendingPublishPage';
import OptimizationLoop from '../components/OptimizationLoop';
import HotTopicsPage from '../page_hot_topics';
import CrawlerPage from '../components/CrawlerPage';
import WechatCollectPage from '../components/WechatCollectPage';
import DashboardPage from '../components/DashboardPage';
import TopicAnalysisPage from '../components/TopicAnalysisPage';
import AnalyticsPanel from '../components/AnalyticsPanel';

import { useAuth } from '../hooks/useAuth';
import { useWechatAccounts } from '../hooks/useWechatAccounts';
import { useMenuSettings } from '../hooks/useMenuSettings';
import AddKeywordModal from '../components/modals/AddKeywordModal';
import AddCreatorModal from '../components/modals/AddCreatorModal';
import AccountModal from '../components/modals/AccountModal';

interface MonitorCategory {
  id: string;
  name: string;
  platforms: string[];
  keywords: string[];
  creators: string[];
  contents: Content[];
  reports: Report[];
}

interface Content {
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

interface Report {
  id: string;
  date: string;
  title: string;
  summary: string;
  insights: Insight[];
  topics: Topic[];
}

interface Insight {
  type: 'trend' | 'hot' | 'recommendation';
  content: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  reason: string;
  potential: string;
}

interface SelectedTopic {
  id: string;
  title: string;
  source: string;
  likes: number;
  selected: boolean;
}

interface WechatAccount {
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

interface ImageSourceConfig {
  aiGenerated: boolean;
}

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'zhipu' | 'deepseek' | 'kimi' | 'minimax';
  apiKey: string;
  model: string;
  baseUrl?: string;
  // 安全：新增字段
  apiKeyHint?: string | null;
  hasApiKey?: boolean;
}

function TagList({
  items,
  emptyText,
  onRemove,
  disabled,
}: {
  items: string[];
  emptyText: string;
  onRemove: (item: string) => void;
  disabled?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div style={{ fontSize: '13px', color: '#9ca3af', padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {items.map(item => (
        <span
          key={item}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            fontSize: '13px',
          }}
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            disabled={disabled}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#6b7280',
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: 0,
              lineHeight: 1,
              fontSize: '14px',
            }}
            aria-label={`删除${item}`}
          >
            x
          </button>
        </span>
      ))}
    </div>
  );
}

export default function AppPage() {
  const { user, checkingAuth, handleLogout } = useAuth();
  const {
    wechatAccounts,
    loadWechatAccounts,
    addWechatAccount: createWechatAccount,
    saveWechatAccount,
    deleteWechatAccount,
    setDefaultAccount,
  } = useWechatAccounts();
  const {
    menuSettings,
    setMenuSettings,
    menuSettingsSaving,
    menuSettingsSaved,
    loadMenuSettings,
    saveMenuSettings: saveMenuSettingsApi,
  } = useMenuSettings();
  const [categories, setCategories] = useState<MonitorCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categoryContentsLoading, setCategoryContentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'hotTopics' | 'analysis' | 'topicAnalysis' | 'wechatCollect' | 'wechatAccount' | 'crawler' | 'settings' | 'create' | 'pendingPublish' | 'techniques' | 'analytics' | 'styles' | 'optimization'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [imageSources, setImageSources] = useState<ImageSourceConfig>({
    aiGenerated: true,
  });
  const [writingStyles, setWritingStyles] = useState<Array<{
    id: number;
    name: string;
    titleStrategy: string;
    openingStyle: string;
    articleFramework: string;
    template: string;
    exampleTitles: string[];
  }>>([]);
  const [topics] = useState<SelectedTopic[]>([]);
  const [editingAccount, setEditingAccount] = useState<WechatAccount | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'minimax',
    apiKey: '',
    model: 'MiniMax-M2.7',
  });
  const [settingsTab, setSettingsTab] = useState<'wechat' | 'api' | 'categories' | 'menu' | 'prompts'>('wechat');
  const [promptsConfig, setPromptsConfig] = useState<Array<{ key: string; name: string; description: string; template: string }>>([]);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [showAddCreatorModalSettings, setShowAddCreatorModalSettings] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newPlatformName, setNewPlatformName] = useState('');
  const [, setBenchmarkAccounts] = useState<Array<{
    id: number;
    platform: string;
    accountId: string;
    accountName: string;
    followerCount?: number;
    note?: string;
    isLowFollowerViral?: boolean;
  }>>([]);
  const [selectedBenchmarkAccount] = useState<{
    id: number;
    accountName: string;
  } | null>(null);
  const [, setViralTitles] = useState<Array<{
    id: number;
    title: string;
    readCount?: number;
    likeCount?: number;
  }>>([]);
  const [showAddBenchmark, setShowAddBenchmark] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [newBenchmark, setNewBenchmark] = useState({
    platform: '微信公众号',
    accountId: '',
    accountName: '',
    followerCount: 0,
    note: '',
    isLowFollowerViral: false,
  });
  const [batchTitles, setBatchTitles] = useState('');
  const loadImageSources = async () => {
    try {
      const res = await fetch('/api/app-settings?key=imageSources');
      const data = await res.json();
      if (data.success && data.value) {
        setImageSources(prev => ({ ...prev, ...data.value }));
      }
    } catch (error) {
      console.error('Failed to load image sources:', error);
    }
  };

  const saveImageSources = async (value: ImageSourceConfig) => {
    try {
      await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'imageSources',
          value,
        }),
      });
    } catch (error) {
      console.error('Failed to save image sources:', error);
    }
  };

  const loadWritingStyles = async () => {
    try {
      const res = await fetch('/api/styles');
      const data = await res.json();
      setWritingStyles(data.success ? (data.styles || []) : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Failed to load writing styles:', error);
    }
  };

  const loadBenchmarkAccounts = async () => {
    try {
      const res = await fetch('/api/benchmark');
      const data = await res.json();
      setBenchmarkAccounts(data.success ? (data.accounts || []) : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Failed to load benchmark accounts:', error);
    }
  };

  const loadViralTitles = async (accountId: number) => {
    try {
      const res = await fetch(`/api/benchmark?accountId=${accountId}&withTitles=true`);
      const data = await res.json();
      setViralTitles(data.success ? (data.titles || []) : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Failed to load viral titles:', error);
    }
  };

  const addBenchmarkAccount = async () => {
    if (!newBenchmark.accountName.trim()) {
      alert('请输入账号名称');
      return;
    }
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-account',
          data: newBenchmark,
        }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        setBenchmarkAccounts(prev => [...prev, data.account]);
      }
      setShowAddBenchmark(false);
      setNewBenchmark({
        platform: '微信公众号',
        accountId: '',
        accountName: '',
        followerCount: 0,
        note: '',
        isLowFollowerViral: false,
      });
    } catch (error) {
      console.error('Failed to add benchmark account:', error);
      alert('添加失败');
    }
  };

  const batchImportTitles = async () => {
    if (!selectedBenchmarkAccount) {
      alert('请先选择对标账号');
      return;
    }
    if (!batchTitles.trim()) {
      alert('请输入标题');
      return;
    }
    const titles = batchTitles.split('\n').filter(t => t.trim()).map(t => {
      const parts = t.split('|');
      return {
        title: parts[0]?.trim() || t.trim(),
        readCount: parts[1] ? parseInt(parts[1].trim()) : 0,
        likeCount: parts[2] ? parseInt(parts[2].trim()) : 0,
      };
    });
    if (titles.length === 0) {
      alert('没有有效的标题');
      return;
    }
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-create-titles',
          data: {
            benchmarkAccountId: selectedBenchmarkAccount.id,
            titles,
          },
        }),
      });
      const data = await res.json();
      alert(`成功导入 ${data.success ? (data.count || 0) : 0} 条标题`);
      setShowBatchImport(false);
      setBatchTitles('');
      loadViralTitles(selectedBenchmarkAccount.id);
    } catch (error) {
      console.error('Failed to batch import titles:', error);
      alert('导入失败');
    }
  };

  useEffect(() => {
    loadBenchmarkAccounts();
  }, []);

  const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      const rawCategories = data.success ? data.data : [];
      if (!Array.isArray(rawCategories)) return;

      const normalized: MonitorCategory[] = rawCategories.map((category: {
        id: number | string;
        name: string;
        platforms?: unknown;
        keywords?: unknown;
        creators?: unknown;
      }) => ({
        id: String(category.id),
        name: category.name,
        platforms: parseStringArray(category.platforms),
        keywords: parseStringArray(category.keywords),
        creators: parseStringArray(category.creators),
        contents: [],
        reports: [],
      }));

      setCategories(normalized);
      setSelectedCategoryId(current => current || normalized[0]?.id || '');
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const normalizeContent = (item: {
    id: number | string;
    platform?: string | null;
    title?: string | null;
    author?: string | null;
    date?: string | Date | null;
    likeCount?: number | null;
    likes?: number | null;
    commentCount?: number | null;
    comments?: number | null;
    shareCount?: number | null;
    shares?: number | null;
    url?: string | null;
  }): Content => ({
    id: String(item.id),
    platform: item.platform || '未知',
    title: item.title || '未命名内容',
    author: item.author || '未知作者',
    date: item.date ? String(item.date).split('T')[0] : '',
    likes: item.likeCount ?? item.likes ?? 0,
    comments: item.commentCount ?? item.comments ?? 0,
    shares: item.shareCount ?? item.shares ?? 0,
    url: item.url || '#',
  });

  const loadCategoryContents = async (categoryId: string) => {
    if (!categoryId) return;
    setCategoryContentsLoading(true);
    try {
      const res = await fetch(`/api/contents?categoryId=${encodeURIComponent(categoryId)}&limit=100`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '加载分类内容失败');
      }
      const loadedContents: Content[] = Array.isArray(data.data?.contents)
        ? data.data.contents.map(normalizeContent)
        : [];
      setCategories(prev => prev.map(category => (
        category.id === categoryId ? { ...category, contents: loadedContents } : category
      )));
      setSelectedDate(current => {
        if (current && loadedContents.some(content => content.date === current)) return current;
        return [...new Set(loadedContents.map(content => content.date).filter(Boolean))].sort().reverse()[0] || '';
      });
    } catch (error) {
      console.error('Failed to load category contents:', error);
    } finally {
      setCategoryContentsLoading(false);
    }
  };

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      alert('请输入分类名称');
      return;
    }

    setCategorySaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          platforms: [],
          keywords: [],
          creators: [],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '创建分类失败');
      }

      const category = data.data;
      const normalized: MonitorCategory = {
        id: String(category.id),
        name: category.name,
        platforms: parseStringArray(category.platforms),
        keywords: parseStringArray(category.keywords),
        creators: parseStringArray(category.creators),
        contents: [],
        reports: [],
      };
      setCategories(prev => [normalized, ...prev]);
      setSelectedCategoryId(normalized.id);
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to create category:', error);
      alert(error instanceof Error ? error.message : '创建失败，请重试');
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    if (!confirm(`确定删除分类「${category.name}」？`)) return;

    setCategorySaving(true);
    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(categoryId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '删除分类失败');
      }

      setCategories(prev => {
        const next = prev.filter(cat => cat.id !== categoryId);
        setSelectedCategoryId(current => (current === categoryId ? next[0]?.id || '' : current));
        return next;
      });
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(error instanceof Error ? error.message : '删除失败，请重试');
    } finally {
      setCategorySaving(false);
    }
  };

  const updateCategoryLists = async (
    categoryId: string,
    updates: Partial<Pick<MonitorCategory, 'keywords' | 'creators' | 'platforms'>>
  ) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const nextCategory = { ...category, ...updates };
    setCategories(prev => prev.map(cat => (cat.id === categoryId ? nextCategory : cat)));
    setCategorySaving(true);

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Number(categoryId),
          name: nextCategory.name,
          platforms: nextCategory.platforms,
          keywords: nextCategory.keywords,
          creators: nextCategory.creators,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '保存分类失败');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      setCategories(prev => prev.map(cat => (cat.id === categoryId ? category : cat)));
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleAddKeyword = async (keyword: string) => {
    if (!selectedCategory || !keyword.trim()) return;
    const nextKeywords = Array.from(new Set([...selectedCategory.keywords, keyword.trim()]));
    await updateCategoryLists(selectedCategory.id, { keywords: nextKeywords });
    setShowAddKeywordModal(false);
  };

  const handleAddCreatorToCategory = async (creator: string) => {
    if (!selectedCategory || !creator.trim()) return;
    const nextCreators = Array.from(new Set([...selectedCategory.creators, creator.trim()]));
    await updateCategoryLists(selectedCategory.id, { creators: nextCreators });
    setShowAddCreatorModalSettings(false);
  };

  const handleAddPlatformToCategory = async () => {
    if (!selectedCategory || !newPlatformName.trim()) return;
    const nextPlatforms = Array.from(new Set([...selectedCategory.platforms, newPlatformName.trim()]));
    await updateCategoryLists(selectedCategory.id, { platforms: nextPlatforms });
    setNewPlatformName('');
  };

  const removeCategoryListItem = async (
    field: 'platforms' | 'keywords' | 'creators',
    value: string
  ) => {
    if (!selectedCategory) return;
    const nextValues = selectedCategory[field].filter(item => item !== value);
    await updateCategoryLists(selectedCategory.id, { [field]: nextValues });
  };

  useEffect(() => {
    loadWechatAccounts();
    loadLLMConfig();
    loadMenuSettings();
    loadImageSources();
    loadWritingStyles();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadCategoryContents(selectedCategoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const loadLLMConfig = async () => {
    try {
      const res = await fetch('/api/llm-config');
      const data = await res.json();
      if (data && data.success && data.data) {
        // 安全：API不再返回实际API Key
        // 只显示掩码提示和配置状态
        setLlmConfig({
          provider: (data.data.provider as LLMConfig['provider']) || 'minimax',
          // 安全：前端不存储实际密钥，只存掩码标记
          apiKey: data.data.hasApiKey ? '******' : '',
          model: data.data.model || 'MiniMax-M2.7',
          baseUrl: data.data.baseUrl || undefined,
          // 新增：用于UI显示
          apiKeyHint: data.data.apiKeyHint,
          hasApiKey: data.data.hasApiKey,
        });
      }
    } catch (error) {
      console.error('Failed to load LLM config:', error);
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const allDates = [...new Set(selectedCategory?.contents.map(c => c.date) || [])].sort().reverse();

  const filteredContents = selectedCategory?.contents.filter(c => {
    if (selectedPlatform && c.platform !== selectedPlatform) return false;
    if (selectedDate && c.date !== selectedDate) return false;
    return true;
  }) || [];

  const addWechatAccount = () => {
    const newAccount = createWechatAccount();
    setEditingAccount(newAccount);
    setShowAccountModal(true);
  };

  const editWechatAccount = (account: WechatAccount) => {
    setEditingAccount({ ...account });
    setShowAccountModal(true);
  };

  const handleSaveAccount = async (account: WechatAccount) => {
    if (!account || account.name.trim() === '') return;
    await saveWechatAccount(account, wechatAccounts);
    setShowAccountModal(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('确定删除此公众号账号？')) return;
    await deleteWechatAccount(id);
  };


  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ color: '#6b7280' }}>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      
      {mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside 
        data-mobile-sidebar
        style={{
          ...styles.sidebar,
          width: sidebarCollapsed ? '60px' : '200px',
          transition: 'width 0.3s ease, transform 0.3s ease',
          zIndex: 1000,
          transform: mobileMenuOpen ? 'translateX(0)' : undefined,
        }}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.logo}>{sidebarCollapsed ? '📊' : '📊 内容工作台'}</h1>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              position: 'absolute',
              right: '-12px',
              top: '24px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {user && !sidebarCollapsed && (
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
              }}>
                {user.displayName?.[0] || user.username[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.displayName || user.username}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={styles.tabSection}>
          {menuSettings.dashboard && (
            <button
              style={{ 
                ...styles.tabItem, 
                ...(activeTab === 'dashboard' ? styles.tabItemActive : {}),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '12px 0' : '12px',
              }}
              onClick={() => setActiveTab('dashboard')}
              title={sidebarCollapsed ? '首页' : ''}
            >
              <span style={styles.tabIcon}>🏠</span>
              {!sidebarCollapsed && <span>首页</span>}
            </button>
          )}
          
          {menuSettings.wechatCollect && (
            <button
              style={{ 
                ...styles.tabItem, 
                ...(activeTab === 'wechatCollect' ? styles.tabItemActive : {}),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '12px 0' : '12px',
              }}
              onClick={() => setActiveTab('wechatCollect')}
              title={sidebarCollapsed ? '文章采集' : ''}
            >
              <span style={styles.tabIcon}>📥</span>
              {!sidebarCollapsed && <span>文章采集</span>}
            </button>
          )}

          {menuSettings.wechatCollect && (
            <button
              style={{
                ...styles.tabItem,
                ...(activeTab === 'content' ? styles.tabItemActive : {}),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '12px 0' : '12px',
              }}
              onClick={() => setActiveTab('content')}
              title={sidebarCollapsed ? '内容库' : ''}
            >
              <span style={styles.tabIcon}>📚</span>
              {!sidebarCollapsed && <span>内容库</span>}
            </button>
          )}
          
          {menuSettings.wechatAccount && (
            <button
              style={{ 
                ...styles.tabItem, 
                ...(activeTab === 'wechatAccount' ? styles.tabItemActive : {}),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '12px 0' : '12px',
              }}
              onClick={() => setActiveTab('wechatAccount')}
              title={sidebarCollapsed ? '公众号采集' : ''}
            >
              <span style={styles.tabIcon}>🔍</span>
              {!sidebarCollapsed && <span>公众号采集</span>}
            </button>
          )}
          
          {menuSettings.hotTopics && (
            <button
              style={{ 
                ...styles.tabItem, 
                ...(activeTab === 'hotTopics' ? styles.tabItemActive : {}),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '12px 0' : '12px',
              }}
              onClick={() => setActiveTab('hotTopics')}
              title={sidebarCollapsed ? '热门选题' : ''}
            >
              <span style={styles.tabIcon}>🔥</span>
              {!sidebarCollapsed && <span>热门选题</span>}
            </button>
          )}
          
          {(menuSettings.topicAnalysis || menuSettings.create || menuSettings.published) && (
            <div style={styles.menuGroup}>
              {!sidebarCollapsed && <div style={styles.menuGroupTitle}>✍️ 创作</div>}
              {menuSettings.topicAnalysis && (
                <button
                  style={{ 
                    ...styles.tabItem, 
                    ...styles.subMenuItem, 
                    ...(activeTab === 'topicAnalysis' ? styles.tabItemActive : {}),
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '10px 0' : '10px 12px 10px 24px',
                  }}
                  onClick={() => setActiveTab('topicAnalysis')}
                  title={sidebarCollapsed ? '选题分析' : ''}
                >
                  <span>🔍</span>
                  {!sidebarCollapsed && <span style={{ marginLeft: '6px' }}>选题分析</span>}
                </button>
              )}
              {menuSettings.create && (
                <button
                  style={{ 
                    ...styles.tabItem, 
                    ...styles.subMenuItem, 
                    ...(activeTab === 'create' ? styles.tabItemActive : {}),
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '10px 0' : '10px 12px 10px 24px',
                  }}
                  onClick={() => setActiveTab('create')}
                  title={sidebarCollapsed ? '创作工作台' : ''}
                >
                  <span>✍️</span>
                  {!sidebarCollapsed && <span style={{ marginLeft: '6px' }}>创作工作台</span>}
                </button>
              )}
              {menuSettings.pendingPublish && (
                <button
                  style={{ 
                    ...styles.tabItem, 
                    ...styles.subMenuItem, 
                    ...(activeTab === 'pendingPublish' ? styles.tabItemActive : {}),
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '10px 0' : '10px 12px 10px 24px',
                  }}
                  onClick={() => setActiveTab('pendingPublish')}
                  title={sidebarCollapsed ? '待发布管理' : ''}
                >
                  <span>📋</span>
                  {!sidebarCollapsed && <span style={{ marginLeft: '6px' }}>待发布管理</span>}
                </button>
              )}
            </div>
          )}

          {menuSettings.analytics && (
            <div style={styles.menuGroup}>
              {!sidebarCollapsed && <div style={styles.menuGroupTitle}>⚙️ 管理</div>}
              <button
                style={{ 
                  ...styles.tabItem, 
                  ...styles.subMenuItem, 
                  ...(activeTab === 'analytics' ? styles.tabItemActive : {}),
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '10px 0' : '10px 12px 10px 24px',
                }}
                onClick={() => setActiveTab('analytics')}
                title={sidebarCollapsed ? '数据分析' : ''}
              >
                <span>📊</span>
                {!sidebarCollapsed && <span style={{ marginLeft: '6px' }}>数据分析</span>}
              </button>
              <button
                style={{ 
                  ...styles.tabItem, 
                  ...styles.subMenuItem, 
                  ...(activeTab === 'optimization' ? styles.tabItemActive : {}),
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '10px 0' : '10px 12px 10px 24px',
                }}
                onClick={() => setActiveTab('optimization')}
                title={sidebarCollapsed ? '闭环优化' : ''}
              >
                <span>🔄</span>
                {!sidebarCollapsed && <span style={{ marginLeft: '6px' }}>闭环优化</span>}
              </button>
              <button
                style={{ 
                  ...styles.tabItem, 
                  ...styles.subMenuItem, 
                  ...(activeTab === 'settings' ? styles.tabItemActive : {}),
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '10px 0' : '10px 12px 10px 24px',
                }}
                onClick={() => setActiveTab('settings')}
                title={sidebarCollapsed ? '系统设置' : ''}
              >
                <span>⚙️</span>
                {!sidebarCollapsed && <span style={{ marginLeft: '6px' }}>系统设置</span>}
              </button>
            </div>
          )}

          {!sidebarCollapsed && (
            <button
              style={{
                ...styles.tabItem,
                justifyContent: 'flex-start',
                padding: '12px',
                marginTop: 'auto',
                color: '#ef4444',
              }}
              onClick={handleLogout}
            >
              <span style={styles.tabIcon}>🚪</span>
              <span>退出登录</span>
            </button>
          )}
        </div>
      </aside>

      <header 
        data-mobile-header
        style={{
          ...styles.mobileHeader,
          display: 'flex',
        }}>
        <button
          style={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(true)}
        >
          ☰
        </button>
        <span style={styles.mobileTitle}>
          {activeTab === 'dashboard' && '首页'}
          {activeTab === 'hotTopics' && '热门选题'}
          {activeTab === 'crawler' && '爬虫管理'}
          {activeTab === 'wechatCollect' && '文章采集'}
          {activeTab === 'content' && '内容库'}
          {activeTab === 'wechatAccount' && '公众号采集'}
          {activeTab === 'topicAnalysis' && '选题分析'}
          {activeTab === 'create' && '创作工作台'}
          {activeTab === 'pendingPublish' && '待发布管理'}
          {activeTab === 'analytics' && '数据分析'}
          {activeTab === 'optimization' && '闭环优化'}
          {activeTab === 'settings' && '系统设置'}
          {activeTab === 'styles' && '写作风格'}
        </span>
        <div style={{ width: '40px' }} />
      </header>

      <main 
        data-mobile-main
        style={{
          ...styles.main,
          marginLeft: sidebarCollapsed ? '60px' : '200px',
          transition: 'margin-left 0.3s ease',
          paddingTop: '80px',
        }}>
        {activeTab === 'dashboard' && (
          <DashboardPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'hotTopics' && (
          <HotTopicsPage />
        )}

        {activeTab === 'crawler' && (
          <CrawlerPage />
        )}

        {activeTab === 'wechatCollect' && (
          <WechatCollectPage mode="collect" />
        )}

        {activeTab === 'content' && (
          <div style={styles.contentWrapper}>
            <div style={styles.settingsHeader}>
              <div>
                <h2 style={styles.settingsPageTitle}>📚 内容库</h2>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  查看当前监控分类下的真实采集内容。
                </p>
              </div>
              <button
                onClick={() => selectedCategoryId && loadCategoryContents(selectedCategoryId)}
                disabled={!selectedCategoryId || categoryContentsLoading}
                style={{ ...styles.addBtn, opacity: categoryContentsLoading ? 0.7 : 1 }}
              >
                {categoryContentsLoading ? '刷新中...' : '刷新内容'}
              </button>
            </div>

            <div style={styles.settingsCard}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={styles.formLabel}>监控分类</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      setSelectedDate('');
                      setSelectedPlatform(null);
                    }}
                    style={styles.formSelect}
                  >
                    <option value="">请选择分类</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.formLabel}>日期</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={styles.formSelect}
                    disabled={allDates.length === 0}
                  >
                    <option value="">全部日期</option>
                    {allDates.map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.formLabel}>平台</label>
                  <select
                    value={selectedPlatform || ''}
                    onChange={(e) => setSelectedPlatform(e.target.value || null)}
                    style={styles.formSelect}
                    disabled={!selectedCategory}
                  >
                    <option value="">全部平台</option>
                    {Array.from(new Set(selectedCategory?.contents.map(content => content.platform).filter(Boolean) || [])).map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>
              </div>

              {categoryContentsLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>内容加载中...</div>
              ) : filteredContents.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#6b7280' }}>标题</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#6b7280' }}>平台</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#6b7280' }}>作者</th>
                        <th style={{ textAlign: 'right', padding: '10px', fontSize: '12px', color: '#6b7280' }}>点赞</th>
                        <th style={{ textAlign: 'right', padding: '10px', fontSize: '12px', color: '#6b7280' }}>评论</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#6b7280' }}>日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContents.map(content => (
                        <tr key={content.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 10px', fontSize: '14px', color: '#1f2937', maxWidth: '420px' }}>
                            <a href={content.url} target="_blank" rel="noreferrer" style={{ color: '#1f2937', textDecoration: 'none' }}>
                              {content.title}
                            </a>
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '13px', color: '#6b7280' }}>{content.platform}</td>
                          <td style={{ padding: '12px 10px', fontSize: '13px', color: '#6b7280' }}>{content.author}</td>
                          <td style={{ padding: '12px 10px', fontSize: '13px', color: '#6b7280', textAlign: 'right' }}>{content.likes}</td>
                          <td style={{ padding: '12px 10px', fontSize: '13px', color: '#6b7280', textAlign: 'right' }}>{content.comments}</td>
                          <td style={{ padding: '12px 10px', fontSize: '13px', color: '#6b7280' }}>{content.date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  {selectedCategoryId ? '该分类暂无采集内容。' : '请选择一个监控分类。'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wechatAccount' && (
          <WechatCollectPage mode="account" />
        )}

        {activeTab === 'topicAnalysis' && (
          <TopicAnalysisPage />
        )}

        {activeTab === 'settings' && (
          <div style={styles.contentWrapper}>
            <div style={styles.settingsHeader}>
              <h2 style={styles.settingsPageTitle}>⚙️ 系统设置</h2>
            </div>

            <div style={styles.settingsTabNav}>
              <button
                style={{ ...styles.settingsTab, ...(settingsTab === 'wechat' ? styles.settingsTabActive : {}) }}
                onClick={() => setSettingsTab('wechat')}
              >
                📝 公众号配置
              </button>
              <button
                style={{ ...styles.settingsTab, ...(settingsTab === 'api' ? styles.settingsTabActive : {}) }}
                onClick={() => setSettingsTab('api')}
              >
                🤖 API 配置
              </button>
              <button
                style={{ ...styles.settingsTab, ...(settingsTab === 'categories' ? styles.settingsTabActive : {}) }}
                onClick={() => setSettingsTab('categories')}
              >
                🗂️ 监控分类
              </button>
              <button
                style={{ ...styles.settingsTab, ...(settingsTab === 'menu' ? styles.settingsTabActive : {}) }}
                onClick={() => setSettingsTab('menu')}
              >
                📋 菜单管理
              </button>
              <button
                style={{ ...styles.settingsTab, ...(settingsTab === 'prompts' ? styles.settingsTabActive : {}) }}
                onClick={() => {
                  setSettingsTab('prompts');
                  fetch('/api/create-workshop?action=get-prompts')
                    .then(res => res.json())
                    .then(data => setPromptsConfig(data.prompts || []))
                    .catch(console.error);
                }}
              >
                📝 Prompt管理
              </button>
            </div>

            {settingsTab === 'wechat' && (
              <div style={styles.settingsSection}>
                <div style={styles.settingsCard}>
                  <div style={styles.settingsCardHeader}>
                    <h3 style={styles.settingsCardTitle}>📝 公众号账号管理</h3>
                    <button style={styles.addBtn} onClick={addWechatAccount}>+ 添加账号</button>
                  </div>
                  <div style={styles.accountList}>
                    {wechatAccounts.map(account => (
                      <div key={account.id} style={styles.accountItem}>
                        <div style={styles.accountInfo}>
                          <span style={styles.accountName}>{account.name || '未命名账号'}</span>
                          {account.isDefault && <span style={styles.defaultBadge}>默认</span>}
                          {account.appId && <span style={styles.accountId}>AppID: {account.appId.slice(0, 8)}...</span>}
                        </div>
                        <div style={styles.accountActions}>
                          <button style={styles.accountActionBtn} onClick={() => editWechatAccount(account)}>编辑</button>
                          {!account.isDefault && (
                            <button style={styles.accountActionBtn} onClick={() => setDefaultAccount(account.id)}>设为默认</button>
                          )}
                          <button style={{ ...styles.accountActionBtn, color: '#ef4444' }} onClick={() => handleDeleteAccount(account.id)}>删除</button>
                        </div>
                      </div>
                    ))}
                    {wechatAccounts.length === 0 && (
                      <div style={styles.emptyAccount}>暂无公众号账号，点击&quot;添加账号&quot;配置</div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <button
                    style={styles.saveBtn}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await fetch('/api/wechat-config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ accounts: wechatAccounts }),
                        });
                        alert('公众号配置已保存');
                      } catch (error) {
                        console.error('Failed to save wechat config:', error);
                        alert('保存失败，请重试');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? '保存中...' : '💾 保存配置'}
                  </button>
                </div>
              </div>
            )}

            {settingsTab === 'api' && (
              <div style={styles.settingsSection}>
                <div style={styles.settingsCard}>
                  <div style={styles.settingsCardHeader}>
                    <h3 style={styles.settingsCardTitle}>🤖 大模型配置</h3>
                  </div>
                  <div style={styles.configForm}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>服务商</label>
                      <select
                        style={styles.formSelect}
                        value={llmConfig.provider}
                        onChange={(e) => setLlmConfig(prev => ({ ...prev, provider: e.target.value as LLMConfig['provider'] }))}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="kimi">Kimi (月之暗面)</option>
                        <option value="minimax">MiniMax</option>
                        <option value="zhipu">智谱AI</option>
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        API Key
                        {llmConfig.hasApiKey && (
                          <span style={{ marginLeft: 8, fontSize: 12, color: '#10b981' }}>
                            ✓ 已配置 ({llmConfig.apiKeyHint || '****'})
                          </span>
                        )}
                      </label>
                      <input
                        type="password"
                        style={styles.formInput}
                        placeholder={llmConfig.hasApiKey ? "输入新密钥可重新配置，留空则保留原配置" : "输入 API Key"}
                        value={llmConfig.apiKey}
                        onChange={(e) => setLlmConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      />
                      {llmConfig.hasApiKey && (
                        <small style={{ color: '#6b7280', fontSize: 11 }}>
                          如需更换密钥，请输入新密钥后保存
                        </small>
                      )}
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>模型</label>
                      {llmConfig.provider === 'minimax' ? (
                        <select
                          style={styles.formSelect}
                          value={llmConfig.model}
                          onChange={(e) => setLlmConfig(prev => ({ ...prev, model: e.target.value }))}
                        >
                          <option value="MiniMax-Text-01">MiniMax-Text-01 (最新)</option>
                          <option value="MiniMax-M2.7">MiniMax-M2.7</option>
                          <option value="MiniMax-M2.7-highspeed">MiniMax-M2.7-highspeed (极速版)</option>
                          <option value="abab6.5s-chat">abab6.5s-chat</option>
                          <option value="abab6.5g-chat">abab6.5g-chat</option>
                          <option value="abab6.5t-chat">abab6.5t-chat</option>
                          <option value="abab5.5-chat">abab5.5-chat</option>
                        </select>
                      ) : llmConfig.provider === 'openai' ? (
                        <select
                          style={styles.formSelect}
                          value={llmConfig.model}
                          onChange={(e) => setLlmConfig(prev => ({ ...prev, model: e.target.value }))}
                        >
                          <option value="gpt-4o">GPT-4o (推荐)</option>
                          <option value="gpt-4o-mini">GPT-4o-mini</option>
                          <option value="gpt-4-turbo">GPT-4-turbo</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
                        </select>
                      ) : llmConfig.provider === 'anthropic' ? (
                        <select
                          style={styles.formSelect}
                          value={llmConfig.model}
                          onChange={(e) => setLlmConfig(prev => ({ ...prev, model: e.target.value }))}
                        >
                          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (推荐)</option>
                          <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                          <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                          <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                          <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                        </select>
                      ) : llmConfig.provider === 'deepseek' ? (
                        <select
                          style={styles.formSelect}
                          value={llmConfig.model}
                          onChange={(e) => setLlmConfig(prev => ({ ...prev, model: e.target.value }))}
                        >
                          <option value="deepseek-chat">DeepSeek Chat (推荐)</option>
                          <option value="deepseek-coder">DeepSeek Coder</option>
                          <option value="deepseek-reasoner">DeepSeek Reasoner</option>
                        </select>
                      ) : llmConfig.provider === 'kimi' ? (
                        <select
                          style={styles.formSelect}
                          value={llmConfig.model}
                          onChange={(e) => setLlmConfig(prev => ({ ...prev, model: e.target.value }))}
                        >
                          <option value="moonshot-v1-8k">Moonshot V1 8K</option>
                          <option value="moonshot-v1-32k">Moonshot V1 32K</option>
                          <option value="moonshot-v1-128k">Moonshot V1 128K</option>
                        </select>
                      ) : (
                        <select
                          style={styles.formSelect}
                          value={llmConfig.model}
                          onChange={(e) => setLlmConfig(prev => ({ ...prev, model: e.target.value }))}
                        >
                          <option value="glm-4">GLM-4</option>
                          <option value="glm-4-flash">GLM-4-flash</option>
                          <option value="glm-4-plus">GLM-4-plus</option>
                        </select>
                      )}
                    </div>
                    {(llmConfig.provider === 'zhipu' || llmConfig.provider === 'deepseek' || llmConfig.provider === 'kimi' || llmConfig.provider === 'minimax') && (
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>API URL</label>
                        <input
                          type="text"
                          style={styles.formInput}
                          placeholder={
                            llmConfig.provider === 'kimi' ? 'https://api.moonshot.cn/v1' :
                            llmConfig.provider === 'minimax' ? 'https://api.minimax.chat/v1' :
                            '自定义 API 地址（可选）'
                          }
                          value={llmConfig.baseUrl || ''}
                          onChange={(e) => setLlmConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                        />
                      </div>
                    )}
                    <button
                      style={styles.saveBtn}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          // 安全：只有当用户输入了新密钥时才发送
                          // 如果apiKey是占位符'******'，则不发送（保留原密钥）
                          const payload: any = {
                            provider: llmConfig.provider,
                            model: llmConfig.model,
                            baseUrl: llmConfig.baseUrl || null,
                          };

                          // 只有输入了新密钥（不是占位符）才发送
                          if (llmConfig.apiKey && llmConfig.apiKey !== '******') {
                            payload.apiKey = llmConfig.apiKey;
                          }

                          const res = await fetch('/api/llm-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          });

                          const result = await res.json();
                          if (result.success) {
                            // 重新加载配置（会获取新的掩码提示）
                            await loadLLMConfig();
                            alert(payload.apiKey ? '配置已保存，新密钥已加密存储' : '配置已保存（密钥未变更）');
                          } else {
                            alert('保存失败: ' + (result.error || '未知错误'));
                          }
                        } catch (error) {
                          console.error('Failed to save LLM config:', error);
                          alert('保存失败，请重试');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? '保存中...' : '保存配置'}
                    </button>
                  </div>
                </div>

                <div style={styles.settingsCard}>
                  <div style={styles.settingsCardHeader}>
                    <h3 style={styles.settingsCardTitle}>🖼️ 图片生成配置</h3>
                  </div>
                  <div style={styles.checkboxGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={imageSources.aiGenerated}
                        onChange={(e) => {
                          const newValue = { ...imageSources, aiGenerated: e.target.checked };
                          setImageSources(newValue);
                          saveImageSources(newValue);
                        }}
                        style={styles.checkbox}
                      />
                      <span>AI 生成配图（MiniMax 文生图）</span>
                    </label>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                      使用 MiniMax AI 自动生成与文章内容相关的配图
                    </p>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'prompts' && (
              <div style={styles.settingsSection}>
                <div style={styles.settingsCard}>
                  <div style={styles.settingsCardHeader}>
                    <h3 style={styles.settingsCardTitle}>📝 Prompt 管理</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    管理和自定义 AI 创作使用的 Prompt 模板。点击编辑按钮可以修改 Prompt 内容。
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {promptsConfig.map((prompt) => (
                      <div
                        key={prompt.key}
                        style={{
                          padding: '16px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{prompt.name}</span>
                            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>({prompt.key})</span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingPrompt(prompt.key);
                              setEditingTemplate(prompt.template);
                            }}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#3b82f6',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            编辑
                          </button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{prompt.description}</p>
                        {editingPrompt === prompt.key ? (
                          <div style={{ marginTop: '12px' }}>
                            <textarea
                              value={editingTemplate}
                              onChange={(e) => setEditingTemplate(e.target.value)}
                              style={{
                                width: '100%',
                                minHeight: '150px',
                                padding: '8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <button
                                onClick={async () => {
                                  try {
                                    await fetch('/api/create-workshop', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'update-prompt',
                                        key: prompt.key,
                                        template: editingTemplate,
                                      }),
                                    });
                                    setEditingPrompt(null);
                                    const res = await fetch('/api/create-workshop?action=get-prompts');
                                    const data = await res.json();
                                    setPromptsConfig(data.prompts || []);
                                  } catch (error) {
                                    console.error('Failed to update prompt:', error);
                                  }
                                }}
                                style={{
                                  padding: '6px 16px',
                                  backgroundColor: '#10b981',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                保存
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPrompt(null);
                                  setEditingTemplate('');
                                }}
                                style={{
                                  padding: '6px 16px',
                                  backgroundColor: '#6b7280',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '8px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#6b7280',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {prompt.template.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'categories' && (
              <div style={styles.settingsSection}>
                <div style={styles.settingsCard}>
                  <div style={styles.settingsCardHeader}>
                    <h3 style={styles.settingsCardTitle}>🗂️ 监控分类管理</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
                    <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') createCategory();
                          }}
                          placeholder="新分类名称"
                          style={{ ...styles.formInput, marginBottom: 0 }}
                          disabled={categorySaving}
                        />
                        <button
                          onClick={createCategory}
                          disabled={categorySaving}
                          style={{ ...styles.addBtn, whiteSpace: 'nowrap', opacity: categorySaving ? 0.7 : 1 }}
                        >
                          新建
                        </button>
                      </div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {categories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            style={{
                              textAlign: 'left',
                              padding: '10px 12px',
                              border: `1px solid ${selectedCategoryId === category.id ? '#3b82f6' : '#e5e7eb'}`,
                              borderRadius: '8px',
                              backgroundColor: selectedCategoryId === category.id ? '#eff6ff' : '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{category.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              {category.keywords.length} 关键词 · {category.creators.length} 创作者
                            </div>
                          </button>
                        ))}
                        {categories.length === 0 && (
                          <div style={{ fontSize: '13px', color: '#6b7280', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                            暂无分类，先新建一个监控分类。
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {selectedCategory ? (
                        <div style={{ display: 'grid', gap: '18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                {selectedCategory.name}
                              </h4>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                管理该分类的监控平台、关键词和创作者。
                              </div>
                            </div>
                            <button
                              onClick={() => deleteCategory(selectedCategory.id)}
                              disabled={categorySaving}
                              style={{
                                padding: '8px 12px',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                cursor: categorySaving ? 'not-allowed' : 'pointer',
                              }}
                            >
                              删除分类
                            </button>
                          </div>

                          <div>
                            <label style={styles.formLabel}>监控平台</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                              <input
                                type="text"
                                value={newPlatformName}
                                onChange={(e) => setNewPlatformName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddPlatformToCategory();
                                }}
                                placeholder="例如：公众号、微博、小红书"
                                style={{ ...styles.formInput, marginBottom: 0 }}
                                disabled={categorySaving}
                              />
                              <button
                                onClick={handleAddPlatformToCategory}
                                disabled={categorySaving}
                                style={{ ...styles.addBtn, whiteSpace: 'nowrap', opacity: categorySaving ? 0.7 : 1 }}
                              >
                                添加平台
                              </button>
                            </div>
                            <TagList
                              items={selectedCategory.platforms}
                              emptyText="暂无平台"
                              onRemove={(item) => removeCategoryListItem('platforms', item)}
                              disabled={categorySaving}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <label style={{ ...styles.formLabel, marginBottom: 0 }}>关键词</label>
                              <button
                                onClick={() => setShowAddKeywordModal(true)}
                                disabled={categorySaving}
                                style={{ ...styles.addBtn, opacity: categorySaving ? 0.7 : 1 }}
                              >
                                添加关键词
                              </button>
                            </div>
                            <TagList
                              items={selectedCategory.keywords}
                              emptyText="暂无关键词"
                              onRemove={(item) => removeCategoryListItem('keywords', item)}
                              disabled={categorySaving}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <label style={{ ...styles.formLabel, marginBottom: 0 }}>创作者</label>
                              <button
                                onClick={() => setShowAddCreatorModalSettings(true)}
                                disabled={categorySaving}
                                style={{ ...styles.addBtn, opacity: categorySaving ? 0.7 : 1 }}
                              >
                                添加创作者
                              </button>
                            </div>
                            <TagList
                              items={selectedCategory.creators}
                              emptyText="暂无创作者"
                              onRemove={(item) => removeCategoryListItem('creators', item)}
                              disabled={categorySaving}
                            />
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#6b7280', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                          请选择或新建一个监控分类。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'menu' && (
              <div style={styles.settingsSection}>
                <div style={styles.settingsCard}>
                  <div style={{ ...styles.settingsCardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={styles.settingsCardTitle}>📋 侧栏菜单管理</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {menuSettingsSaved && (
                        <span style={{ fontSize: '13px', color: '#10b981' }}>✓ 已保存</span>
                      )}
                      <button
                        onClick={() => saveMenuSettingsApi(menuSettings)}
                        disabled={menuSettingsSaving}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: menuSettingsSaving ? '#e5e7eb' : '#3b82f6',
                          color: menuSettingsSaving ? '#9ca3af' : '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: menuSettingsSaving ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {menuSettingsSaving ? '保存中...' : '💾 保存设置'}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    开启或关闭侧栏菜单项的显示，关闭后该菜单将不会在侧栏中显示。修改后请点击"保存设置"按钮。
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {[
                      { key: 'dashboard', label: '🏠 首页', desc: '系统首页仪表盘' },
                      { key: 'wechatCollect', label: '📥 文章采集', desc: '微信公众号文章采集与文章库' },
                      { key: 'wechatAccount', label: '🔍 公众号采集', desc: '公众号搜索与订阅管理' },
                      { key: 'hotTopics', label: '🔥 热点聚合', desc: '热点话题监控与聚合' },
                      { key: 'crawler', label: '🔍 内容爬取', desc: '网页内容爬取工具' },
                      { key: 'topicAnalysis', label: '📊 选题分析', desc: '选题评估与分析工具' },
                      { key: 'create', label: '✍️ 创作工作台', desc: 'AI一键创作文章' },
                      { key: 'analytics', label: '📈 数据分析', desc: '数据统计与分析' },
                    ].map((item) => (
                      <div 
                        key={item.key}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          backgroundColor: menuSettings[item.key as keyof typeof menuSettings] ? '#f0fdf4' : '#f9fafb',
                          borderRadius: '8px',
                          border: `1px solid ${menuSettings[item.key as keyof typeof menuSettings] ? '#86efac' : '#e5e7eb'}`,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {item.desc}
                          </div>
                        </div>
                        <label style={{ 
                          position: 'relative', 
                          display: 'inline-block', 
                          width: '44px', 
                          height: '24px',
                          cursor: 'pointer',
                        }}>
                          <input
                            type="checkbox"
                            checked={menuSettings[item.key as keyof typeof menuSettings]}
                            onChange={(e) => setMenuSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: menuSettings[item.key as keyof typeof menuSettings] ? '#10b981' : '#d1d5db',
                            transition: '0.3s',
                            borderRadius: '24px',
                          }}>
                            <span style={{
                              position: 'absolute',
                              content: '""',
                              height: '18px',
                              width: '18px',
                              left: menuSettings[item.key as keyof typeof menuSettings] ? '23px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: '0.3s',
                              borderRadius: '50%',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        <AddKeywordModal
          show={showAddKeywordModal}
          onClose={() => setShowAddKeywordModal(false)}
          onAdd={handleAddKeyword}
          selectedCategory={selectedCategory}
          selectedCategoryId={selectedCategoryId}
          saving={categorySaving}
        />

        <AddCreatorModal
          show={showAddCreatorModalSettings}
          onClose={() => setShowAddCreatorModalSettings(false)}
          onAdd={handleAddCreatorToCategory}
          selectedCategory={selectedCategory}
          selectedCategoryId={selectedCategoryId}
          saving={categorySaving}
        />


        {activeTab === 'create' && (
          <CreateWorkbench
            llmConfig={llmConfig}
            topics={topics}
            writingStyles={writingStyles}
          />
        )}

        {activeTab === 'pendingPublish' && (
          <PendingPublishPage />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPanel />
        )}

        {activeTab === 'optimization' && (
          <OptimizationLoop />
        )}

      </main>


      <AccountModal
        show={showAccountModal}
        account={editingAccount}
        onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
        onSave={handleSaveAccount}
        wechatAccounts={wechatAccounts}
      />


      {showAddBenchmark && (
        <div style={styles.modalOverlay} onClick={() => setShowAddBenchmark(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>添加对标账号</h3>
              <button style={styles.modalClose} onClick={() => setShowAddBenchmark(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>平台 *</label>
                <select
                  style={styles.formSelect}
                  value={newBenchmark.platform}
                  onChange={(e) => setNewBenchmark(prev => ({ ...prev, platform: e.target.value }))}
                >
                  <option value="微信公众号">微信公众号</option>
                  <option value="小红书">小红书</option>
                  <option value="抖音">抖音</option>
                  <option value="B站">B站</option>
                  <option value="知乎">知乎</option>
                  <option value="微博">微博</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>账号名称 *</label>
                <input
                  type="text"
                  style={styles.formInput}
                  placeholder="对标账号名称"
                  value={newBenchmark.accountName}
                  onChange={(e) => setNewBenchmark(prev => ({ ...prev, accountName: e.target.value }))}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>账号ID</label>
                <input
                  type="text"
                  style={styles.formInput}
                  placeholder="平台账号ID（可选）"
                  value={newBenchmark.accountId}
                  onChange={(e) => setNewBenchmark(prev => ({ ...prev, accountId: e.target.value }))}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>粉丝数</label>
                <input
                  type="number"
                  style={styles.formInput}
                  placeholder="粉丝数量（可选）"
                  value={newBenchmark.followerCount || ''}
                  onChange={(e) => setNewBenchmark(prev => ({ ...prev, followerCount: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>备注</label>
                <textarea
                  style={{ ...styles.formInput, minHeight: '60px', resize: 'vertical' }}
                  placeholder="记录此账号的特点、爆款原因等"
                  value={newBenchmark.note}
                  onChange={(e) => setNewBenchmark(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newBenchmark.isLowFollowerViral}
                    onChange={(e) => setNewBenchmark(prev => ({ ...prev, isLowFollowerViral: e.target.checked }))}
                    style={styles.checkbox}
                  />
                  <span>低粉爆款账号（粉丝少但爆款多）</span>
                </label>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowAddBenchmark(false)}>取消</button>
              <button style={styles.saveBtn} onClick={addBenchmarkAccount}>添加</button>
            </div>
          </div>
        </div>
      )}

      {showBatchImport && selectedBenchmarkAccount && (
        <div style={styles.modalOverlay} onClick={() => setShowBatchImport(false)}>
          <div style={{ ...styles.modal, width: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>批量导入爆款标题</h3>
              <button style={styles.modalClose} onClick={() => setShowBatchImport(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '13px', color: '#0369a1' }}>
                <strong>导入账号：</strong>{selectedBenchmarkAccount.accountName}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>标题列表（每行一个）</label>
                <textarea
                  style={{ ...styles.formInput, minHeight: '200px', resize: 'vertical', fontFamily: 'monospace' }}
                  placeholder={`格式说明：
每行一个标题
可添加阅读量和点赞数，用 | 分隔

示例：
这个标题火了|10000|500
另一个爆款标题|8000|300
简单标题`}
                  value={batchTitles}
                  onChange={(e) => setBatchTitles(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                💡 提示：可以从对标账号的历史文章中复制标题，批量导入后可用于选题分析
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowBatchImport(false)}>取消</button>
              <button style={styles.saveBtn} onClick={batchImportTitles}>导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
