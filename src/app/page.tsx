'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import styles, { mobileStyles } from './styles';
// SSR 环境下 DOMPurify 需要 jsdom
if (typeof window !== 'undefined' && typeof DOMPurify !== 'undefined') {
  DOMPurify.addHook?.('afterSanitizeAttributes', (node) => {
    // 保持默认行为
  });
}
const safeSanitize = (html: string): string => {
  if (typeof window === 'undefined') return html;
  try {
    return DOMPurify.sanitize(html);
  } catch {
    return html;
  }
};
import CreateWorkbench from './components/CreateWorkbench';
import PendingPublishPage from './components/PendingPublishPage';
import MarkdownEditor from './components/MarkdownEditor';
import OptimizationLoop from './components/OptimizationLoop';
import { htmlToMarkdown, markdownToHtml } from '@/lib/utils/html-markdown';
import HotTopicsPage from './page_hot_topics';
import CrawlerPage from './components/CrawlerPage';
import WechatCollectPage from './components/WechatCollectPage';
import WritingTechniquesPage from './components/WritingTechniquesPage';
import DashboardPage from './components/DashboardPage';
import TopicAnalysisPage from './components/TopicAnalysisPage';
import StyleAnalyzerPage from './components/StyleAnalyzerPage';
import AnalyticsPanel from './components/AnalyticsPanel';
import PublishedArticlesPage from './components/PublishedArticlesPage';
import { generateId } from '@/lib/utils/helpers';

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

interface SearchResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  description: string;
  photographer: string;
  source: string;
}

interface ArticleDraft {
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
}

