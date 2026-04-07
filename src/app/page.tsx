'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CreateWorkbench from './components/CreateWorkbench';
import PendingPublishPage from './components/PendingPublishPage';
import MarkdownEditor from './components/MarkdownEditor';
import OptimizationLoop from './components/OptimizationLoop';
import { htmlToMarkdown, markdownToHtml } from '@/lib/utils/html-markdown';

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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  return num.toString();
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    '抖音': '#ff0050',
    '小红书': '#ff2442',
    '微博': '#ff9900',
    'B站': '#00a1d6',
    '微信公众号': '#07c160',
    '知乎': '#0084ff',
    '快手': '#ff4906',
    '视频号': '#07c160',
  };
  return colors[platform] || '#666';
}

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

function DashboardPage({ setActiveTab }: { setActiveTab: (tab: 'content' | 'hotTopics' | 'analysis' | 'topicAnalysis' | 'wechatCollect' | 'wechatAccount' | 'crawler' | 'settings' | 'create' | 'pendingPublish' | 'techniques' | 'analytics' | 'styles' | 'dashboard') => void }) {
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    pendingDrafts: 0,
    analysisTasks: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [articlesRes, analysisRes] = await Promise.all([
        fetch('/api/published-articles'),
        fetch('/api/analysis'),
      ]);
      const articlesData = await articlesRes.json();
      const analysisData = await analysisRes.json();

      const published = Array.isArray(articlesData) ? articlesData.filter((a: { publishStatus: string }) => a.publishStatus === 'published').length : 0;
      const drafts = Array.isArray(articlesData) ? articlesData.filter((a: { publishStatus: string }) => a.publishStatus === 'draft').length : 0;

      setStats({
        totalArticles: Array.isArray(articlesData) ? articlesData.length : 0,
        publishedArticles: published,
        pendingDrafts: drafts,
        analysisTasks: Array.isArray(analysisData) ? analysisData.length : 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const quickActions: Array<{ icon: string; title: string; desc: string; tab: 'content' | 'hotTopics' | 'analysis' | 'topicAnalysis' | 'wechatCollect' | 'wechatAccount' | 'crawler' | 'settings' | 'create' | 'pendingPublish' | 'techniques' | 'analytics' | 'styles' | 'dashboard' }> = [
    { icon: '📥', title: '文章采集', desc: '采集公众号文章', tab: 'wechatCollect' },
    { icon: '🔍', title: '公众号采集', desc: '搜索公众号与订阅', tab: 'wechatAccount' },
    { icon: '📊', title: '选题分析', desc: '选题评估与分析', tab: 'topicAnalysis' },
    { icon: '✍️', title: '创作工作台', desc: 'AI一键创作文章', tab: 'create' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          欢迎使用内容工作台 👋
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          从选题分析到内容发布，一站式内容创作解决方案
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>总文章数</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>{stats.totalArticles}</div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>已发布</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>{stats.publishedArticles}</div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>草稿箱</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>{stats.pendingDrafts}</div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>分析任务</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>{stats.analysisTasks}</div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>快速入口</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {quickActions.map((action, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setActiveTab(action.tab)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{action.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{action.title}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{action.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>📈 工作流程</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { step: '1', title: '选题分析', desc: '输入关键词，AI分析热点内容' },
              { step: '2', title: '风格拆解', desc: '分析对标账号写作风格' },
              { step: '3', title: '内容创作', desc: 'AI辅助生成高质量文章' },
              { step: '4', title: '发布管理', desc: '一键发布到多个平台' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                }}>{item.step}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>💡 使用技巧</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { tip: '选题分析时，使用具体关键词效果更佳' },
              { tip: '风格拆解需要提供3-5篇对标文章' },
              { tip: '创作时可选择已拆解的写作风格' },
              { tip: '发布前可预览文章效果' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
                <span style={{ fontSize: '13px', color: '#374151' }}>{item.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CrawlerPage() {
  const [activePlatform, setActivePlatform] = useState<string>('xiaohongshu');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [postId, setPostId] = useState('');
  const [searching, setSearching] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [posts, setPosts] = useState<Array<{
    id: number;
    platform: string;
    postId: string;
    title: string | null;
    content: string | null;
    authorName: string | null;
    coverImage: string | null;
    likeCount: number | null;
    commentCount: number | null;
    tags: string[] | null;
  }>>([]);
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null);
  const [comments, setComments] = useState<Array<{
    id: number;
    userName: string | null;
    content: string;
    likeCount: number | null;
    sentiment: string | null;
  }>>([]);
  const [wordCloud, setWordCloud] = useState<{
    totalComments: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    topKeywords: Array<{ word: string; count: number }>;
    topEmojis: Array<{ emoji: string; count: number }>;
    sentimentScore: number;
  } | null>(null);
  const [creators, setCreators] = useState<Array<{
    id: number;
    platform: string;
    creatorId: string;
    name: string;
    followerCount: number | null;
    postCount: number | null;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'detail' | 'creators'>('search');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [platformCookies, setPlatformCookies] = useState<Record<string, string>>({});
  const [currentCookieInput, setCurrentCookieInput] = useState('');
  const [showAddCreatorModal, setShowAddCreatorModal] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');

  const platforms = [
    { id: 'xiaohongshu', name: '小红书', icon: '📕', color: '#ff2442' },
    { id: 'douyin', name: '抖音', icon: '🎵', color: '#000000' },
    { id: 'kuaishou', name: '快手', icon: '⚡', color: '#ff4906' },
    { id: 'bilibili', name: 'B站', icon: '📺', color: '#00a1d6' },
    { id: 'weibo', name: '微博', icon: '📱', color: '#ff8200' },
    { id: 'zhihu', name: '知乎', icon: '💡', color: '#0066ff' },
    { id: 'tieba', name: '贴吧', icon: '💬', color: '#4879bd' },
  ];

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          platform: activePlatform,
          keyword: searchKeyword,
          limit: 20,
          cookie: platformCookies[activePlatform],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
        const message = data.isRealData 
          ? `真实爬取完成，找到 ${data.total} 条内容`
          : `演示数据：找到 ${data.total} 条内容。${data.message || ''}`;
        alert(message);
      } else {
        alert(data.error || '搜索失败');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const handleCrawlPost = async () => {
    if (!postId.trim()) {
      alert('请输入帖子ID');
      return;
    }

    setCrawling(true);
    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crawl-post',
          platform: activePlatform,
          postId: postId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts([data.post]);
        setSelectedPost(data.post);
        alert('爬取成功');
      } else {
        alert(data.error || '爬取失败');
      }
    } catch (error) {
      console.error('Crawl failed:', error);
      alert('爬取失败');
    } finally {
      setCrawling(false);
    }
  };

  const handleCrawlComments = async (post: typeof posts[0]) => {
    setSelectedPost(post);
    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crawl-comments',
          postId: post.id,
          includeReplies: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Crawl comments failed:', error);
    }
  };

  const handleGenerateWordCloud = async () => {
    if (!selectedPost) return;

    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-word-cloud',
          postId: selectedPost.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWordCloud(data.wordCloud);
      }
    } catch (error) {
      console.error('Generate word cloud failed:', error);
    }
  };

  const loadCreators = async () => {
    try {
      const res = await fetch('/api/crawler?action=list-creators');
      const data = await res.json();
      if (data.success) {
        setCreators(data.creators);
      }
    } catch (error) {
      console.error('Load creators failed:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'creators') {
      loadCreators();
    }
  }, [activeTab]);

  const getPlatformInfo = (platformId: string) => {
    return platforms.find(p => p.id === platformId) || platforms[0];
  };

  const formatNumber = (num: number | null) => {
    if (!num) return '0';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            🔍 内容爬取
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            支持小红书、抖音、快手、B站、微博、知乎、贴吧多平台内容爬取
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentCookieInput(platformCookies[activePlatform] || '');
            setShowConfigModal(true);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ⚙️ 配置Cookie
        </button>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: platformCookies[activePlatform] ? '#ecfdf5' : '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{platformCookies[activePlatform] ? '✅' : '⚠️'}</span>
        <span style={{ fontSize: '13px', color: '#374151' }}>
          {platformCookies[activePlatform] 
            ? `${getPlatformInfo(activePlatform).name} Cookie已配置，可进行真实爬取` 
            : `未配置${getPlatformInfo(activePlatform).name} Cookie，当前使用演示数据。点击右上角"配置Cookie"进行设置`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            style={{
              padding: '10px 16px',
              backgroundColor: activePlatform === p.id ? p.color : '#f3f4f6',
              color: activePlatform === p.id ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'search' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'search' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          关键词搜索
        </button>
        <button
          onClick={() => setActiveTab('detail')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'detail' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'detail' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          指定帖子爬取
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'creators' ? '#3b82f6' : '#f3f4f6',
            color: activeTab === 'creators' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          创作者监控
        </button>
      </div>

      {activeTab === 'search' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={`输入关键词搜索${getPlatformInfo(activePlatform).name}内容...`}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                padding: '12px 24px',
                backgroundColor: searching ? '#9ca3af' : getPlatformInfo(activePlatform).color,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: searching ? 'not-allowed' : 'pointer',
              }}
            >
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'detail' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder={`输入${getPlatformInfo(activePlatform).name}帖子ID...`}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleCrawlPost}
              disabled={crawling}
              style={{
                padding: '12px 24px',
                backgroundColor: crawling ? '#9ca3af' : getPlatformInfo(activePlatform).color,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: crawling ? 'not-allowed' : 'pointer',
              }}
            >
              {crawling ? '爬取中...' : '爬取'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'creators' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>已监控创作者</h3>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setShowAddCreatorModal(true);
              }}
            >
              + 添加创作者
            </button>
          </div>
          {creators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              暂无监控的创作者，点击上方按钮添加
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {creators.map(creator => (
                <div key={creator.id} style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '8px' }}>{creator.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    <div>平台：{getPlatformInfo(creator.platform).name}</div>
                    <div>粉丝：{formatNumber(creator.followerCount)}</div>
                    <div>作品：{creator.postCount || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {posts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPost ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                搜索结果 ({posts.length} 条)
              </h3>
              <button
                onClick={() => {
                  alert(`已将 ${posts.length} 条内容加入素材库！`);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                📦 全部加入素材库
              </button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {posts.map(post => (
                <div
                  key={post.id}
                  onClick={() => handleCrawlComments(post)}
                  style={{
                    backgroundColor: selectedPost?.id === post.id ? '#ecfdf5' : '#fff',
                    border: selectedPost?.id === post.id ? '2px solid #22c55e' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {post.coverImage && (
                      <img src={post.coverImage} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '4px', lineHeight: 1.4 }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                        作者：{post.authorName}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                        <span>❤️ {formatNumber(post.likeCount)}</span>
                        <span>💬 {formatNumber(post.commentCount)}</span>
                      </div>
                    </div>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {post.tags.map((tag, i) => (
                        <span key={i} style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px', color: '#6b7280' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedPost && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  评论分析 ({comments.length} 条)
                </h3>
                <button
                  onClick={handleGenerateWordCloud}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  生成词云
                </button>
              </div>

              {wordCloud && (
                <div style={{ backgroundColor: '#faf5ff', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#7c3aed' }}>{wordCloud.totalComments}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>总评论</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#22c55e' }}>{wordCloud.positiveCount}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>正面</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>{wordCloud.negativeCount}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>负面</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#3b82f6' }}>{(wordCloud.sentimentScore * 100).toFixed(0)}%</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>情感分</div>
                    </div>
                  </div>
                  {wordCloud.topKeywords && wordCloud.topKeywords.length > 0 && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>高频词：</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {wordCloud.topKeywords.slice(0, 15).map((kw, i) => (
                          <span key={i} style={{
                            padding: '4px 10px',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#7c3aed',
                            border: '1px solid #e9d5ff',
                          }}>
                            {kw.word} ({kw.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ maxHeight: '400px', overflow: 'auto', display: 'grid', gap: '8px' }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '500', fontSize: '13px', color: '#374151' }}>{comment.userName}</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: comment.sentiment === 'positive' ? '#dcfce7' : comment.sentiment === 'negative' ? '#fee2e2' : '#f3f4f6',
                        color: comment.sentiment === 'positive' ? '#16a34a' : comment.sentiment === 'negative' ? '#dc2626' : '#6b7280',
                      }}>
                        {comment.sentiment === 'positive' ? '正面' : comment.sentiment === 'negative' ? '负面' : '中性'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#4b5563' }}>{comment.content}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>❤️ {comment.likeCount || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {posts.length === 0 && activeTab !== 'creators' && (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            输入关键词或帖子ID开始爬取内容
          </div>
        </div>
      )}

      {showConfigModal && (
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
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>⚙️ Cookie 配置</h3>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '13px', color: '#1e40af' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>📋 如何获取 Cookie：</div>
              <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>打开浏览器，登录 {getPlatformInfo(activePlatform).name} 网站</li>
                <li>按 F12 打开开发者工具</li>
                <li>切换到 Network（网络）标签</li>
                <li>刷新页面，点击任意请求</li>
                <li>在 Headers 中找到 Cookie 字段，复制完整值</li>
              </ol>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                当前平台：{getPlatformInfo(activePlatform).icon} {getPlatformInfo(activePlatform).name}
              </label>
              <textarea
                value={currentCookieInput}
                onChange={(e) => setCurrentCookieInput(e.target.value)}
                placeholder="粘贴 Cookie 值..."
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>已配置的平台：</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {platforms.map(p => (
                  <div key={p.id} style={{
                    padding: '6px 12px',
                    backgroundColor: platformCookies[p.id] ? '#dcfce7' : '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    <span>{platformCookies[p.id] ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfigModal(false)}
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
                  if (currentCookieInput.trim()) {
                    setPlatformCookies(prev => ({
                      ...prev,
                      [activePlatform]: currentCookieInput.trim()
                    }));
                    setShowConfigModal(false);
                    alert(`${getPlatformInfo(activePlatform).name} Cookie 配置成功！`);
                  } else {
                    alert('请输入 Cookie 值');
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
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCreatorModal && (
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
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>👤 添加创作者</h3>
              <button onClick={() => { setShowAddCreatorModal(false); setNewCreatorName(''); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                当前平台：{getPlatformInfo(activePlatform).icon} {getPlatformInfo(activePlatform).name}
              </label>
              <input
                type="text"
                value={newCreatorName}
                onChange={(e) => setNewCreatorName(e.target.value)}
                placeholder="请输入创作者名称或主页链接..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCreatorName.trim()) {
                    const newCreator = {
                      id: Date.now(),
                      creatorId: `creator_${Date.now()}`,
                      name: newCreatorName.trim(),
                      platform: activePlatform,
                      followerCount: Math.floor(Math.random() * 100000) + 1000,
                      postCount: Math.floor(Math.random() * 500) + 10,
                    };
                    setCreators([...creators, newCreator]);
                    setShowAddCreatorModal(false);
                    setNewCreatorName('');
                    alert(`已添加创作者：${newCreatorName.trim()}`);
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAddCreatorModal(false); setNewCreatorName(''); }}
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
                  if (newCreatorName.trim()) {
                    const newCreator = {
                      id: Date.now(),
                      creatorId: `creator_${Date.now()}`,
                      name: newCreatorName.trim(),
                      platform: activePlatform,
                      followerCount: Math.floor(Math.random() * 100000) + 1000,
                      postCount: Math.floor(Math.random() * 500) + 10,
                    };
                    setCreators([...creators, newCreator]);
                    setShowAddCreatorModal(false);
                    setNewCreatorName('');
                    alert(`已添加创作者：${newCreatorName.trim()}`);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
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
    </div>
  );
}

function HotTopicsPage() {
  const [topics, setTopics] = useState<Array<{
    id: number;
    platform: string;
    title: string;
    description: string | null;
    url: string | null;
    hotValue: number | null;
    rank: number | null;
    category: string | null;
    tags: string[] | null;
    trendDirection: string | null;
    predictedGrowth: number | null;
    isBlackHorse: boolean | null;
  }>>([]);
  const [blackHorses, setBlackHorses] = useState<typeof topics>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(new Set());
  const [rewriting, setRewriting] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState('热点评论');
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<{
    title: string;
    content: string;
    aiScore: number;
    humanScore: number;
    wordCount: number;
  } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [platformCookies, setPlatformCookies] = useState<Record<string, string>>({});
  const [currentCookieInput, setCurrentCookieInput] = useState('');
  const [activeConfigPlatform, setActiveConfigPlatform] = useState('weibo');
  const [collectingTopicId, setCollectingTopicId] = useState<number | null>(null);
  const [collectingMessage, setCollectingMessage] = useState<string>('');
  const [collectedTopicIds, setCollectedTopicIds] = useState<Set<number>>(new Set());

  const hotPlatforms = [
    { id: 'weibo', name: '微博', icon: '📱', color: '#ff8200' },
    { id: 'douyin', name: '抖音', icon: '🎵', color: '#000000' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕', color: '#ff2442' },
    { id: 'zhihu', name: '知乎', icon: '💡', color: '#0066ff' },
    { id: 'baidu', name: '百度', icon: '🔍', color: '#2932e1' },
  ];

  const getHotPlatformInfo = (platformId: string) => {
    return hotPlatforms.find(p => p.id === platformId) || hotPlatforms[0];
  };

  useEffect(() => {
    loadTopics();
    loadBlackHorses();
  }, [selectedPlatform]);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const url = selectedPlatform === 'all' 
        ? '/api/hot-topics?action=list&limit=50'
        : `/api/hot-topics?action=list&platform=${selectedPlatform}&limit=50`;
      const res = await fetch(url);
      const data = await res.json();
      setTopics(data);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlackHorses = async () => {
    try {
      const res = await fetch('/api/hot-topics?action=black-horses');
      const data = await res.json();
      setBlackHorses(data);
    } catch (error) {
      console.error('Failed to load black horses:', error);
    }
  };

  const fetchAllPlatforms = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/hot-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'fetch-all',
          cookies: platformCookies,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const message = data.isRealData 
          ? `成功获取 ${data.total} 条真实热点数据`
          : `演示数据：获取 ${data.total} 条热点。${data.message || '配置 Cookie 后可获取真实数据'}`;
        alert(message);
        loadTopics();
        loadBlackHorses();
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      alert('获取失败');
    } finally {
      setFetching(false);
    }
  };

  const toggleTopicSelection = (topicId: number) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId);
    } else {
      newSelected.add(topicId);
    }
    setSelectedTopics(newSelected);
  };

  const selectAllVisible = () => {
    const allIds = topics.map(t => t.id);
    setSelectedTopics(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedTopics(new Set());
  };

  const collectTopicMaterials = async (topic: typeof topics[0]) => {
    setCollectingTopicId(topic.id);
    setCollectingMessage('正在搜索相关文章...');

    try {
      const res = await fetch('/api/hot-topic-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collect-single',
          data: { topic },
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setCollectingMessage(`成功采集 ${data.materials.length} 条素材`);
        setCollectedTopicIds(prev => new Set([...prev, topic.id]));
        setTimeout(() => {
          setCollectingTopicId(null);
          setCollectingMessage('');
        }, 2000);
      } else {
        alert(data.message || '采集失败');
        setCollectingTopicId(null);
        setCollectingMessage('');
      }
    } catch (error) {
      console.error('Collect materials failed:', error);
      alert('采集失败，请检查网络连接');
      setCollectingTopicId(null);
      setCollectingMessage('');
    }
  };

  const collectBatchMaterials = async () => {
    if (selectedTopics.size === 0) {
      alert('请先选择要采集的热点');
      return;
    }

    const selectedTopicsList = topics.filter(t => selectedTopics.has(t.id));
    setCollectingMessage(`正在采集 ${selectedTopicsList.length} 个热点的素材...`);

    try {
      const res = await fetch('/api/hot-topic-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collect-batch',
          data: { topics: selectedTopicsList },
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        const newCollectedIds = new Set(collectedTopicIds);
        selectedTopicsList.forEach(t => newCollectedIds.add(t.id));
        setCollectedTopicIds(newCollectedIds);
      } else {
        alert('批量采集失败');
      }
    } catch (error) {
      console.error('Batch collect failed:', error);
      alert('批量采集失败');
    } finally {
      setCollectingMessage('');
    }
  };

  const handleRewrite = async () => {
    if (selectedTopics.size === 0) {
      alert('请先选择要融合的热点');
      return;
    }

    setRewriting(true);
    setShowRewriteModal(true);
    setRewriteResult(null);

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rewrite-from-topics',
          topicIds: Array.from(selectedTopics),
          style: rewriteStyle,
          removeAI: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRewriteResult({
          title: data.article.title,
          content: data.article.content,
          aiScore: data.stats.aiScore,
          humanScore: data.stats.humanScore,
          wordCount: data.stats.wordCount,
        });
      } else {
        alert(data.error || '生成失败');
        setShowRewriteModal(false);
      }
    } catch (error) {
      console.error('Rewrite failed:', error);
      alert('生成失败，请检查LLM配置');
      setShowRewriteModal(false);
    } finally {
      setRewriting(false);
    }
  };

  const formatHotValue = (value: number | null) => {
    if (!value) return '-';
    if (value >= 10000000) return (value / 10000000).toFixed(1) + '千万';
    if (value >= 10000) return (value / 10000).toFixed(1) + '万';
    return value.toString();
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      weibo: '📱',
      douyin: '🎵',
      xiaohongshu: '📕',
      zhihu: '💡',
      baidu: '🔍',
    };
    return icons[platform] || '📰';
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      weibo: '#ff8200',
      douyin: '#000000',
      xiaohongshu: '#ff2442',
      zhihu: '#0066ff',
      baidu: '#2932e1',
    };
    return colors[platform] || '#6b7280';
  };

  const platforms = [
    { id: 'all', name: '全部', icon: '🔥' },
    { id: 'weibo', name: '微博', icon: '📱' },
    { id: 'douyin', name: '抖音', icon: '🎵' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕' },
    { id: 'zhihu', name: '知乎', icon: '💡' },
    { id: 'baidu', name: '百度', icon: '🔍' },
  ];

  const styles = ['热点评论', '深度分析', '情感共鸣', '干货分享', '故事叙述', '综合类'];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            🔥 全网热点聚合
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            实时聚合微博、抖音、小红书、知乎、百度热搜
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowConfigModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ⚙️ 配置Cookie
          </button>
          <button
            onClick={fetchAllPlatforms}
            disabled={fetching}
            style={{
              padding: '10px 20px',
              backgroundColor: fetching ? '#9ca3af' : '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: fetching ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {fetching ? '获取中...' : '🔄 刷新热点'}
          </button>
          {selectedTopics.size > 0 && (
            <button
              onClick={handleRewrite}
              disabled={rewriting}
              style={{
                padding: '10px 20px',
                backgroundColor: rewriting ? '#9ca3af' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: rewriting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ✨ AI融合洗稿 ({selectedTopics.size})
            </button>
          )}
        </div>
      </div>

      {blackHorses.length > 0 && (
        <div style={{ marginBottom: '24px', backgroundColor: '#fef3c7', borderRadius: '12px', padding: '16px', border: '1px solid #fcd34d' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '12px' }}>
            🐴 黑马预测（预计12小时内爆发）
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {blackHorses.slice(0, 5).map((topic) => (
              <div 
                key={topic.id} 
                onClick={() => toggleTopicSelection(topic.id)}
                style={{ 
                  backgroundColor: selectedTopics.has(topic.id) ? '#dcfce7' : '#fff', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  minWidth: '200px', 
                  flex: 1,
                  cursor: 'pointer',
                  border: selectedTopics.has(topic.id) ? '2px solid #22c55e' : '2px solid transparent',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                  {topic.title}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                  <span>{getPlatformIcon(topic.platform)} {topic.platform}</span>
                  <span style={{ color: '#ef4444' }}>↑ {topic.predictedGrowth?.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlatform(p.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedPlatform === p.id ? '#3b82f6' : '#f3f4f6',
              color: selectedPlatform === p.id ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={selectAllVisible}
          style={{
            padding: '6px 12px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          全选
        </button>
        <button
          onClick={clearSelection}
          style={{
            padding: '6px 12px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          清空
        </button>
      </div>

      {selectedTopics.size > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: '#059669', fontWeight: '500' }}>已选择 {selectedTopics.size} 个热点</span>
          <button
            onClick={() => {
              const selectedTopicsList = topics.filter(t => selectedTopics.has(t.id));
              const titles = selectedTopicsList.map(t => t.title).join('\n');
              alert(`已将 ${selectedTopicsList.length} 个选题加入选题库！\n\n${titles}`);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            📌 加入选题
          </button>
          <select
            value={rewriteStyle}
            onChange={(e) => setRewriteStyle(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
            }}
          >
            {styles.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleRewrite}
            disabled={rewriting}
            style={{
              padding: '8px 16px',
              backgroundColor: rewriting ? '#9ca3af' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: rewriting ? 'not-allowed' : 'pointer',
            }}
          >
            {rewriting ? '生成中...' : '✨ 融合洗稿'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px' }}>
          <div style={{ fontSize: '24px' }}>⏳ 加载中...</div>
        </div>
      ) : topics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
            暂无热点数据，点击"刷新热点"获取最新数据
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {topics.map((topic, index) => (
            <div 
              key={topic.id} 
              onClick={() => toggleTopicSelection(topic.id)}
              style={{ 
                backgroundColor: selectedTopics.has(topic.id) ? '#ecfdf5' : '#fff', 
                borderRadius: '12px', 
                border: selectedTopics.has(topic.id) ? '2px solid #22c55e' : '1px solid #e5e7eb', 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: index < 3 ? '#fef3c7' : '#f3f4f6',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '600',
                color: index < 3 ? '#92400e' : '#6b7280',
              }}>
                {topic.rank || index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>{getPlatformIcon(topic.platform)}</span>
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937' }}>{topic.title}</span>
                  {topic.isBlackHorse && (
                    <span style={{ padding: '2px 6px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '11px' }}>🐴 黑马</span>
                  )}
                  {topic.trendDirection === 'up' && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>↑ 上升</span>
                  )}
                </div>
                {topic.description && (
                  <div style={{ fontSize: '13px', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {topic.description}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: getPlatformColor(topic.platform) }}>
                  {formatHotValue(topic.hotValue)}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {topic.category}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  collectTopicMaterials(topic);
                }}
                disabled={collectingTopicId === topic.id || collectedTopicIds.has(topic.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: collectedTopicIds.has(topic.id) ? '#22c55e' : (collectingTopicId === topic.id ? '#9ca3af' : '#8b5cf6'),
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: collectingTopicId === topic.id || collectedTopicIds.has(topic.id) ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {collectedTopicIds.has(topic.id) ? '✓ 已采集' : (collectingTopicId === topic.id ? '采集中...' : '📦 采集素材')}
              </button>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: selectedTopics.has(topic.id) ? '2px solid #22c55e' : '2px solid #d1d5db',
                backgroundColor: selectedTopics.has(topic.id) ? '#22c55e' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#fff',
              }}>
                {selectedTopics.has(topic.id) && '✓'}
              </div>
            </div>
          ))}
        </div>
      )}

      {showRewriteModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                ✨ AI融合洗稿结果
              </h2>
              <button
                onClick={() => setShowRewriteModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f3f4f6',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
              {rewriting ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                  <div style={{ color: '#6b7280' }}>AI正在融合洗稿中...</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>
                    正在调用LLM生成内容并去除AI味
                  </div>
                </div>
              ) : rewriteResult ? (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>字数</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#059669' }}>{rewriteResult.wordCount}</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>AI味评分</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#d97706' }}>{rewriteResult.aiScore.toFixed(0)}%</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px', flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>人性化评分</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#2563eb' }}>{rewriteResult.humanScore.toFixed(0)}%</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>标题</div>
                    <div style={{ fontSize: '16px', color: '#374151', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      {rewriteResult.title}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>正文</div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#374151', 
                      padding: '16px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.8,
                      maxHeight: '400px',
                      overflow: 'auto',
                    }}>
                      {rewriteResult.content}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {rewriteResult && (
              <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(rewriteResult.content);
                    alert('已复制到剪贴板');
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
                  📋 复制内容
                </button>
                <button
                  onClick={() => setShowRewriteModal(false)}
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
                  完成
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showConfigModal && (
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
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>⚙️ 热点平台 Cookie 配置</h3>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '13px', color: '#1e40af' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>📋 如何获取 Cookie：</div>
              <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>打开浏览器，登录目标平台网站</li>
                <li>按 F12 打开开发者工具</li>
                <li>切换到 Network（网络）标签</li>
                <li>刷新页面，点击任意请求</li>
                <li>在 Headers 中找到 Cookie 字段，复制完整值</li>
              </ol>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>选择平台：</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hotPlatforms.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveConfigPlatform(p.id);
                      setCurrentCookieInput(platformCookies[p.id] || '');
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: activeConfigPlatform === p.id ? p.color : '#f3f4f6',
                      color: activeConfigPlatform === p.id ? '#fff' : '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                {getHotPlatformInfo(activeConfigPlatform).icon} {getHotPlatformInfo(activeConfigPlatform).name} Cookie：
              </label>
              <textarea
                value={currentCookieInput}
                onChange={(e) => setCurrentCookieInput(e.target.value)}
                placeholder="粘贴 Cookie 值..."
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>已配置状态：</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hotPlatforms.map(p => (
                  <div key={p.id} style={{
                    padding: '6px 12px',
                    backgroundColor: platformCookies[p.id] ? '#dcfce7' : '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    <span>{platformCookies[p.id] ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfigModal(false)}
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
                  if (currentCookieInput.trim()) {
                    setPlatformCookies(prev => ({
                      ...prev,
                      [activeConfigPlatform]: currentCookieInput.trim()
                    }));
                    alert(`${getHotPlatformInfo(activeConfigPlatform).name} Cookie 配置成功！`);
                  } else {
                    alert('请输入 Cookie 值');
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
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
          console.log('评论获取提示:', data.message);
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
                          backgroundColor: exportingArticles ? '#e5e7eb' : '#3b82f6',
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
                                  backgroundColor: '#3b82f6',
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
                              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
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
                          backgroundColor: expandedArticle === article.id ? '#3b82f6' : '#f3f4f6',
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
                          backgroundColor: copyingField?.articleId === article.id && copyingField.field === 'content' ? '#10b981' : '#3b82f6',
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
                            color: '#3b82f6',
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
                    const res = await fetch(`/api/wechat-collect?action=delete-article&articleId=${deletingArticleId}`);
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
                    backgroundColor: isFullscreenEdit ? '#3b82f6' : '#f3f4f6',
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
                  dangerouslySetInnerHTML={{ __html: editingArticle.contentHtml }}
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
                  style={{ padding: '10px 16px', backgroundColor: parsingUrl ? '#9ca3af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: parsingUrl ? 'not-allowed' : 'pointer' }}
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
                  backgroundColor: authMode === 'cookie' ? '#3b82f6' : '#f3f4f6', 
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
                  <p>1. 登录 <a href="https://mp.weixin.qq.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>微信公众平台</a></p>
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

function TopicAnalysisPage() {
  const [articles, setArticles] = useState<Array<{
    id: number;
    title: string;
    author: string | null;
    digest: string | null;
    content: string | null;
    publishTime: string | null;
    readCount: number;
    likeCount: number;
    commentCount: number;
    recommendCount: number;
    shareCount: number;
    engagementRate: number;
    sourceUrl: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    insights: string[];
    topicSuggestions: Array<{ title: string; reason: string; potential: string }>;
    contentTrends: string[];
    audienceInsights: string[];
  } | null>(null);
  const [llmConfig, setLlmConfig] = useState<{
    provider: string;
    apiKey: string;
    model: string;
    baseUrl?: string | null;
  } | null>(null);
  const [stats, setStats] = useState({
    totalArticles: 0,
    avgReadCount: 0,
    avgLikeCount: 0,
    avgEngagementRate: 0,
  });
  const [wordCloud, setWordCloud] = useState<Array<{ word: string; count: number }>>([]);
  const [cacheKey, setCacheKey] = useState<string>('');
  const [publishTimeDistribution, setPublishTimeDistribution] = useState<Array<{ hour: number; count: number }>>([]);

  const calculatePublishTimeDistribution = (articleList: Array<{ publishTime: string | null }>) => {
    const distribution: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      distribution[i] = 0;
    }
    
    articleList.forEach(article => {
      if (article.publishTime) {
        try {
          const date = new Date(article.publishTime);
          const hour = date.getHours();
          distribution[hour]++;
        } catch (e) {
          console.error('Invalid publishTime:', article.publishTime);
        }
      }
    });
    
    const result = Object.entries(distribution).map(([hour, count]) => ({
      hour: parseInt(hour, 10),
      count,
    }));
    
    setPublishTimeDistribution(result);
  };

  useEffect(() => {
    loadArticles();
    loadLLMConfig();
  }, []);

  const loadLLMConfig = async () => {
    try {
      const res = await fetch('/api/llm-config');
      const config = await res.json();
      if (config) {
        setLlmConfig({
          provider: (config.provider as LLMConfig['provider']) || 'minimax',
          apiKey: config.apiKey || '',
          model: config.model || 'MiniMax-M2.7',
          baseUrl: config.baseUrl || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to load LLM config:', error);
    }
  };

  const calculateEngagementRate = (article: { readCount: number; likeCount: number; commentCount: number; recommendCount: number; shareCount: number }) => {
    if (article.readCount <= 0) return 0;
    return Number(((article.commentCount + article.shareCount + article.likeCount + article.recommendCount) / article.readCount * 100).toFixed(2));
  };

  const generateCacheKey = (articleList: Array<{ id: number; updatedAt?: string }>) => {
    const ids = articleList.map(a => a.id).sort((a, b) => a - b).join('-');
    return `wordcloud-${ids}`;
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wechat-collect?action=list-articles&pageSize=100');
      const data = await res.json();
      const articleList = Array.isArray(data) ? data : [];
      setArticles(articleList);
      
      calculatePublishTimeDistribution(articleList);
      
      const key = generateCacheKey(articleList);
      setCacheKey(key);
      
      const validArticles = articleList.filter((a: { readCount: number; likeCount: number; recommendCount: number; shareCount: number }) => 
        a.readCount > 0 || a.likeCount > 0 || a.recommendCount > 0 || a.shareCount > 0
      );
      
      if (validArticles.length > 0) {
        const totalRead = validArticles.reduce((sum: number, a: { readCount: number }) => sum + (a.readCount || 0), 0);
        const totalLike = validArticles.reduce((sum: number, a: { likeCount: number }) => sum + (a.likeCount || 0), 0);
        
        let totalEngagement = 0;
        validArticles.forEach((a: { readCount: number; likeCount: number; commentCount: number; recommendCount: number; shareCount: number }) => {
          totalEngagement += calculateEngagementRate(a);
        });
        
        setStats({
          totalArticles: validArticles.length,
          avgReadCount: Math.round(totalRead / validArticles.length),
          avgLikeCount: Math.round(totalLike / validArticles.length),
          avgEngagementRate: Number((totalEngagement / validArticles.length).toFixed(2)),
        });
      } else {
        setStats({
          totalArticles: articleList.length,
          avgReadCount: 0,
          avgLikeCount: 0,
          avgEngagementRate: 0,
        });
      }
      
      const cacheRes = await fetch('/api/topic-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-wordcloud-cache', cacheKey: key }),
      });
      const cacheData = await cacheRes.json();
      
      if (cacheData.cache?.basicWordCloud && cacheData.cache.basicWordCloud.length > 0) {
        setWordCloud(cacheData.cache.basicWordCloud);
      } else {
        const articlesForSegment = articleList.map((a: { title: string; digest: string | null; content: string | null }) => ({
          title: a.title,
          digest: a.digest,
          content: a.content,
        }));
        
        const segmentRes = await fetch('/api/segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articles: articlesForSegment }),
        });
        
        const segmentData = await segmentRes.json();
        if (segmentData.success && segmentData.wordCloud) {
          setWordCloud(segmentData.wordCloud);
          
          await fetch('/api/topic-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'save-basic-wordcloud', 
              cacheKey: key, 
              wordCloud: segmentData.wordCloud,
              articles: articleList.map((a: { id: number; title: string; readCount: number; likeCount: number }) => ({
                title: a.title,
                readCount: a.readCount,
                likeCount: a.likeCount,
              })),
            }),
          });
        }
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWordCloud = (articleList: Array<{ title: string; digest: string | null; content: string | null }>) => {
    const stopWords = new Set([
      '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
      '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '他', '她', '它', '这个', '那个', '可以', '没', '啊', '呢',
      '吧', '吗', '哦', '嗯', '哈', '啦', '呀', '哪', '怎', '么', '还', '能', '让', '把', '被', '比', '更', '最', '但', '而',
      '或', '与', '及', '等', '对', '为', '以', '从', '向', '于', '给', '之', '其', '者', '所', '即', '如', '若', '虽', '则',
      '因为', '所以', '如果', '虽然', '但是', '然而', '而且', '或者', '以及', '对于', '关于', '通过', '进行', '已经', '正在',
      '将', '会', '可能', '应该', '需要', '必须', '能够', '可以', '这个', '那个', '这些', '那些', '这样', '那样', '如此',
      '我们', '你们', '他们', '她们', '它们', '大家', '自己', '别人', '他人', '某', '每', '各', '某', '本', '该', '此',
      '来', '起来', '出来', '进来', '回来', '过来', '上去', '下来', '进去', '回去', '过去', '开来',
      '得', '地', '着', '过', '了', '呢', '吗', '吧', '啊', '呀', '哦', '嗯', '哈', '啦', '嘞', '喽', '嘛', '么',
      '一点', '一些', '一下', '一直', '一起', '一切', '一边', '一面', '一时', '一样', '一再', '一味',
      '就是', '只是', '还是', '总是', '都是', '就有', '都有', '才是', '也是', '就有', '又有', '还有',
      '不是', '没', '别', '莫', '勿', '休', '甭', '不用', '不要', '不会', '不能', '不可', '不敢', '不该',
      '这种', '那种', '哪种', '这种', '那种', '各种', '某种', '某种', '任何', '所有', '全部', '部分',
      '之后', '之前', '以后', '以前', '以上', '以下', '之间', '之内', '之外', '之中', '当中', '其中',
      '其实', '实际', '确实', '真的', '真是', '真是', '当然', '固然', '虽然', '即使', '尽管', '哪怕',
      '比如', '例如', '譬如', '诸如', '像是', '好像', '仿佛', '似乎', '简直', '几乎', '差不多',
      '然后', '接着', '于是', '因此', '所以', '因而', '从而', '进而', '继而', '随后', '随即',
      '这里', '那里', '哪里', '这边', '那边', '哪边', '这儿', '那儿', '哪儿', '此处', '彼处',
      '现在', '当时', '此时', '彼时', '当时', '那时', '何时', '有时', '随时', '同时', '届时',
      '怎样', '怎么', '如何', '何如', '为何', '何故', '何必', '何不', '何曾', '何尝', '何须',
      '多少', '几', '几个', '几时', '几许', '几何', '若干', '多少', '多', '少', '大', '小', '长', '短', '高', '低', '远', '近',
      '第一', '第二', '第三', '首先', '其次', '再次', '最后', '最终', '最初', '起初', '开始', '结束',
      '爸爸', '妈妈', '儿子', '女儿', '哥哥', '姐姐', '弟弟', '妹妹', '爷爷', '奶奶', '外公', '外婆',
      '特别', '非常', '十分', '相当', '比较', '稍微', '略微', '有些', '有点', '颇为', '甚为',
      '拼命', '一阵子', '别急', '急着', '点击', '名片', '关注', '公众号', '微信', '朋友圈', '转发', '点赞', '收藏',
    ]);

    const blackPatterns = [
      /点击名片/g, /关注我们/g, /扫码关注/g, /长按识别/g, /二维码/g,
      /转发给/g, /分享给/g, /点赞.*在看/g, /点击.*阅读/g,
      /更多精彩/g, /推荐阅读/g, /相关文章/g, /往期回顾/g,
      /本文来源/g, /作者简介/g, /版权声明/g, /免责声明/g,
      /商务合作/g, /联系方式/g, /投稿邮箱/g,
    ];

    const cleanText = (text: string): string => {
      let cleaned = text;
      blackPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });
      return cleaned;
    };

    const isValidWord = (word: string): boolean => {
      if (word.length < 2 || word.length > 6) return false;
      if (stopWords.has(word)) return false;
      if (/^\d+$/.test(word)) return false;
      if (/^[a-zA-Z]+$/.test(word)) return false;
      if (/(.)\1{2,}/.test(word)) return false;
      if (/^[的一是不了在人有我这个]/.test(word)) return false;
      if (/[的一是不了在人有我这个]$/.test(word)) return false;
      return true;
    };

    const wordCount: Record<string, number> = {};
    
    articleList.forEach(article => {
      const title = cleanText(article.title || '');
      const digest = cleanText(article.digest || '');
      const content = cleanText((article.content || '').substring(0, 800));
      
      const titleWords = title.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
      const digestWords = digest.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
      const contentWords = content.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
      
      titleWords.forEach(word => {
        if (isValidWord(word)) {
          wordCount[word] = (wordCount[word] || 0) + 3;
        }
      });
      
      digestWords.forEach(word => {
        if (isValidWord(word)) {
          wordCount[word] = (wordCount[word] || 0) + 2;
        }
      });
      
      contentWords.forEach(word => {
        if (isValidWord(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });
    
    const minCount = Math.max(2, Math.floor(articleList.length * 0.1));
    
    return Object.entries(wordCount)
      .filter(([_, count]) => count >= minCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({ word, count }));
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const topLikesArticles = articles
    .filter(a => a.likeCount > 0)
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5);

  const topEngagementArticles = articles
    .filter(a => a.readCount > 0 && (a.likeCount > 0 || a.recommendCount > 0 || a.shareCount > 0 || a.commentCount > 0))
    .map(a => ({ ...a, calculatedEngagementRate: calculateEngagementRate(a) }))
    .sort((a, b) => b.calculatedEngagementRate - a.calculatedEngagementRate)
    .slice(0, 5);

  const maxWordCount = Math.max(...(wordCloud.map(w => w.count) || [1]));

  const runAIAnalysis = async () => {
    if (!llmConfig) {
      alert('请先配置MiniMax API');
      return;
    }
    
    setAnalyzing(true);
    setAiAnalysis(null);
    
    try {
      const res = await fetch('/api/topic-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          articles: articles.map(a => ({
            title: a.title,
            author: a.author,
            readCount: a.readCount,
            likeCount: a.likeCount,
            commentCount: a.commentCount,
            recommendCount: a.recommendCount,
            shareCount: a.shareCount,
            publishTime: a.publishTime,
            digest: a.digest,
          })),
          wordCloud,
        }),
      });
      
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAiAnalysis(data);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('分析失败，请检查API配置');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
          📊 选题分析
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          基于文章采集的数据进行分析，请在文章库中补充阅读量、点赞数、互动率等数据
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <span style={{ fontSize: '24px' }}>⏳ 加载中...</span>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '16px', 
            marginBottom: '24px' 
          }}>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              padding: '20px', 
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>
                {stats.totalArticles}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>已分析文章</div>
            </div>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              padding: '20px', 
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                {formatNumber(stats.avgReadCount)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>平均阅读量</div>
            </div>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              padding: '20px', 
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>
                {formatNumber(stats.avgLikeCount)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>平均点赞数</div>
            </div>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              padding: '20px', 
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>
                {stats.avgEngagementRate}%
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>平均互动率</div>
            </div>
          </div>

          {stats.totalArticles === 0 && (
            <div style={{ 
              backgroundColor: '#fef3c7', 
              borderRadius: '12px', 
              padding: '24px', 
              marginBottom: '24px',
              border: '1px solid #f59e0b',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>暂无有效数据</div>
                  <div style={{ fontSize: '14px', color: '#92400e' }}>
                    请先在「文章库」中为文章补充阅读量、点赞数、互动率等数据，然后刷新本页面查看分析结果
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                ❤️ 点赞 TOP5
              </h3>
              {topLikesArticles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topLikesArticles.map((article, i) => (
                    <div key={article.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', minWidth: 0 }}>
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '6px',
                        backgroundColor: i === 0 ? '#fef3c7' : i === 1 ? '#e5e7eb' : i === 2 ? '#fed7aa' : '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {article.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{article.author || '未知作者'}</div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444', flexShrink: 0 }}>
                        ❤️ {formatNumber(article.likeCount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  暂无点赞数据，请在文章库中补充
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                📈 互动率 TOP5
              </h3>
              {topEngagementArticles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topEngagementArticles.map((article, i) => (
                    <div key={article.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', minWidth: 0 }}>
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '6px',
                        backgroundColor: i === 0 ? '#dcfce7' : i === 1 ? '#e5e7eb' : i === 2 ? '#fef3c7' : '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {article.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{article.author || '未知作者'}</div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981', flexShrink: 0 }}>
                        {article.calculatedEngagementRate.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  暂无互动率数据，请在文章库中补充
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  ☁️ 高频词云
                </h3>
              </div>
              
              {wordCloud.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '20px' }}>
                  {wordCloud.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        fontSize: `${12 + (item.count / maxWordCount) * 16}px`,
                        fontWeight: item.count > maxWordCount * 0.5 ? '600' : '400',
                        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
                        backgroundColor: `${['#eff6ff', '#ecfdf5', '#fffbeb', '#fef2f2', '#f5f3ff', '#fdf2f8'][i % 6]}`,
                        borderRadius: '20px',
                      }}
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  暂无词云数据
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  📊 发布时间分布
                </h3>
              </div>
              
              {publishTimeDistribution.length > 0 ? (
                <div style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '4px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                    {publishTimeDistribution.map((item, i) => {
                      const maxCount = Math.max(...publishTimeDistribution.map(d => d.count), 1);
                      const height = Math.max(4, (item.count / maxCount) * 140);
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{ 
                            width: '100%', 
                            height: `${height}px`,
                            backgroundColor: item.count > 0 ? '#3b82f6' : '#e5e7eb',
                            borderRadius: '2px 2px 0 0',
                            transition: 'height 0.3s',
                            position: 'relative',
                          }}>
                            {item.count > 0 && (
                              <div style={{ 
                                position: 'absolute', 
                                top: '-20px', 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                fontSize: '10px', 
                                color: '#3b82f6',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                              }}>
                                {item.count}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
                            {item.hour}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
                    <span>0时</span>
                    <span>6时</span>
                    <span>12时</span>
                    <span>18时</span>
                    <span>24时</span>
                  </div>
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>
                      📈 发布时间分析
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {(() => {
                        const peakHours = publishTimeDistribution.filter(h => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
                        if (peakHours.length === 0) return '暂无数据';
                        const total = publishTimeDistribution.reduce((sum, h) => sum + h.count, 0);
                        const peakStr = peakHours.map(h => `${h.hour}(${h.count}篇)`).join('、');
                        return `高峰时段: ${peakStr}，共${total}篇文章`;
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  暂无发布时间数据
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                🤖 AI 智能分析
              </h3>
              <button
                onClick={runAIAnalysis}
                disabled={analyzing || stats.totalArticles === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: analyzing || stats.totalArticles === 0 ? '#9ca3af' : '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: analyzing || stats.totalArticles === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {analyzing ? '⏳ 分析中...' : '🚀 开始AI分析'}
              </button>
            </div>
            
            {!llmConfig && (
              <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#92400e' }}>
                  ⚠️ 请先在「系统设置」中配置 MiniMax API
                </div>
              </div>
            )}
            
            {analyzing && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                <div>AI 正在分析文章数据，请稍候...</div>
              </div>
            )}
            
            {aiAnalysis && !analyzing && (
              <div>
                <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '16px', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>📊 分析摘要</div>
                  <div style={{ fontSize: '14px', color: '#15803d', lineHeight: '1.6' }}>{aiAnalysis.summary}</div>
                </div>
                
                {aiAnalysis.insights.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>💡 核心洞察</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {aiAnalysis.insights.map((insight, i) => (
                        <li key={i} style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {aiAnalysis.topicSuggestions.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>✨ 推荐选题</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {aiAnalysis.topicSuggestions.map((topic, i) => (
                        <div key={i} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{topic.title}</span>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              backgroundColor: topic.potential === '高' ? '#dcfce7' : topic.potential === '中' ? '#fef3c7' : '#fee2e2',
                              color: topic.potential === '高' ? '#166534' : topic.potential === '中' ? '#92400e' : '#991b1b',
                            }}>
                              潜力：{topic.potential}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{topic.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiAnalysis.contentTrends.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>📈 内容趋势</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {aiAnalysis.contentTrends.map((trend, i) => (
                        <span key={i} style={{ padding: '4px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '16px', fontSize: '12px' }}>
                          {trend}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiAnalysis.audienceInsights.length > 0 && (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>👥 读者洞察</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {aiAnalysis.audienceInsights.map((insight, i) => (
                        <li key={i} style={{ fontSize: '13px', color: '#4b5563' }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {!aiAnalysis && !analyzing && stats.totalArticles > 0 && llmConfig && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
                <div>点击「开始AI分析」按钮，使用 {llmConfig.model || '已配置的模型'} 分析文章数据</div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                📋 文章列表（{articles.length}篇）
              </h3>
              <button
                onClick={loadArticles}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                🔄 刷新数据
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflow: 'auto' }}>
              {articles.slice(0, 20).map(article => (
                <div 
                  key={article.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {article.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {article.author || '未知作者'} · {article.publishTime ? new Date(article.publishTime).toLocaleDateString('zh-CN') : '未知时间'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                    <span>👁 {formatNumber(article.readCount || 0)}</span>
                    <span>❤️ {formatNumber(article.likeCount || 0)}</span>
                    <span style={{ color: calculateEngagementRate(article) > 0 ? '#10b981' : '#9ca3af' }}>
                      {calculateEngagementRate(article) > 0 ? `${calculateEngagementRate(article).toFixed(2)}%` : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StyleAnalyzerPage() {
  const [writingStyles, setWritingStyles] = useState<Array<{
    id: number;
    name: string;
    titleStrategy: string;
    openingStyle: string;
    articleFramework: string;
    template: string;
    exampleTitles: string[];
  }>>([]);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [styleInputArticles, setStyleInputArticles] = useState<Array<{ title: string; content: string }>>([
    { title: '', content: '' }
  ]);
  const [styleAnalysisResult, setStyleAnalysisResult] = useState<{
    titleStrategy: string;
    openingStyle: string;
    articleFramework: string;
    contentProgression: string;
    endingDesign: string;
    languageStyle: string;
    emotionalHooks: string[];
    articleType: string;
    template: string;
    exampleTitles: string[];
    suggestedName: string;
  } | null>(null);
  const [newStyleName, setNewStyleName] = useState('');
  const [showAnalyzer, setShowAnalyzer] = useState(false);

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

  const analyzeWritingStyle = async () => {
    const validArticles = styleInputArticles.filter(a => a.title.trim() && a.content.trim());
    if (validArticles.length === 0) {
      alert('请至少输入一篇完整的文章（标题+正文）');
      return;
    }
    setAnalyzingStyle(true);
    try {
      const res = await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          articles: validArticles,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setStyleAnalysisResult(data.analysis);
        setNewStyleName(data.analysis.suggestedName || '自定义风格');
      } else {
        alert(data.error || '分析失败');
      }
    } catch (error) {
      console.error('Style analysis error:', error);
      alert('分析失败，请重试');
    } finally {
      setAnalyzingStyle(false);
    }
  };

  const saveWritingStyle = async () => {
    if (!newStyleName.trim()) {
      alert('请输入风格名称');
      return;
    }
    if (!styleAnalysisResult) {
      alert('请先分析文章');
      return;
    }
    try {
      const res = await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          name: newStyleName,
          analysis: styleAnalysisResult,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('风格保存成功！');
        loadWritingStyles();
        setStyleAnalysisResult(null);
        setStyleInputArticles([{ title: '', content: '' }]);
        setNewStyleName('');
        setShowAnalyzer(false);
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save style error:', error);
      alert('保存失败');
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
    } catch (error) {
      console.error('Delete style error:', error);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
            ✨ AI 风格拆解
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            投喂对标账号爆款文章，AI 自动拆解可复制的写作风格模板
          </p>
        </div>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={() => setShowAnalyzer(true)}
        >
          ✨ 新建风格拆解
        </button>
      </div>

      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '1px solid #fcd34d' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
          📖 使用方法
        </h4>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#78350f', lineHeight: '1.8' }}>
          <li>找到对标账号的 1-5 篇爆款文章</li>
          <li>粘贴文章标题和正文内容</li>
          <li>AI 自动分析标题策略、开头方式、文章框架、结尾设计等</li>
          <li>生成可复制的写作模板，保存后可在创作时使用</li>
        </ol>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
        {writingStyles.length > 0 ? (
          writingStyles.map(style => (
            <div
              key={style.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb',
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  {style.name}
                </h3>
                <button
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: '#ef4444',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => deleteWritingStyle(style.id)}
                >
                  删除
                </button>
              </div>
              
              {style.titleStrategy && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>标题策略</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{style.titleStrategy}</div>
                </div>
              )}
              
              {style.template && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>写作模板</div>
                  <pre style={{
                    margin: 0,
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                    maxHeight: '120px',
                    overflow: 'auto',
                  }}>
                    {style.template}
                  </pre>
                </div>
              )}

              {style.exampleTitles && style.exampleTitles.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>示例标题</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {style.exampleTitles.slice(0, 3).map((title, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3e8ff',
                          color: '#7c3aed',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            color: '#6b7280',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>暂无风格模板</div>
            <div style={{ fontSize: '13px' }}>点击右上角「新建风格拆解」开始创建</div>
          </div>
        )}
      </div>

      {showAnalyzer && (
        <div
          style={{
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
          }}
          onClick={() => setShowAnalyzer(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              width: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>✨ AI 风格拆解</h3>
              <button
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
                onClick={() => setShowAnalyzer(false)}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>输入文章（最多5篇）</label>
                  {styleInputArticles.length < 5 && (
                    <button
                      style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={() => setStyleInputArticles(prev => [...prev, { title: '', content: '' }])}
                    >
                      + 添加文章
                    </button>
                  )}
                </div>
                {styleInputArticles.map((article, index) => (
                  <div key={index} style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>文章 {index + 1}</span>
                      {styleInputArticles.length > 1 && (
                        <button
                          style={{ padding: '2px 8px', fontSize: '11px', color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                          onClick={() => setStyleInputArticles(prev => prev.filter((_, i) => i !== index))}
                        >
                          删除
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
                      placeholder="文章标题"
                      value={article.title}
                      onChange={(e) => setStyleInputArticles(prev => prev.map((a, i) => i === index ? { ...a, title: e.target.value } : a))}
                    />
                    <textarea
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' }}
                      placeholder="粘贴文章正文内容..."
                      value={article.content}
                      onChange={(e) => setStyleInputArticles(prev => prev.map((a, i) => i === index ? { ...a, content: e.target.value } : a))}
                    />
                  </div>
                ))}
              </div>

              {styleAnalysisResult && (
                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#166534' }}>
                    📊 分析结果
                  </h4>
                  <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <strong>标题策略：</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#4b5563' }}>{styleAnalysisResult.titleStrategy}</p>
                    </div>
                    <div>
                      <strong>开头引入：</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#4b5563' }}>{styleAnalysisResult.openingStyle}</p>
                    </div>
                    <div>
                      <strong>文章框架：</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#4b5563' }}>{styleAnalysisResult.articleFramework}</p>
                    </div>
                    <div>
                      <strong>结尾设计：</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#4b5563' }}>{styleAnalysisResult.endingDesign}</p>
                    </div>
                    <div>
                      <strong>语言风格：</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#4b5563' }}>{styleAnalysisResult.languageStyle}</p>
                    </div>
                    {styleAnalysisResult.emotionalHooks?.length > 0 && (
                      <div>
                        <strong>情绪钩子：</strong>
                        <ul style={{ margin: '4px 0 0 16px', color: '#4b5563' }}>
                          {styleAnalysisResult.emotionalHooks.map((hook, i) => (
                            <li key={i}>{hook}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <strong>写作模板：</strong>
                      <pre style={{
                        margin: '4px 0 0 0',
                        padding: '12px',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                      }}>
                        {styleAnalysisResult.template}
                      </pre>
                    </div>
                    {styleAnalysisResult.exampleTitles?.length > 0 && (
                      <div>
                        <strong>示例标题：</strong>
                        <ul style={{ margin: '4px 0 0 16px', color: '#4b5563' }}>
                          {styleAnalysisResult.exampleTitles.map((title, i) => (
                            <li key={i}>{title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #86efac' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>风格名称</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                      placeholder="给这个风格起个名字"
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                onClick={() => {
                  setShowAnalyzer(false);
                  setStyleAnalysisResult(null);
                  setStyleInputArticles([{ title: '', content: '' }]);
                }}
              >
                取消
              </button>
              {!styleAnalysisResult ? (
                <button
                  style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', opacity: analyzingStyle ? 0.6 : 1 }}
                  onClick={analyzeWritingStyle}
                  disabled={analyzingStyle}
                >
                  {analyzingStyle ? '分析中...' : '开始分析'}
                </button>
              ) : (
                <button
                  style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                  onClick={saveWritingStyle}
                >
                  保存风格
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsPanel() {
  const [analyticsData, setAnalyticsData] = useState<{
    totalArticles: number;
    analyzedArticles: number;
    pendingSuggestions: number;
    avgPerformanceRatio: number;
    topArticles: Array<{
      id: number;
      title: string;
      readCount: number;
      likeCount: number;
      sourceReadCount: number;
      performanceRatio: number;
      publishTime: Date | null;
    }>;
    gapAnalysis: Array<{
      gapType: string;
      count: number;
      avgPerformance: number;
    }>;
    recentSuggestions: Array<{
      id: number;
      gapType: string;
      suggestion: string;
      priority: string;
      status: string;
      createdAt: string;
    }>;
  }>({
    totalArticles: 0,
    analyzedArticles: 0,
    pendingSuggestions: 0,
    avgPerformanceRatio: 0,
    topArticles: [],
    gapAnalysis: [],
    recentSuggestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [statsRes, articlesRes, suggestionsRes] = await Promise.all([
        fetch('/api/optimization-loop?action=stats'),
        fetch('/api/optimization-loop?action=list'),
        fetch('/api/optimization-loop?action=suggestions'),
      ]);

      const statsData = await statsRes.json();
      const articlesData = await articlesRes.json();
      const suggestionsData = await suggestionsRes.json();

      const articles = articlesData.articles || [];
      const suggestions = suggestionsData.suggestions || [];

      const topArticles = articles
        .filter((a: { sourceContentId: number | null }) => a.sourceContentId)
        .sort((a: { performanceRatio: number }, b: { performanceRatio: number }) => (b.performanceRatio || 0) - (a.performanceRatio || 0))
        .slice(0, 5)
        .map((a: { 
          id: number; 
          title: string; 
          readCount: number; 
          likeCount: number; 
          sourceReadCount: number;
          publishTime: Date | null;
        }) => ({
          ...a,
          performanceRatio: a.sourceReadCount > 0 ? Math.round((a.readCount / a.sourceReadCount) * 100 * 100) / 100 : 0,
        }));

      const gapTypeMap = new Map<string, { count: number; totalPerformance: number }>();
      suggestions.forEach((s: { gapType: string; performanceRatio: number }) => {
        const existing = gapTypeMap.get(s.gapType) || { count: 0, totalPerformance: 0 };
        gapTypeMap.set(s.gapType, {
          count: existing.count + 1,
          totalPerformance: existing.totalPerformance + (s.performanceRatio || 0),
        });
      });

      const gapAnalysis = Array.from(gapTypeMap.entries()).map(([gapType, data]) => ({
        gapType,
        count: data.count,
        avgPerformance: Math.round((data.totalPerformance / data.count) * 100) / 100,
      }));

      const recentSuggestions = suggestions
        .filter((s: { status: string }) => s.status === 'pending')
        .slice(0, 5);

      setAnalyticsData({
        totalArticles: statsData.totalArticles || 0,
        analyzedArticles: statsData.analyzedArticles || 0,
        pendingSuggestions: statsData.pendingSuggestions || 0,
        avgPerformanceRatio: statsData.avgPerformanceRatio || 0,
        topArticles,
        gapAnalysis,
        recentSuggestions,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const gapTypeLabels: Record<string, string> = {
    title: '标题',
    opening: '开头',
    content: '内容',
    structure: '结构',
    ending: '结尾',
  };

  const priorityColors: Record<string, string> = {
    high: '#ff4d4f',
    medium: '#fa8c16',
    low: '#52c41a',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
            📊 闭环优化数据分析
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            追踪改写文章表现，分析优化效果，持续提升内容质量
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: dateRange === range ? '#3b82f6' : '#fff',
                color: dateRange === range ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {range === '7d' ? '近7天' : range === '30d' ? '近30天' : '近90天'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>
          加载中...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  📝
                </div>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>已发布文章</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
                {analyticsData.totalArticles}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                篇（关联原文）
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🔍
                </div>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>已分析</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
                {analyticsData.analyzedArticles}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                篇
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  💡
                </div>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>待审核建议</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
                {analyticsData.pendingSuggestions}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                条
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  📈
                </div>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>平均表现比率</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
                {analyticsData.avgPerformanceRatio}%
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                改写/原文
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                🏆 表现最佳文章 TOP 5
              </h3>
              {analyticsData.topArticles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analyticsData.topArticles.map((article, index) => (
                    <div
                      key={article.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: index === 0 ? '#fef3c7' : index === 1 ? '#e5e7eb' : index === 2 ? '#fed7aa' : '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                          {article.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          原文: {formatNumber(article.sourceReadCount)} → 改写: {formatNumber(article.readCount)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: article.performanceRatio > 50 ? '#10b981' : article.performanceRatio > 20 ? '#f59e0b' : '#ef4444' }}>
                          {article.performanceRatio}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>表现比率</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>
                  暂无关联原文的文章数据，请先在「闭环优化」中添加已发布文章
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                📊 差距维度分布
              </h3>
              {analyticsData.gapAnalysis.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analyticsData.gapAnalysis.map((gap, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', color: '#374151' }}>{gapTypeLabels[gap.gapType] || gap.gapType}</span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{gap.count}条</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${(gap.count / Math.max(...analyticsData.gapAnalysis.map(g => g.count))) * 100}%`,
                              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>
                  暂无差距分析数据
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              💡 待审核优化建议
            </h3>
            {analyticsData.recentSuggestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analyticsData.recentSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: `${priorityColors[suggestion.priority]}20`,
                        color: priorityColors[suggestion.priority],
                      }}
                    >
                      {suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        【{gapTypeLabels[suggestion.gapType] || suggestion.gapType}】
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                        {suggestion.suggestion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>
                暂无待审核的优化建议
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PublishedArticlesPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<PublishedArticle | null>(null);
  const [stats, setStats] = useState<ArticleStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/published-articles');
      const data = await res.json();
      setArticles(data || []);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (articleId: number) => {
    try {
      const res = await fetch(`/api/published-articles?articleId=${articleId}&stats=true`);
      const data = await res.json();
      setStats(data || []);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      published: { backgroundColor: '#dcfce7', color: '#16a34a' },
      draft: { backgroundColor: '#fef3c7', color: '#d97706' },
      failed: { backgroundColor: '#fee2e2', color: '#dc2626' },
    };
    const labels: Record<string, string> = {
      published: '已发布',
      draft: '草稿',
      failed: '发布失败',
    };
    return (
      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', ...styles[status] }}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
          📤 已发布文章
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          管理已发布的文章，追踪阅读量、点赞、评论等数据增长
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          加载中...
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p>暂无已发布的文章</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>在"创作发布"页面创建并发布文章后，将在这里显示</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedArticle ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {articles.map(article => (
              <div
                key={article.id}
                onClick={() => {
                  setSelectedArticle(article);
                  loadStats(article.id);
                }}
                style={{
                  padding: '16px',
                  backgroundColor: '#fff',
                  border: selectedArticle?.id === article.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', flex: 1, marginRight: '12px' }}>
                    {article.title}
                  </h3>
                  {getStatusBadge(article.publishStatus)}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                  <span>📅 {formatDate(article.publishTime || article.createdAt)}</span>
                  {article.wechatArticleUrl && (
                    <a
                      href={article.wechatArticleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      查看文章 →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedArticle && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                📊 数据统计
              </h3>
              
              {stats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                  暂无统计数据
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#3b82f6' }}>
                        {stats[0]?.readCount || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>阅读量</div>
                      {stats[0]?.readGrowth !== undefined && stats[0].readGrowth > 0 && (
                        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                          ↑ +{stats[0].readGrowth}
                        </div>
                      )}
                    </div>
                    <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
                        {stats[0]?.likeCount || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>点赞数</div>
                      {stats[0]?.likeGrowth !== undefined && stats[0].likeGrowth > 0 && (
                        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                          ↑ +{stats[0].likeGrowth}
                        </div>
                      )}
                    </div>
                    <div style={{ backgroundColor: '#dcfce7', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#16a34a' }}>
                        {stats[0]?.commentCount || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>评论数</div>
                    </div>
                    <div style={{ backgroundColor: '#fce7f3', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#db2777' }}>
                        {stats[0]?.shareCount || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>分享数</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#374151' }}>
                      历史记录
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {stats.map((stat, index) => (
                        <div
                          key={stat.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: index < stats.length - 1 ? '1px solid #f3f4f6' : 'none',
                            fontSize: '12px',
                          }}
                        >
                          <span style={{ color: '#6b7280' }}>{formatDate(stat.recordTime)}</span>
                          <span style={{ color: '#374151' }}>
                            阅读 {stat.readCount} · 点赞 {stat.likeCount} · 评论 {stat.commentCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface WritingTechnique {
  id: number;
  category: string;
  stage: string;
  title: string;
  content: string;
  examples: string | null;
  formulas: string | null;
  checklists: string[] | null;
  priority: number;
  isActive: boolean;
}

interface TechniqueCategory {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

function WritingTechniquesPage() {
  const [techniques, setTechniques] = useState<WritingTechnique[]>([]);
  const [categories, setCategories] = useState<TechniqueCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [editingTechnique, setEditingTechnique] = useState<Partial<WritingTechnique> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const stages = ['选题', '标题', '开头', '正文', '结尾', '去AI味'];

  useEffect(() => {
    loadTechniques();
    loadCategories();
  }, []);

  const loadTechniques = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStage !== 'all') params.append('stage', selectedStage);
      const res = await fetch(`/api/writing-techniques?${params.toString()}`);
      const data = await res.json();
      setTechniques(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load techniques:', error);
      setTechniques([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/writing-techniques?categories=true');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const saveTechnique = async () => {
    if (!editingTechnique) return;
    setLoading(true);
    try {
      const method = editingTechnique.id ? 'PUT' : 'POST';
      await fetch('/api/writing-techniques', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTechnique),
      });
      setShowModal(false);
      setEditingTechnique(null);
      loadTechniques();
    } catch (error) {
      console.error('Failed to save technique:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTechnique = async (id: number) => {
    if (!confirm('确定要删除这条技巧吗？')) return;
    try {
      await fetch(`/api/writing-techniques?id=${id}`, { method: 'DELETE' });
      loadTechniques();
    } catch (error) {
      console.error('Failed to delete technique:', error);
    }
  };

  const getCategoryName = (code: string) => {
    const cat = categories.find(c => c.code === code);
    return cat?.name || code;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
            📚 创作技巧管理
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            管理文章创作的技巧库，包括选题、标题、开头、正文、结尾等各阶段的写作方法
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTechnique({ category: 'general', stage: '选题', title: '', content: '', priority: 0, isActive: true });
            setShowModal(true);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          + 新增技巧
        </button>
        <button
          onClick={async () => {
            if (!confirm('确定要导入SOP数据吗？这将会添加预设的创作技巧。')) return;
            setLoading(true);
            try {
              const res = await fetch('/api/writing-techniques/init', { method: 'POST' });
              const data = await res.json();
              alert(data.message || '导入完成');
              loadTechniques();
              loadCategories();
            } catch (error) {
              console.error('Failed to import SOP:', error);
              alert('导入失败');
            } finally {
              setLoading(false);
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          📥 导入SOP
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            minWidth: '150px',
          }}
        >
          <option value="all">全部分类</option>
          {categories.map(cat => (
            <option key={cat.code} value={cat.code}>{cat.name}</option>
          ))}
        </select>
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            minWidth: '150px',
          }}
        >
          <option value="all">全部阶段</option>
          {stages.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
        <button
          onClick={loadTechniques}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          刷新
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>加载中...</div>
      ) : techniques.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <p>暂无技巧数据</p>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#9ca3af' }}>点击"新增技巧"添加创作技巧，或导入SOP内容</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {techniques.map(technique => (
            <div
              key={technique.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>
                      {technique.stage}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#f3e8ff',
                      color: '#7c3aed',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>
                      {getCategoryName(technique.category)}
                    </span>
                    {!technique.isActive && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        已禁用
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{technique.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setEditingTechnique(technique);
                      setShowModal(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteTechnique(technique.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {technique.content}
              </div>
              {technique.formulas && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '500', marginBottom: '4px' }}>📐 公式</div>
                  <div style={{ fontSize: '13px', color: '#78350f' }}>{technique.formulas}</div>
                </div>
              )}
              {technique.examples && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#166534', fontWeight: '500', marginBottom: '4px' }}>💡 示例</div>
                  <div style={{ fontSize: '13px', color: '#15803d', whiteSpace: 'pre-wrap' }}>{technique.examples}</div>
                </div>
              )}
              {technique.checklists && technique.checklists.length > 0 && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '500', marginBottom: '8px' }}>✅ 检查清单</div>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {technique.checklists.map((item, idx) => (
                      <li key={idx} style={{ fontSize: '13px', color: '#1e40af', marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && editingTechnique && (
        <div
          style={{
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
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              width: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              {editingTechnique.id ? '编辑技巧' : '新增技巧'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>阶段 *</label>
                <select
                  value={editingTechnique.stage || ''}
                  onChange={(e) => setEditingTechnique({ ...editingTechnique, stage: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                >
                  {stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>分类 *</label>
                <select
                  value={editingTechnique.category || ''}
                  onChange={(e) => setEditingTechnique({ ...editingTechnique, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                >
                  <option value="general">通用</option>
                  {categories.map(cat => (
                    <option key={cat.code} value={cat.code}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>标题 *</label>
                <input
                  type="text"
                  value={editingTechnique.title || ''}
                  onChange={(e) => setEditingTechnique({ ...editingTechnique, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  placeholder="技巧名称"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>内容 *</label>
                <textarea
                  value={editingTechnique.content || ''}
                  onChange={(e) => setEditingTechnique({ ...editingTechnique, content: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minHeight: '100px' }}
                  placeholder="技巧详细说明"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>公式</label>
                <input
                  type="text"
                  value={editingTechnique.formulas || ''}
                  onChange={(e) => setEditingTechnique({ ...editingTechnique, formulas: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  placeholder="如：痛点 + 解决方案 + 行动号召"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>示例</label>
                <textarea
                  value={editingTechnique.examples || ''}
                  onChange={(e) => setEditingTechnique({ ...editingTechnique, examples: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minHeight: '80px' }}
                  placeholder="具体示例"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>检查清单（每行一条）</label>
                <textarea
                  value={(editingTechnique.checklists || []).join('\n')}
                  onChange={(e) => setEditingTechnique({ ...editingTechnique, checklists: e.target.value.split('\n').filter(Boolean) })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minHeight: '80px' }}
                  placeholder="每行一条检查项"
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>优先级</label>
                  <input
                    type="number"
                    value={editingTechnique.priority || 0}
                    onChange={(e) => setEditingTechnique({ ...editingTechnique, priority: parseInt(e.target.value) || 0 })}
                    style={{ width: '100px', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    checked={editingTechnique.isActive ?? true}
                    onChange={(e) => setEditingTechnique({ ...editingTechnique, isActive: e.target.checked })}
                  />
                  <label style={{ fontSize: '14px' }}>启用</label>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={saveTechnique}
                disabled={loading}
                style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
              console.log('Article created:', article);
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

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f6f8',
  },
  sidebar: {
    width: '200px',
    backgroundColor: '#1e293b',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
  },
  logo: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  tabSection: {
    padding: '16px',
    flex: 1,
    overflowY: 'auto',
  },
  tabItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '10px',
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
  },
  tabItemActive: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    color: '#60a5fa',
  },
  tabIcon: {
    fontSize: '16px',
    minWidth: '16px',
    textAlign: 'center',
  },
  menuGroup: {
    marginTop: '16px',
    marginBottom: '8px',
  },
  menuGroupTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '8px 12px 4px',
  },
  subMenuItem: {
    padding: '10px 12px 10px 24px',
    fontSize: '13px',
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  scheduleHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748b',
  },
  scheduleIcon: {
    fontSize: '14px',
  },
  main: {
    flex: 1,
    padding: '24px',
    marginLeft: '200px',
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh',
  },
  mobileHeader: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 16px',
    zIndex: 1001,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileMenuBtn: {
    width: '40px',
    height: '40px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  mobileTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  categorySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
  categoryLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  categoryChips: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  categoryChip: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    border: '1px solid #3b82f6',
    color: '#fff',
  },
  contentWrapper: {
    maxWidth: '1200px',
  },
  evaluationSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
  },
  sectionDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '20px',
  },
  evaluationInput: {
    display: 'flex',
    gap: '12px',
  },
  evaluationInputField: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  evaluationBtn: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  evaluationResult: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  scoreTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  totalScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  totalScoreValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#3b82f6',
  },
  totalScoreLabel: {
    fontSize: '16px',
    color: '#64748b',
  },
  scoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  scoreLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  scoreBar: {
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  scoreValue: {
    fontSize: '12px',
    color: '#64748b',
  },
  evaluationMeta: {
    display: 'flex',
    gap: '24px',
    marginBottom: '20px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  metaLabel: {
    fontSize: '13px',
    color: '#64748b',
  },
  metaValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1e293b',
  },
  painPointBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
  },
  suggestions: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  suggestionsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '12px',
  },
  suggestionsList: {
    margin: 0,
    padding: '0 0 0 20px',
    listStyle: 'disc',
  },
  suggestionItem: {
    fontSize: '13px',
    color: '#374151',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  benchmarkSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  benchmarkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  benchmarkCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  benchmarkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  benchmarkAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  benchmarkInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  benchmarkName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  benchmarkPlatform: {
    fontSize: '12px',
    color: '#64748b',
  },
  lowFollowerBadge: {
    padding: '4px 8px',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    fontSize: '10px',
    fontWeight: '600',
    borderRadius: '4px',
  },
  benchmarkStats: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '8px',
  },
  benchmarkNote: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  benchmarkActions: {
    display: 'flex',
    gap: '8px',
  },
  benchmarkActionBtn: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#3b82f6',
    cursor: 'pointer',
  },
  emptyBenchmark: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '40px',
    color: '#94a3b8',
    textAlign: 'center',
  },
  viralTitlesSection: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  viralTitlesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  viralTitlesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  viralTitleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  viralTitleContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  viralTitleText: {
    fontSize: '13px',
    color: '#1e293b',
    lineHeight: '1.4',
  },
  viralTitleStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#64748b',
  },
  useTitleBtn: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  materialSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  materialTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  materialTab: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  materialTabActive: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  materialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  materialCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  materialHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  materialTypeBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#fff',
  },
  materialSource: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  materialTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0',
    lineHeight: '1.4',
  },
  materialContent: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: '0 0 12px 0',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  materialPoints: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '12px',
  },
  materialPoint: {
    fontSize: '12px',
    color: '#475569',
    lineHeight: '1.4',
  },
  materialActions: {
    display: 'flex',
    gap: '8px',
  },
  materialActionBtn: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#3b82f6',
    cursor: 'pointer',
  },
  emptyMaterial: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '40px',
    color: '#94a3b8',
    textAlign: 'center',
    gridColumn: '1 / -1',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '24px 0',
  },
  toolbar: {
    marginBottom: '20px',
  },
  platformFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  platformChip: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  platformChipActive: {
    backgroundColor: '#1e293b',
    border: '1px solid #1e293b',
    color: '#fff',
  },
  dateTimeline: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  dateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    minWidth: '80px',
  },
  dateCardActive: {
    border: '2px solid #3b82f6',
    backgroundColor: '#eff6ff',
  },
  dateDay: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
  },
  dateMonth: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  dateCount: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  contentArea: {},
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  contentTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  contentCount: {
    fontSize: '13px',
    color: '#64748b',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  platformTag: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
  },
  deepFetchBtn: {
    padding: '4px 10px',
    backgroundColor: '#8b5cf6',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  cardMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '12px',
  },
  cardStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#64748b',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px',
  },
  emptyHint: {
    fontSize: '14px',
    color: '#6b7280',
  },
  analysisHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    gap: '16px',
  },
  reportTabs: {
    display: 'flex',
    gap: '12px',
  },
  reportTab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px',
  },
  reportTabActive: {
    border: '2px solid #8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  reportDate: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  reportPreview: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '4px',
  },
  generateBtn: {
    padding: '12px 24px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  reportContent: {},
  reportHeader: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  },
  reportTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
  },
  reportSummary: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.7',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
  },
  insightBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '12px',
  },
  insightText: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.6',
    margin: 0,
  },
  topicsSection: {},
  topicsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
  },
  topicsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '16px',
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  topicTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
  },
  topicDesc: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  topicMeta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  topicMetaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  topicMetaLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#94a3b8',
  },
  topicMetaValue: {
    fontSize: '12px',
    color: '#374151',
    lineHeight: '1.5',
  },
  createArticleBtn: {
    marginTop: '16px',
    padding: '8px 16px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  settingsHeader: {
    marginBottom: '24px',
  },
  settingsPageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  settingsTabNav: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '0',
  },
  settingsTab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    borderRadius: '0',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '-2px',
  },
  settingsTabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
  },
  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  configForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    outline: 'none',
    backgroundColor: '#fff',
  },
  settingsCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  settingsCardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
  },
  addBtn: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
  },
  creatorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  creatorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  creatorAvatar: {
    fontSize: '18px',
  },
  creatorName: {
    flex: 1,
    fontSize: '13px',
    color: '#374151',
  },
  removeBtn: {
    width: '20px',
    height: '20px',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '50%',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  scheduleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  scheduleLabel: {
    color: '#64748b',
  },
  scheduleValue: {
    color: '#374151',
    fontWeight: '500',
  },
  runBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  accountList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  accountItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  accountName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  defaultBadge: {
    fontSize: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '8px',
  },
  accountId: {
    fontSize: '11px',
    color: '#64748b',
  },
  accountActions: {
    display: 'flex',
    gap: '8px',
  },
  accountActionBtn: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#64748b',
    cursor: 'pointer',
  },
  emptyAccount: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748b',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#3b82f6',
  },
  createHeader: {
    marginBottom: '24px',
  },
  createTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px',
  },
  createSubtitle: {
    fontSize: '14px',
    color: '#64748b',
  },
  createConfigSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  createConfigCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  createConfigTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '12px',
  },
  configSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    outline: 'none',
  },
  accountInfoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '12px',
    fontSize: '12px',
    color: '#64748b',
  },
  llmProvider: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
  },
  llmModel: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '8px',
  },
  imageSourcesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  sourceTag: {
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#374151',
  },
  chainSelector: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  chainOption: {
    padding: '20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    transition: 'all 0.2s',
  },
  chainOptionActive: {
    border: '2px solid #8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  chainRadioLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
  },
  chainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  chainName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  chainDesc: {
    fontSize: '12px',
    color: '#64748b',
  },
  radio: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    marginTop: '2px',
  },
  chainConfig: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  configRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  configLabel: {
    width: '80px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  configInput: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    flex: 1,
  },
  styleButtons: {
    display: 'flex',
    gap: '8px',
  },
  styleBtn: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
  },
  styleBtnActive: {
    backgroundColor: '#8b5cf6',
    border: '1px solid #8b5cf6',
    color: '#fff',
  },
  chainInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#3b82f6',
  },
  chainInfoIcon: {
    fontSize: '18px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionActions: {
    display: 'flex',
    gap: '8px',
  },
  selectAllBtn: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#64748b',
    cursor: 'pointer',
  },
  topicsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
  },
  topicSelectCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  topicSelectCardActive: {
    border: '2px solid #8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  topicCheckbox: {
    width: '22px',
    height: '22px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    color: '#8b5cf6',
    fontWeight: '700',
    fontSize: '14px',
  },
  topicInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  topicSelectTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
  },
  topicSource: {
    fontSize: '12px',
    color: '#64748b',
  },
  batchActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  selectedCount: {
    fontSize: '14px',
    color: '#64748b',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  draftsSection: {
    marginTop: '24px',
  },
  draftsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  draftCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  draftHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  draftTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  draftStatus: {
    fontSize: '12px',
    fontWeight: '500',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  draftActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
  },
  previewBtn: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
  uploadBtn: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
  },
  modalOverlay: {
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
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '480px',
    maxWidth: '90vw',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  modalClose: {
    width: '32px',
    height: '32px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '20px',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#fff',
    cursor: 'pointer',
  },
};

const mobileStyles = `
  @media (max-width: 768px) {
    [data-mobile-sidebar] { display: none !important; }
    [data-mobile-header] { display: flex !important; }
    [data-mobile-main] { 
      margin-left: 0 !important; 
      padding: 16px !important;
      padding-top: 72px !important;
    }
    [data-mobile-card] { 
      padding: 16px !important;
    }
    [data-mobile-grid] {
      grid-template-columns: 1fr !important;
    }
    [data-mobile-flex-col] {
      flex-direction: column !important;
    }
    [data-mobile-full-width] {
      width: 100% !important;
    }
    [data-mobile-hide] {
      display: none !important;
    }
    [data-mobile-text-center] {
      text-align: center !important;
    }
    [data-mobile-font-sm] {
      font-size: 12px !important;
    }
    [data-mobile-p-sm] {
      padding: 8px 12px !important;
    }
    [data-mobile-gap-sm] {
      gap: 8px !important;
    }
  }
  
  @media (max-width: 480px) {
    [data-mobile-main] { 
      padding: 12px !important;
      padding-top: 68px !important;
    }
    [data-mobile-card] { 
      padding: 12px !important;
    }
    [data-mobile-font-xs] {
      font-size: 11px !important;
    }
  }
`;