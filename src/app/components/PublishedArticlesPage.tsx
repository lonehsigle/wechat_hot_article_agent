'use client';

import React, { useState, useEffect } from 'react';

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
                  border: selectedArticle?.id === article.id ? '2px solid #E8652D' : '1px solid #e5e7eb',
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
                      style={{ color: '#E8652D' }}
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
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#E8652D' }}>
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

export default PublishedArticlesPage;