const mockCategories: MonitorCategory[] = [
  {
    id: '1',
    name: 'Claude Code 选题监控',
    platforms: ['抖音', '小红书', '微博', 'B站'],
    keywords: ['Claude Code', 'AI编程', 'Cursor', 'Vibe Coding'],
    creators: ['老胡', '科技麦芒', '程序员子循'],
    contents: [
      { id: '1', platform: '小红书', title: 'Claude Code 实战测评，真的能替代程序员？', author: '科技麦芒', date: '2026-03-28', likes: 12580, comments: 892, shares: 2341, url: '#' },
      { id: '2', platform: 'B站', title: '【AI编程】Claude Code 完整教程，从入门到精通', author: '程序员子循', date: '2026-03-28', likes: 8960, comments: 1247, shares: 890, url: '#' },
      { id: '3', platform: '抖音', title: 'AI编程工具大比拼，Claude Code表现惊艳', author: '科技侦探', date: '2026-03-27', likes: 23400, comments: 3201, shares: 5670, url: '#' },
      { id: '4', platform: '微博', title: 'Claude Code 掀起编程革命，程序员该何去何从', author: '互联网那些事', date: '2026-03-27', likes: 15600, comments: 2100, shares: 4500, url: '#' },
      { id: '5', platform: '小红书', title: '用Claude Code一天做完了我的毕业设计', author: '码农小李', date: '2026-03-26', likes: 8900, comments: 678, shares: 1200, url: '#' },
      { id: '6', platform: 'B站', title: 'Vibe Coding 会让程序员失业吗？', author: '老胡', date: '2026-03-26', likes: 15600, comments: 2340, shares: 1890, url: '#' },
    ],
    reports: [
      {
        id: '1',
        date: '2026-03-28',
        title: 'Claude Code 选题分析报告',
        summary: '今日关于 Claude Code 的讨论热度较昨日上涨 35%，主要集中在 AI 编程工具测评和职业影响分析两个方向。',
        insights: [
          { type: 'trend', content: 'AI 编程工具类内容持续升温，用户对"替代vs辅助"话题关注度最高' },
          { type: 'hot', content: '"一天完成毕业设计"成为爆款标题，引发大量学生群体共鸣' },
          { type: 'recommendation', content: '建议关注：AI 编程工作流的实际应用场景拆解' },
        ],
        topics: [
          { id: '1', title: 'AI 编程工具平民化', description: '越来越多普通用户开始使用 AI 编程工具完成日常任务，如毕设、脚本编写等。', reason: '工具门槛降低，普通用户也能轻松上手', potential: '覆盖学生、运营、产品等非技术人群，增长空间大' },
          { id: '2', title: '程序员职业焦虑', description: '关于 AI 是否会取代程序员的讨论持续发酵，引发大量程序员群体的关注和讨论。', reason: '技术从业者对职业发展的担忧和思考', potential: '职场/职业发展类内容受众广，易引发共鸣' },
          { id: '3', title: 'Vibe Coding 概念兴起', description: '"Vibe Coding"作为新兴概念，正在获得科技圈的广泛讨论和传播。', reason: '符合当下科技圈对新概念的追捧', potential: '新概念早期红利期，值得重点布局' },
        ],
      },
      {
        id: '2',
        date: '2026-03-27',
        title: '选题洞察日报',
        summary: 'AI 编程相关内容继续保持高热度，海外爆款内容的本土化改编效果显著。',
        insights: [
          { type: 'trend', content: '海外科技内容的本土化改编成为热门内容形式' },
          { type: 'hot', content: '短视频形式的 AI 工具测评比长视频更受欢迎' },
          { type: 'recommendation', content: '建议增加对海外热门内容的跟进速度' },
        ],
        topics: [
          { id: '1', title: 'AI 编程实操教程', description: '从入门到实战的系统性教程类内容。', reason: '用户需求明确，变现路径清晰', potential: '可系列化运营，粉丝粘性高' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Vibe Coding 选题监控',
    platforms: ['抖音', 'B站', '小红书'],
    keywords: ['Vibe Coding', 'AI编程', 'Natural Language Programming'],
    creators: ['老胡', '硅星人家'],
    contents: [
      { id: '7', platform: 'B站', title: '什么是 Vibe Coding？一种全新的编程范式', author: '硅星人家', date: '2026-03-28', likes: 5600, comments: 445, shares: 320, url: '#' },
      { id: '8', platform: '抖音', title: '用说话的方式写代码，Vibe Coding 体验', author: '老胡', date: '2026-03-27', likes: 18900, comments: 1560, shares: 3400, url: '#' },
    ],
    reports: [],
  },
];

const mockTopics: SelectedTopic[] = [
  { id: '1', title: 'Claude Code 实战测评，真的能替代程序员？', source: '小红书', likes: 12580, selected: false },
  { id: '2', title: 'AI编程工具大比拼，Claude Code表现惊艳', source: '抖音', likes: 23400, selected: false },
  { id: '3', title: '程序员职业焦虑：AI是否会取代程序员', source: '微博', likes: 15600, selected: false },
  { id: '4', title: 'Vibe Coding 会让程序员失业吗？', source: 'B站', likes: 15600, selected: false },
  { id: '5', title: '用Claude Code一天做完了我的毕业设计', source: '小红书', likes: 8900, selected: false },
];

interface PublishedArticle {
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

interface ArticleStat {
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

export default function ContentMonitorPage() {
  const [categories, setCategories] = useState<MonitorCategory[]>(mockCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'hotTopics' | 'analysis' | 'topicAnalysis' | 'wechatCollect' | 'wechatAccount' | 'crawler' | 'settings' | 'create' | 'pendingPublish' | 'techniques' | 'analytics' | 'styles' | 'optimization'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-03-28');

  const [wechatAccounts, setWechatAccounts] = useState<WechatAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [imageSources, setImageSources] = useState<ImageSourceConfig>({
    aiGenerated: true,
  });
  const [articleStyle, setArticleStyle] = useState<string>('');
  const [writingStyles, setWritingStyles] = useState<Array<{
    id: number;
    name: string;
    titleStrategy: string;
    openingStyle: string;
    articleFramework: string;
    template: string;
    exampleTitles: string[];
  }>>([]);
  const [topics, setTopics] = useState<SelectedTopic[]>(mockTopics);
  const [articleDrafts, setArticleDrafts] = useState<ArticleDraft[]>([]);
  const [editingAccount, setEditingAccount] = useState<WechatAccount | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'minimax',
    apiKey: '',
    model: 'MiniMax-M2.7',
  });
  const [settingsTab, setSettingsTab] = useState<'wechat' | 'api' | 'menu' | 'prompts'>('wechat');
  const [promptsConfig, setPromptsConfig] = useState<Array<{ key: string; name: string; description: string; template: string }>>([]);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string>('');
  const [menuSettings, setMenuSettings] = useState({
    dashboard: true,
    hotTopics: true,
    crawler: true,
    wechatCollect: true,
    wechatAccount: true,
    topicAnalysis: true,
    create: true,
    pendingPublish: true,
    published: true,
    analytics: true,
  });
  const [menuSettingsSaving, setMenuSettingsSaving] = useState(false);
  const [menuSettingsSaved, setMenuSettingsSaved] = useState(false);

  const loadMenuSettings = async () => {
    try {
      const res = await fetch('/api/app-settings?key=menuSettings');
      const data = await res.json();
      if (data.success && data.value) {
        setMenuSettings(prev => ({ ...prev, ...data.value }));
      }
    } catch (error) {
      console.error('Failed to load menu settings:', error);
    }
  };

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

  const saveMenuSettings = async () => {
    setMenuSettingsSaving(true);
    try {
      const res = await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'menuSettings',
          value: menuSettings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuSettingsSaved(true);
        setTimeout(() => setMenuSettingsSaved(false), 2000);
      } else {
        alert('保存失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to save menu settings:', error);
      alert('保存失败，请重试');
    } finally {
      setMenuSettingsSaving(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [showAddCreatorModalSettings, setShowAddCreatorModalSettings] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCreatorNameSettings, setNewCreatorNameSettings] = useState('');
  const [evaluationInput, setEvaluationInput] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    title: string;
    scores: { heat: number; novelty: number; competition: number; fit: number; total: number };
    painPointLevel: string;
    titleModel: string;
    suggestions: string[];
  } | null>(null);
  const [benchmarkAccounts, setBenchmarkAccounts] = useState<Array<{
    id: number;
    platform: string;
    accountId: string;
    accountName: string;
    followerCount?: number;
    note?: string;
    isLowFollowerViral?: boolean;
  }>>([]);
  const [selectedBenchmarkAccount, setSelectedBenchmarkAccount] = useState<{
    id: number;
    accountName: string;
  } | null>(null);
  const [viralTitles, setViralTitles] = useState<Array<{
    id: number;
    title: string;
    readCount?: number;
    likeCount?: number;
  }>>([]);
  const [showAddBenchmark, setShowAddBenchmark] = useState(false);
  const [showAddViralTitle, setShowAddViralTitle] = useState(false);
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
  const [materials, setMaterials] = useState<Array<{
    id: number;
    type: string;
    source: string;
    title: string;
    content: string;
    keyPoints?: string[];
  }>>([]);
  const [materialType, setMaterialType] = useState<string>('all');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<{
    id: number;
    type: string;
    source: string;
    title: string;
    content: string;
    keyPoints?: string[];
  } | null>(null);

  const loadMaterials = async (type?: string) => {
    try {
      const url = type && type !== 'all' ? `/api/materials?type=${type}` : '/api/materials';
      const res = await fetch(url);
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  const deleteMaterial = async (id: number) => {
    if (!confirm('确定删除此素材？')) return;
    try {
      await fetch(`/api/materials?id=${id}`, { method: 'DELETE' });
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  useEffect(() => {
    loadMaterials(materialType === 'all' ? undefined : materialType);
  }, [materialType]);

  useEffect(() => {
    loadWritingStyles();
  }, []);

  const loadWritingStyles = async () => {
    try {
      const res = await fetch('/api/styles');
      const data = await res.json();
      setWritingStyles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load writing styles:', error);
    }
  };

  const deleteWritingStyle = async (id: number) => {
    if (!confirm('确定删除此写作风格？')) return;
    try {
      await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', styleId: id }),
      });
      setWritingStyles(prev => prev.filter(s => s.id !== id));
      if (articleStyle === String(id)) {
        setArticleStyle('');
      }
    } catch (error) {
      console.error('Delete style error:', error);
    }
  };

  const loadBenchmarkAccounts = async () => {
    try {
      const res = await fetch('/api/benchmark');
      const data = await res.json();
      setBenchmarkAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load benchmark accounts:', error);
    }
  };

  const loadViralTitles = async (accountId: number) => {
    try {
      const res = await fetch(`/api/benchmark?accountId=${accountId}&withTitles=true`);
      const data = await res.json();
      setViralTitles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load viral titles:', error);
    }
  };

  const deleteBenchmarkAccount = async (id: number) => {
    if (!confirm('确定删除此对标账号？')) return;
    try {
      await fetch(`/api/benchmark?type=account&id=${id}`, { method: 'DELETE' });
      setBenchmarkAccounts(prev => prev.filter(a => a.id !== id));
      if (selectedBenchmarkAccount?.id === id) {
        setSelectedBenchmarkAccount(null);
        setViralTitles([]);
      }
    } catch (error) {
      console.error('Failed to delete benchmark account:', error);
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
      setBenchmarkAccounts(prev => [...prev, data]);
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
      alert(`成功导入 ${data.count} 条标题`);
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

  const handleEvaluate = async () => {
    if (!evaluationInput.trim()) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          title: evaluationInput,
        }),
      });
      const data = await res.json();
      setEvaluationResult(data);
    } catch (error) {
      console.error('Evaluation failed:', error);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    loadWechatAccounts();
    loadLLMConfig();
    loadMenuSettings();
    loadImageSources();
  }, []);

  const loadWechatAccounts = async () => {
    try {
      const res = await fetch('/api/wechat-accounts');
      const data = await res.json();
      const accounts = Array.isArray(data) ? data : (data.accounts || []);
      if (accounts.length > 0) {
        const formatted = accounts.map((a: { id: number; name: string; appId: string; appSecret: string; authorName: string; isDefault: boolean }) => ({
          id: String(a.id),
          name: a.name,
          appId: a.appId || '',
          appSecret: a.appSecret || '',
          authorName: a.authorName || '',
          isDefault: a.isDefault || false,
        }));
        setWechatAccounts(formatted);
        const defaultAccount = formatted.find((a: WechatAccount) => a.isDefault);
        setSelectedAccountId(defaultAccount?.id || formatted[0]?.id || '');
      }
    } catch (error) {
      console.error('Failed to load wechat accounts:', error);
    }
  };

  const loadLLMConfig = async () => {
    try {
      const res = await fetch('/api/llm-config');
      const data = await res.json();
      if (data) {
        setLlmConfig({
          provider: (data.provider as LLMConfig['provider']) || 'minimax',
          apiKey: data.apiKey || '',
          model: data.model || 'MiniMax-M2.7',
          baseUrl: data.baseUrl || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to load LLM config:', error);
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const allDates = [...new Set(selectedCategory?.contents.map(c => c.date) || [])].sort().reverse();
  const selectedReport = selectedCategory?.reports.find(r => r.date === selectedDate) || selectedCategory?.reports[0];

  const filteredContents = selectedCategory?.contents.filter(c => {
    if (selectedPlatform && c.platform !== selectedPlatform) return false;
    if (c.date === selectedDate) return true;
    return false;
  }) || [];

  const selectedTopics = topics.filter(t => t.selected);
  const selectedReportTopics = selectedReport?.topics || [];
  const selectedAccount = wechatAccounts.find(a => a.id === selectedAccountId);

  const toggleTopicSelection = (topicId: string) => {
    setTopics(prev => prev.map(t =>
      t.id === topicId ? { ...t, selected: !t.selected } : t
    ));
  };

  const selectAllTopics = () => {
    setTopics(prev => prev.map(t => ({ ...t, selected: true })));
  };

  const deselectAllTopics = () => {
    setTopics(prev => prev.map(t => ({ ...t, selected: false })));
  };

  const generateArticles = async () => {
    if (!llmConfig.apiKey) {
      alert('请先在设置中配置 LLM API Key');
      return;
    }

    const newDrafts: ArticleDraft[] = selectedTopics.map(topic => ({
      topicId: topic.id,
      title: topic.title,
      content: '',
      coverImage: '',
      images: [],
      status: 'generating' as const,
      progress: 0,
    }));
    setArticleDrafts(newDrafts);

    for (let i = 0; i < selectedTopics.length; i++) {
      const topic = selectedTopics[i];
      
      setArticleDrafts(prev => prev.map(d => 
        d.topicId === topic.id ? { ...d, status: 'generating', progress: 10 } : d
      ));

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-article',
            title: topic.title,
            style: articleStyle,
            keywords: [],
            length: 1500,
          }),
        });

        if (!res.ok) {
          throw new Error('生成失败');
        }

        const data = await res.json();
        
        setArticleDrafts(prev => prev.map(d => 
          d.topicId === topic.id ? { 
            ...d, 
            content: data.content,
            status: 'done',
            progress: 100 
          } : d
        ));
      } catch (error) {
        console.error('Failed to generate article:', error);
        setArticleDrafts(prev => prev.map(d => 
          d.topicId === topic.id ? { ...d, status: 'draft', progress: 0 } : d
        ));
      }
    }
  };

  const addWechatAccount = () => {
    const newAccount: WechatAccount = {
      id: generateId(),
      name: '',
      appId: '',
      appSecret: '',
      authorName: '文笙',
      isDefault: false,
    };
    setEditingAccount(newAccount);
    setShowAccountModal(true);
  };

  const editWechatAccount = (account: WechatAccount) => {
    setEditingAccount({ ...account });
    setShowAccountModal(true);
  };

  const saveWechatAccount = async () => {
    if (!editingAccount) return;
    if (editingAccount.name.trim() === '') return;

    setLoading(true);
    try {
      const isNew = !wechatAccounts.find(a => a.id === editingAccount.id);
      
      if (isNew) {
        const res = await fetch('/api/wechat-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editingAccount.name,
            appId: editingAccount.appId,
            appSecret: editingAccount.appSecret,
            authorName: editingAccount.authorName,
            isDefault: editingAccount.isDefault,
          }),
        });
        const data = await res.json();
        if (data) {
          setWechatAccounts(prev => [...prev, {
            id: String(data.id),
            name: data.name,
            appId: data.appId || '',
            appSecret: data.appSecret || '',
            authorName: data.authorName || '',
            isDefault: data.isDefault || false,
          }]);
          if (!selectedAccountId) {
            setSelectedAccountId(String(data.id));
          }
        }
      } else {
        await fetch('/api/wechat-accounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: parseInt(editingAccount.id),
            name: editingAccount.name,
            appId: editingAccount.appId,
            appSecret: editingAccount.appSecret,
            authorName: editingAccount.authorName,
          }),
        });
        setWechatAccounts(prev => prev.map(a => a.id === editingAccount.id ? editingAccount : a));
      }
      setShowAccountModal(false);
      setEditingAccount(null);
    } catch (error) {
      console.error('Failed to save wechat account:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWechatAccount = async (id: string) => {
    try {
      await fetch(`/api/wechat-accounts?id=${id}`, { method: 'DELETE' });
      setWechatAccounts(prev => {
        const filtered = prev.filter(a => a.id !== id);
        if (selectedAccountId === id && filtered.length > 0) {
          setSelectedAccountId(filtered[0].id);
        }
        return filtered;
      });
    } catch (error) {
      console.error('Failed to delete wechat account:', error);
    }
  };

  const setDefaultAccount = async (id: string) => {
    try {
      await fetch('/api/wechat-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(id), setDefault: true }),
      });
      setWechatAccounts(prev => prev.map(a => ({
        ...a,
        isDefault: a.id === id,
      })));
    } catch (error) {
      console.error('Failed to set default account:', error);
    }
  };

  const getStatusText = (status: ArticleDraft['status'], progress: number) => {
    switch (status) {
      case 'draft': return '待生成';
      case 'generating': return `AI生成中... ${progress}%`;
      case 'writing': return `撰写文章中... ${progress}%`;
      case 'humanizing': return `AI去味优化中... ${progress}%`;
      case 'images': return `搜索配图中... ${progress}%`;
      case 'uploading': return `上传到微信... ${progress}%`;
      case 'done': return '已完成';
      case 'error': return '生成失败';
      default: return '未知状态';
    }
  };

  const getStatusColor = (status: ArticleDraft['status']) => {
    switch (status) {
      case 'draft': return '#64748b';
      case 'generating': return '#3b82f6';
      case 'writing': return '#3b82f6';
      case 'humanizing': return '#8b5cf6';
      case 'images': return '#f59e0b';
      case 'uploading': return '#06b6d4';
      case 'done': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div style={styles.layout}>
      <style dangerouslySetInnerHTML={{ __html: safeSanitize(mobileStyles) }} />
      
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
                          <button style={{ ...styles.accountActionBtn, color: '#ef4444' }} onClick={() => deleteWechatAccount(account.id)}>删除</button>
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
                      <label style={styles.formLabel}>API Key</label>
                      <input
                        type="password"
                        style={styles.formInput}
                        placeholder="输入 API Key"
                        value={llmConfig.apiKey}
                        onChange={(e) => setLlmConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      />
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
                          await fetch('/api/llm-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(llmConfig),
                          });
                          alert('配置已保存');
                        } catch (error) {
                          console.error('Failed to save LLM config:', error);
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
                        onClick={saveMenuSettings}
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

        {showAddKeywordModal && (
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
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>🔑 添加关键词</h3>
                <button onClick={() => { setShowAddKeywordModal(false); setNewKeyword(''); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="请输入要监控的关键词..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newKeyword.trim() && selectedCategory) {
                      setCategories(prev => prev.map(cat => {
                        if (cat.id === selectedCategoryId) {
                          return { ...cat, keywords: [...cat.keywords, newKeyword.trim()] };
                        }
                        return cat;
                      }));
                      setShowAddKeywordModal(false);
                      setNewKeyword('');
                    }
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowAddKeywordModal(false); setNewKeyword(''); }}
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
                  onClick={() => {
                    if (newKeyword.trim() && selectedCategory) {
                      setCategories(prev => prev.map(cat => {
                        if (cat.id === selectedCategoryId) {
                          return { ...cat, keywords: [...cat.keywords, newKeyword.trim()] };
                        }
                        return cat;
                      }));
                      setShowAddKeywordModal(false);
                      setNewKeyword('');
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddCreatorModalSettings && (
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
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>👤 添加博主</h3>
                <button onClick={() => { setShowAddCreatorModalSettings(false); setNewCreatorNameSettings(''); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newCreatorNameSettings}
                  onChange={(e) => setNewCreatorNameSettings(e.target.value)}
                  placeholder="请输入博主名称或主页链接..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCreatorNameSettings.trim() && selectedCategory) {
                      setCategories(prev => prev.map(cat => {
                        if (cat.id === selectedCategoryId) {
                          return { ...cat, creators: [...cat.creators, newCreatorNameSettings.trim()] };
                        }
                        return cat;
                      }));
                      setShowAddCreatorModalSettings(false);
                      setNewCreatorNameSettings('');
                    }
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowAddCreatorModalSettings(false); setNewCreatorNameSettings(''); }}
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
                  onClick={() => {
                    if (newCreatorNameSettings.trim() && selectedCategory) {
                      setCategories(prev => prev.map(cat => {
                        if (cat.id === selectedCategoryId) {
                          return { ...cat, creators: [...cat.creators, newCreatorNameSettings.trim()] };
                        }
                        return cat;
                      }));
                      setShowAddCreatorModalSettings(false);
                      setNewCreatorNameSettings('');
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <CreateWorkbench
            llmConfig={llmConfig}
            topics={topics}
            writingStyles={writingStyles}
            onArticleCreated={(article) => {
              // Article created
            }}
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

      {showAccountModal && editingAccount && (
        <div style={styles.modalOverlay} onClick={() => setShowAccountModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {wechatAccounts.find(a => a.id === editingAccount.id) ? '编辑公众号账号' : '新增公众号账号'}
              </h3>
              <button style={styles.modalClose} onClick={() => setShowAccountModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>账号名称 *</label>
                <input
                  type="text"
                  style={styles.formInput}
                  placeholder="如：科技观察、程序员日报"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>AppID</label>
                <input
                  type="text"
                  style={styles.formInput}
                  placeholder="请输入微信公众号 AppID"
                  value={editingAccount.appId}
                  onChange={(e) => setEditingAccount({ ...editingAccount, appId: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>AppSecret</label>
                <input
                  type="password"
                  style={styles.formInput}
                  placeholder="请输入微信公众号 AppSecret"
                  value={editingAccount.appSecret}
                  onChange={(e) => setEditingAccount({ ...editingAccount, appSecret: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>作者名称</label>
                <input
                  type="text"
                  style={styles.formInput}
                  placeholder="默认作者署名"
                  value={editingAccount.authorName}
                  onChange={(e) => setEditingAccount({ ...editingAccount, authorName: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>目标用户群体</label>
                <textarea
                  style={{ ...styles.formInput, minHeight: '60px', resize: 'vertical' }}
                  placeholder="描述您的目标用户群体，如：25-35岁职场人士、科技爱好者、创业者等"
                  value={editingAccount.targetAudience || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, targetAudience: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>读者画像</label>
                <textarea
                  style={{ ...styles.formInput, minHeight: '80px', resize: 'vertical' }}
                  placeholder="详细描述读者画像，如：关注科技趋势、喜欢深度内容、注重实用价值等"
                  value={editingAccount.readerPersona || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, readerPersona: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>内容风格</label>
                <select
                  style={styles.formSelect}
                  value={editingAccount.contentStyle || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, contentStyle: e.target.value })}
                >
                  <option value="">请选择内容风格</option>
                  <option value="专业深度">专业深度</option>
                  <option value="轻松幽默">轻松幽默</option>
                  <option value="干货实用">干货实用</option>
                  <option value="情感共鸣">情感共鸣</option>
                  <option value="故事叙述">故事叙述</option>
                  <option value="资讯速递">资讯速递</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>主要话题领域</label>
                <input
                  type="text"
                  style={styles.formInput}
                  placeholder="用逗号分隔，如：科技,AI,创业,职场"
                  value={(editingAccount.mainTopics || []).join(',')}
                  onChange={(e) => setEditingAccount({ ...editingAccount, mainTopics: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>语言风格偏好</label>
                <select
                  style={styles.formSelect}
                  value={editingAccount.tonePreference || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, tonePreference: e.target.value })}
                >
                  <option value="">请选择语言风格</option>
                  <option value="正式严谨">正式严谨</option>
                  <option value="亲切自然">亲切自然</option>
                  <option value="活泼有趣">活泼有趣</option>
                  <option value="专业权威">专业权威</option>
                  <option value="接地气">接地气</option>
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowAccountModal(false)}>取消</button>
              <button style={styles.saveBtn} onClick={saveWechatAccount}>保存</button>
            </div>
          </div>
        </div>
      )}

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
