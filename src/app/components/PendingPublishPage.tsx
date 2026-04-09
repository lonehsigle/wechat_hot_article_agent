'use client';

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

const safeSanitize = (html: string): string => {
  if (typeof window === 'undefined') return html;
  try { return DOMPurify.sanitize(html); } catch { return html; }
};

interface PendingArticle {
  id: number;
  title: string;
  content: string;
  summary: string;
  style: string;
  wordCount: number;
  aiScore: number | null;
  status: 'draft' | 'pending' | 'published';
  createdAt: string;
  sourceArticleIds: number[];
}

interface PendingPublishPageProps {
  onPreview?: (article: PendingArticle) => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  stats: {
    display: 'flex',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '16px 24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#E8652D',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s',
  },
  articleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  articleTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: '16px',
  },
  articleMeta: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: '#6b7280',
  },
  articleSummary: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  articleActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  btn: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    backgroundColor: '#E8652D',
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  btnDanger: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusDraft: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  statusPending: {
    backgroundColor: '#dbeafe',
    color: '#D4551F',
  },
  statusPublished: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
  },
  previewModal: {
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
  previewContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  previewHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
  },
  previewBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
  previewArticle: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#374151',
  },
  previewFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  scoreBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  scoreFill: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#e5e7eb',
    width: '100px',
    overflow: 'hidden',
  },
  scoreValue: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
};

