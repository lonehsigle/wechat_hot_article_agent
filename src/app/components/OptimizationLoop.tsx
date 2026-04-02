'use client';

import { useState, useEffect } from 'react';

interface PublishedArticle {
  id: number;
  title: string;
  content: string;
  articleUrl: string | null;
  publishTime: string | null;
  sourceContentId: number | null;
  sourceTitle: string | null;
  sourceReadCount: number;
  sourceLikeCount: number;
  sourceDigest: string;
  readCount: number;
  likeCount: number;
  lookCount: number;
  shareCount: number;
  commentCount: number;
  analysisStatus: string;
  analysisResult: string | null;
  createdAt: string;
}

interface OptimizationSuggestion {
  id: number;
  articleId: number;
  gapType: string;
  gapDescription: string | null;
  sourceStrength: string | null;
  rewriteWeakness: string | null;
  suggestion: string;
  priority: string;
  performanceRatio: number;
  status: string;
  reviewerNote: string | null;
  createdAt: string;
}

interface SourceContent {
  id: number;
  title: string;
  readCount: number;
  likes: number;
  digest: string | null;
}

interface WechatPublishedArticle {
  msgId: string;
  title: string;
  author: string | null;
  digest: string | null;
  coverImage: string | null;
  sourceUrl: string;
  publishTime: number | null;
  readCount: number;
  likeCount: number;
  sourceContentId?: number;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1890ff',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #e8e8e8',
    paddingBottom: '12px',
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  activeTab: {
    background: '#1890ff',
    color: '#fff',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
  },
  cardMeta: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  badgePending: {
    background: '#fff7e6',
    color: '#fa8c16',
  },
  badgeCompleted: {
    background: '#f6ffed',
    color: '#52c41a',
  },
  badgeAnalyzing: {
    background: '#e6f7ff',
    color: '#1890ff',
  },
  badgeHigh: {
    background: '#fff1f0',
    color: '#ff4d4f',
  },
  badgeMedium: {
    background: '#fff7e6',
    color: '#fa8c16',
  },
  badgeLow: {
    background: '#f6ffed',
    color: '#52c41a',
  },
  badgeApproved: {
    background: '#f6ffed',
    color: '#52c41a',
  },
  badgeRejected: {
    background: '#fff1f0',
    color: '#ff4d4f',
  },
  comparison: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  comparisonBox: {
    padding: '16px',
    borderRadius: '8px',
    background: '#fafafa',
  },
  comparisonTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#666',
  },
  comparisonItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
  },
  comparisonLabel: {
    color: '#666',
  },
  comparisonValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  performanceRatio: {
    textAlign: 'center',
    padding: '16px',
    background: '#fff7e6',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  ratioValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fa8c16',
  },
  ratioLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  primaryButton: {
    background: '#1890ff',
    color: '#fff',
  },
  secondaryButton: {
    background: '#f0f0f0',
    color: '#666',
  },
  successButton: {
    background: '#52c41a',
    color: '#fff',
  },
  dangerButton: {
    background: '#ff4d4f',
    color: '#fff',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
  },
  analysisSection: {
    marginTop: '16px',
    padding: '16px',
    background: '#fafafa',
    borderRadius: '8px',
  },
  analysisTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  analysisContent: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  suggestionCard: {
    padding: '16px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  suggestionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  suggestionType: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1890ff',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  articleCheckbox: {
    marginRight: '12px',
  },
  articleRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px',
  },
  articleMeta: {
    fontSize: '12px',
    color: '#999',
  },
  articleStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#666',
  },
  articleSelect: {
    width: '200px',
  },
  collectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  collectCount: {
    fontSize: '14px',
    color: '#666',
  },
};

const gapTypeLabels: Record<string, string> = {
  title: '标题',
  opening: '开头',
  content: '内容',
  structure: '结构',
  ending: '结尾',
};

const priorityLabels: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