export default function PendingPublishPage({ onPreview }: PendingPublishPageProps) {
  const [articles, setArticles] = useState<PendingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewArticle, setPreviewArticle] = useState<PendingArticle | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-rewrites' }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (article: PendingArticle) => {
    setPreviewArticle(article);
  };

  const handlePublish = async (article: PendingArticle) => {
    if (!confirm(`确定要发布文章《${article.title}》到微信草稿箱吗？`)) {
      return;
    }

    setPublishingId(article.id);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          accountId: 1,
          title: article.title,
          content: article.content,
          autoSearchImages: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('文章已成功发布到微信草稿箱！');
        loadArticles();
      } else {
        alert(`发布失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      alert(`发布失败: ${error}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (article: PendingArticle) => {
    if (!confirm(`确定要删除文章《${article.title}》吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-rewrite', id: article.id }),
      });
      const data = await res.json();
      if (data.success) {
        loadArticles();
      } else {
        alert(`删除失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      alert(`删除失败: ${error}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span style={{ ...styles.statusBadge, ...styles.statusDraft }}>草稿</span>;
      case 'pending':
        return <span style={{ ...styles.statusBadge, ...styles.statusPending }}>待发布</span>;
      case 'published':
        return <span style={{ ...styles.statusBadge, ...styles.statusPublished }}>已发布</span>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const draftCount = articles.filter(a => a.status === 'draft').length;
  const pendingCount = articles.filter(a => a.status === 'pending').length;
  const publishedCount = articles.filter(a => a.status === 'published').length;

  return (
    <div style={styles.container}>
      <style>{`
        @media (max-width: 768px) {
          [data-pp-header] {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          [data-pp-stats] {
            width: 100% !important;
            justify-content: space-between !important;
          }
          [data-pp-stat-card] {
            padding: 12px 16px !important;
            flex: 1 !important;
            text-align: center !important;
          }
          [data-pp-stat-value] {
            font-size: 22px !important;
          }
          [data-pp-stat-label] {
            font-size: 12px !important;
          }
          [data-pp-card] {
            padding: 16px !important;
          }
          [data-pp-title] {
            font-size: 16px !important;
          }
          [data-pp-meta] {
            gap: 8px !important;
          }
          [data-pp-meta-item] {
            font-size: 12px !important;
          }
          [data-pp-summary] {
            font-size: 13px !important;
            padding: 10px !important;
          }
          [data-pp-actions] {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          [data-pp-btn] {
            padding: 8px 12px !important;
            font-size: 13px !important;
          }
          [data-pp-preview-content] {
            width: 95% !important;
            max-height: 85vh !important;
            margin: 10px !important;
          }
          [data-pp-preview-header] {
            padding: 16px !important;
          }
          [data-pp-preview-title] {
            font-size: 16px !important;
          }
          [data-pp-preview-body] {
            padding: 16px !important;
          }
          [data-pp-preview-article] {
            font-size: 14px !important;
          }
          [data-pp-preview-footer] {
            padding: 12px 16px !important;
            flex-wrap: wrap !important;
          }
          [data-pp-score-fill] {
            width: 60px !important;
          }
        }
        
        @media (max-width: 480px) {
          [data-pp-container] {
            padding: 12px !important;
          }
          [data-pp-stats] {
            flex-direction: column !important;
            gap: 8px !important;
          }
          [data-pp-stat-card] {
            padding: 10px 12px !important;
          }
          [data-pp-card] {
            padding: 12px !important;
          }
          [data-pp-article-header] {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          [data-pp-article-title] {
            fontSize: 15px !important;
            marginRight: 0 !important;
          }
          [data-pp-actions] {
            width: 100% !important;
            justify-content: space-between !important;
          }
          [data-pp-btn] {
            flex: 1 !important;
            min-width: 80px !important;
          }
        }
      `}</style>
      <div style={styles.header} data-pp-header>
        <h1 style={styles.title}>📋 待发布管理</h1>
        <div style={styles.stats} data-pp-stats>
          <div style={styles.statCard} data-pp-stat-card>
            <div style={styles.statValue} data-pp-stat-value>{draftCount}</div>
            <div style={styles.statLabel} data-pp-stat-label>草稿</div>
          </div>
          <div style={styles.statCard} data-pp-stat-card>
            <div style={styles.statValue} data-pp-stat-value>{pendingCount}</div>
            <div style={styles.statLabel} data-pp-stat-label>待发布</div>
          </div>
          <div style={styles.statCard} data-pp-stat-card>
            <div style={styles.statValue} data-pp-stat-value>{publishedCount}</div>
            <div style={styles.statLabel} data-pp-stat-label>已发布</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>⏳</div>
          <div style={styles.emptyText}>加载中...</div>
        </div>
      ) : articles.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>
          <div style={styles.emptyText}>暂无待发布文章</div>
          <div style={{ ...styles.emptyText, marginTop: '8px', fontSize: '14px' }}>
            前往创作工作台创作文章后保存即可在此查看
          </div>
        </div>
      ) : (
        <div style={styles.listContainer}>
          {articles.map((article) => (
            <div key={article.id} style={styles.articleCard} data-pp-card>
              <div style={styles.articleHeader} data-pp-article-header>
                <h3 style={styles.articleTitle} data-pp-article-title>{article.title}</h3>
                {getStatusBadge(article.status)}
              </div>
              
              <div style={styles.articleMeta} data-pp-meta>
                <span style={styles.metaItem} data-pp-meta-item>
                  📄 {article.wordCount} 字
                </span>
                {article.aiScore !== null && (
                  <span style={styles.metaItem} data-pp-meta-item>
                    🤖 AI检测: 
                    <span style={styles.scoreBar}>
                      <span style={styles.scoreFill} data-pp-score-fill>
                        <span style={{
                          ...styles.scoreValue,
                          width: `${article.aiScore}%`,
                          backgroundColor: getScoreColor(article.aiScore),
                        }} />
                      </span>
                      <span style={{ 
                        color: getScoreColor(article.aiScore),
                        fontWeight: '600',
                      }}>
                        {article.aiScore}分
                      </span>
                    </span>
                  </span>
                )}
                <span style={styles.metaItem} data-pp-meta-item>
                  📅 {new Date(article.createdAt).toLocaleString('zh-CN')}
                </span>
                {article.style && (
                  <span style={styles.metaItem} data-pp-meta-item>
                    🎨 {article.style}
                  </span>
                )}
              </div>

              {article.summary && (
                <div style={styles.articleSummary} data-pp-summary>
                  {article.summary}
                </div>
              )}

              <div style={styles.articleActions} data-pp-actions>
                <button
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => handlePreview(article)}
                  data-pp-btn
                >
                  👁️ 预览
                </button>
                {article.status !== 'published' && (
                  <button
                    style={{ ...styles.btn, ...styles.btnPrimary }}
                    onClick={() => handlePublish(article)}
                    disabled={publishingId === article.id}
                    data-pp-btn
                  >
                    {publishingId === article.id ? '发布中...' : '📤 发布'}
                  </button>
                )}
                <button
                  style={{ ...styles.btn, ...styles.btnDanger }}
                  onClick={() => handleDelete(article)}
                  data-pp-btn
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewArticle && (
        <div style={styles.previewModal} onClick={() => setPreviewArticle(null)}>
          <div style={styles.previewContent} onClick={(e) => e.stopPropagation()} data-pp-preview-content>
            <div style={styles.previewHeader} data-pp-preview-header>
              <h2 style={styles.previewTitle} data-pp-preview-title>{previewArticle.title}</h2>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setPreviewArticle(null)}
                data-pp-btn
              >
                ✕ 关闭
              </button>
            </div>
            <div style={styles.previewBody} data-pp-preview-body>
              <div 
                style={styles.previewArticle}
                data-pp-preview-article
                dangerouslySetInnerHTML={{
                  __html: safeSanitize(previewArticle.content.replace(/\n/g, '<br/>').replace(/<p>/g, '<p style="margin-bottom: 16px;">'))
                }}
              />
            </div>
            <div style={styles.previewFooter} data-pp-preview-footer>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setPreviewArticle(null)}
                data-pp-btn
              >
                关闭
              </button>
              {previewArticle.status !== 'published' && (
                <button
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                  onClick={() => {
                    setPreviewArticle(null);
                    handlePublish(previewArticle);
                  }}
                  data-pp-btn
                >
                  📤 发布到微信草稿箱
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