export default function OptimizationLoop() {
  const [activeTab, setActiveTab] = useState<'articles' | 'suggestions' | 'collect'>('articles');
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [sourceContents, setSourceContents] = useState<SourceContent[]>([]);
  const [wechatArticles, setWechatArticles] = useState<WechatPublishedArticle[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [articleSourceMap, setArticleSourceMap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({
    totalArticles: 0,
    analyzedArticles: 0,
    pendingSuggestions: 0,
    avgPerformanceRatio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<PublishedArticle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    articleUrl: '',
    publishTime: '',
    sourceContentId: '',
    readCount: 0,
    likeCount: 0,
    lookCount: 0,
    shareCount: 0,
    commentCount: 0,
  });

  useEffect(() => {
    fetchData();
    fetchSourceContents();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [articlesRes, statsRes] = await Promise.all([
        fetch('/api/optimization-loop?action=list'),
        fetch('/api/optimization-loop?action=stats'),
      ]);

      const articlesData = await articlesRes.json();
      const statsData = await statsRes.json();

      setArticles(articlesData.articles || []);
      setStats(statsData);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSourceContents = async () => {
    try {
      const res = await fetch('/api/optimization-loop?action=source-contents');
      const data = await res.json();
      setSourceContents(data.contents || []);
    } catch (error) {
      console.error('获取原文列表失败:', error);
    }
  };

  const fetchWechatArticles = async () => {
    setCollecting(true);
    try {
      const res = await fetch('/api/optimization-loop?action=fetch-published&count=20');
      const data = await res.json();
      if (data.success) {
        setWechatArticles(data.articles || []);
        setSelectedArticles(new Set());
        setArticleSourceMap({});
      } else {
        alert('获取已发布文章失败：' + data.error);
      }
    } catch (error) {
      console.error('获取已发布文章失败:', error);
      alert('获取已发布文章失败');
    } finally {
      setCollecting(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/optimization-loop?action=suggestions&status=${filterStatus}&priority=${filterPriority}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('获取优化建议失败:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'suggestions') {
      fetchSuggestions();
    }
  }, [activeTab, filterStatus, filterPriority]);

  const handleAddArticle = async () => {
    try {
      const res = await fetch('/api/optimization-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...formData,
          sourceContentId: formData.sourceContentId ? parseInt(formData.sourceContentId) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          title: '',
          content: '',
          articleUrl: '',
          publishTime: '',
          sourceContentId: '',
          readCount: 0,
          likeCount: 0,
          lookCount: 0,
          shareCount: 0,
          commentCount: 0,
        });
        fetchData();
      }
    } catch (error) {
      console.error('添加文章失败:', error);
    }
  };

  const handleCollectArticles = async () => {
    const articlesToCollect = wechatArticles
      .filter(a => selectedArticles.has(a.msgId))
      .map(a => ({
        ...a,
        sourceContentId: articleSourceMap[a.msgId],
      }));

    if (articlesToCollect.length === 0) {
      alert('请选择要采集的文章');
      return;
    }

    setCollecting(true);
    try {
      const res = await fetch('/api/optimization-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collect-published',
          articles: articlesToCollect,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`采集完成！成功 ${data.summary.success} 篇，失败 ${data.summary.failed} 篇`);
        setActiveTab('articles');
        fetchData();
      }
    } catch (error) {
      console.error('采集文章失败:', error);
      alert('采集文章失败');
    } finally {
      setCollecting(false);
    }
  };

  const handleAnalyze = async (articleId: number) => {
    try {
      const res = await fetch('/api/optimization-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          articleId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchData();
        alert('分析完成！');
      } else {
        alert('分析失败：' + data.error);
      }
    } catch (error) {
      console.error('分析失败:', error);
      alert('分析失败');
    }
  };

  const handleReviewSuggestion = async (suggestionId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/optimization-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review-suggestion',
          suggestionId,
          reviewAction: action,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchSuggestions();
      }
    } catch (error) {
      console.error('审核失败:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getDaysSincePublish = (publishTime: string | null) => {
    if (!publishTime) return null;
    const days = Math.floor((Date.now() - new Date(publishTime).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getPerformanceRatio = (article: PublishedArticle) => {
    if (!article.sourceReadCount || article.sourceReadCount === 0) return 0;
    return Math.round((article.readCount / article.sourceReadCount) * 100 * 100) / 100;
  };

  const toggleArticleSelection = (msgId: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(msgId)) {
      newSelected.delete(msgId);
    } else {
      newSelected.add(msgId);
    }
    setSelectedArticles(newSelected);
  };

  const setArticleSource = (msgId: string, sourceId: number | undefined) => {
    const newMap = { ...articleSourceMap };
    if (sourceId) {
      newMap[msgId] = sourceId;
    } else {
      delete newMap[msgId];
    }
    setArticleSourceMap(newMap);
  };

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>闭环优化系统</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={() => {
              setActiveTab('collect');
              if (wechatArticles.length === 0) {
                fetchWechatArticles();
              }
            }}
          >
            从公众号采集
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={() => setShowAddModal(true)}
          >
            + 手动添加
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalArticles}</div>
          <div style={styles.statLabel}>已发布文章</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.analyzedArticles}</div>
          <div style={styles.statLabel}>已分析</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.pendingSuggestions}</div>
          <div style={styles.statLabel}>待审核建议</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.avgPerformanceRatio}%</div>
          <div style={styles.statLabel}>平均表现比率</div>
        </div>
      </div>

      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'articles' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('articles')}
        >
          文章列表
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'suggestions' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('suggestions')}
        >
          优化建议
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'collect' ? styles.activeTab : {}),
          }}
          onClick={() => {
            setActiveTab('collect');
            if (wechatArticles.length === 0) {
              fetchWechatArticles();
            }
          }}
        >
          采集已发布文章
        </button>
      </div>

      {activeTab === 'articles' && (
        <div>
          {articles.length === 0 ? (
            <div style={styles.emptyState}>
              <p>暂无已发布的文章</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                点击「从公众号采集」或「手动添加」添加已发布的文章
              </p>
            </div>
          ) : (
            articles.map((article) => {
              const daysSince = getDaysSincePublish(article.publishTime);
              const canAnalyze = daysSince !== null && daysSince >= 7 && article.analysisStatus === 'pending';

              return (
                <div key={article.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.cardTitle}>{article.title}</h3>
                      <div style={styles.cardMeta}>
                        发布于 {formatDate(article.publishTime)}
                        {daysSince !== null && ` (${daysSince}天前)`}
                        {article.sourceTitle && ` · 原文: ${article.sourceTitle}`}
                      </div>
                    </div>
                    <span
                      style={{
                        ...styles.badge,
                        ...(article.analysisStatus === 'completed'
                          ? styles.badgeCompleted
                          : article.analysisStatus === 'analyzing'
                          ? styles.badgeAnalyzing
                          : styles.badgePending),
                      }}
                    >
                      {article.analysisStatus === 'completed'
                        ? '已分析'
                        : article.analysisStatus === 'analyzing'
                        ? '分析中'
                        : '待分析'}
                    </span>
                  </div>

                  {article.sourceContentId && (
                    <div style={styles.comparison}>
                      <div style={styles.comparisonBox}>
                        <div style={styles.comparisonTitle}>原文表现</div>
                        <div style={styles.comparisonItem}>
                          <span style={styles.comparisonLabel}>阅读</span>
                          <span style={styles.comparisonValue}>
                            {article.sourceReadCount.toLocaleString()}
                          </span>
                        </div>
                        <div style={styles.comparisonItem}>
                          <span style={styles.comparisonLabel}>点赞</span>
                          <span style={styles.comparisonValue}>
                            {article.sourceLikeCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div style={styles.comparisonBox}>
                        <div style={styles.comparisonTitle}>改写表现</div>
                        <div style={styles.comparisonItem}>
                          <span style={styles.comparisonLabel}>阅读</span>
                          <span style={styles.comparisonValue}>
                            {article.readCount.toLocaleString()}
                          </span>
                        </div>
                        <div style={styles.comparisonItem}>
                          <span style={styles.comparisonLabel}>点赞</span>
                          <span style={styles.comparisonValue}>
                            {article.likeCount.toLocaleString()}
                          </span>
                        </div>
                        <div style={styles.comparisonItem}>
                          <span style={styles.comparisonLabel}>在看</span>
                          <span style={styles.comparisonValue}>
                            {article.lookCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={styles.performanceRatio}>
                    <div style={styles.ratioValue}>{getPerformanceRatio(article)}%</div>
                    <div style={styles.ratioLabel}>表现比率（改写阅读/原文阅读）</div>
                  </div>

                  <div style={styles.buttonGroup}>
                    {canAnalyze && (
                      <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={() => handleAnalyze(article.id)}
                      >
                        开始分析
                      </button>
                    )}
                    {article.analysisStatus === 'completed' && (
                      <button
                        style={{ ...styles.button, ...styles.secondaryButton }}
                        onClick={() => setSelectedArticle(article)}
                      >
                        查看分析结果
                      </button>
                    )}
                    {daysSince !== null && daysSince < 7 && (
                      <span style={{ color: '#999', fontSize: '12px', lineHeight: '32px' }}>
                        需发布7天后才能分析（还需 {7 - daysSince} 天）
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <select
              style={{ ...styles.select, width: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
            <select
              style={{ ...styles.select, width: '150px' }}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">全部优先级</option>
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
          </div>

          {suggestions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>暂无优化建议</p>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div key={suggestion.id} style={styles.suggestionCard}>
                <div style={styles.suggestionHeader}>
                  <span style={styles.suggestionType}>
                    {gapTypeLabels[suggestion.gapType] || suggestion.gapType}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(suggestion.priority === 'high'
                          ? styles.badgeHigh
                          : suggestion.priority === 'medium'
                          ? styles.badgeMedium
                          : styles.badgeLow),
                      }}
                    >
                      {priorityLabels[suggestion.priority]}
                    </span>
                    <span
                      style={{
                        ...styles.badge,
                        ...(suggestion.status === 'approved'
                          ? styles.badgeApproved
                          : suggestion.status === 'rejected'
                          ? styles.badgeRejected
                          : styles.badgePending),
                      }}
                    >
                      {suggestion.status === 'approved'
                        ? '已通过'
                        : suggestion.status === 'rejected'
                        ? '已拒绝'
                        : '待审核'}
                    </span>
                  </div>
                </div>

                {suggestion.sourceStrength && (
                  <p style={{ fontSize: '13px', color: '#52c41a', marginBottom: '8px' }}>
                    原文优点：{suggestion.sourceStrength}
                  </p>
                )}
                {suggestion.rewriteWeakness && (
                  <p style={{ fontSize: '13px', color: '#ff4d4f', marginBottom: '8px' }}>
                    改写问题：{suggestion.rewriteWeakness}
                  </p>
                )}
                <p style={{ fontSize: '14px', color: '#333', marginBottom: '12px' }}>
                  优化建议：{suggestion.suggestion}
                </p>

                {suggestion.status === 'pending' && (
                  <div style={styles.buttonGroup}>
                    <button
                      style={{ ...styles.button, ...styles.successButton }}
                      onClick={() => handleReviewSuggestion(suggestion.id, 'approve')}
                    >
                      通过
                    </button>
                    <button
                      style={{ ...styles.button, ...styles.dangerButton }}
                      onClick={() => handleReviewSuggestion(suggestion.id, 'reject')}
                    >
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'collect' && (
        <div>
          <div style={styles.collectHeader}>
            <div>
              <span style={styles.collectCount}>
                已选择 {selectedArticles.size} 篇文章
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={fetchWechatArticles}
                disabled={collecting}
              >
                {collecting ? '获取中...' : '刷新列表'}
              </button>
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={handleCollectArticles}
                disabled={collecting || selectedArticles.size === 0}
              >
                {collecting ? '采集中...' : `采集选中的 ${selectedArticles.size} 篇`}
              </button>
            </div>
          </div>

          {wechatArticles.length === 0 ? (
            <div style={styles.emptyState}>
              <p>{collecting ? '正在获取已发布文章...' : '暂无已发布文章'}</p>
            </div>
          ) : (
            wechatArticles.map((article) => (
              <div key={article.msgId} style={styles.articleRow}>
                <input
                  type="checkbox"
                  style={styles.articleCheckbox}
                  checked={selectedArticles.has(article.msgId)}
                  onChange={() => toggleArticleSelection(article.msgId)}
                />
                <div style={styles.articleInfo}>
                  <div style={styles.articleTitle}>{article.title}</div>
                  <div style={styles.articleMeta}>
                    {article.publishTime && new Date(article.publishTime * 1000).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div style={styles.articleStats}>
                  <span>阅读: {article.readCount}</span>
                  <span>点赞: {article.likeCount}</span>
                </div>
                <select
                  style={{ ...styles.select, ...styles.articleSelect }}
                  value={articleSourceMap[article.msgId] || ''}
                  onChange={(e) => setArticleSource(article.msgId, e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">不关联原文</option>
                  {sourceContents.map((content) => (
                    <option key={content.id} value={content.id}>
                      {content.title.substring(0, 20)}... (阅读: {content.readCount?.toLocaleString() || 0})
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {showAddModal && (
        <div style={styles.modal} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>手动添加已发布文章</h2>
              <button style={styles.closeButton} onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>文章标题 *</label>
              <input
                style={styles.input}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入文章标题"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>关联原文（可选）</label>
              <select
                style={styles.select}
                value={formData.sourceContentId}
                onChange={(e) => setFormData({ ...formData, sourceContentId: e.target.value })}
              >
                <option value="">不关联原文</option>
                {sourceContents.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.title} (阅读: {content.readCount?.toLocaleString() || 0})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>文章URL（可选）</label>
              <input
                style={styles.input}
                value={formData.articleUrl}
                onChange={(e) => setFormData({ ...formData, articleUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>发布时间</label>
              <input
                style={styles.input}
                type="date"
                value={formData.publishTime}
                onChange={(e) => setFormData({ ...formData, publishTime: e.target.value })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>表现数据</label>
              <div style={styles.row}>
                <div>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="阅读数"
                    value={formData.readCount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, readCount: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="点赞数"
                    value={formData.likeCount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, likeCount: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="在看数"
                    value={formData.lookCount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, lookCount: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>文章内容（可选）</label>
              <textarea
                style={styles.textarea}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="粘贴文章内容..."
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={handleAddArticle}
                disabled={!formData.title}
              >
                保存
              </button>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedArticle && (
        <div style={styles.modal} onClick={() => setSelectedArticle(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>分析结果</h2>
              <button style={styles.closeButton} onClick={() => setSelectedArticle(null)}>
                ×
              </button>
            </div>

            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>{selectedArticle.title}</h3>

            {selectedArticle.analysisResult && (
              <div style={styles.analysisSection}>
                <div style={styles.analysisTitle}>AI 分析结果</div>
                <div style={styles.analysisContent}>
                  {(() => {
                    try {
                      const result = JSON.parse(selectedArticle.analysisResult);
                      return (
                        <>
                          {result.overallAssessment && (
                            <p style={{ marginBottom: '16px' }}>
                              <strong>整体评估：</strong>
                              {result.overallAssessment}
                            </p>
                          )}
                          {result.keyRecommendations && (
                            <div style={{ marginBottom: '16px' }}>
                              <strong>关键建议：</strong>
                              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                {result.keyRecommendations.map((r: string, i: number) => (
                                  <li key={i} style={{ marginBottom: '4px' }}>
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      );
                    } catch {
                      return selectedArticle.analysisResult;
                    }
                  })()}
                </div>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={() => setSelectedArticle(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
