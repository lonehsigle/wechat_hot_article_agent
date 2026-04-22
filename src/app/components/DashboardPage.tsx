'use client';

import React, { useState, useEffect } from 'react';

function DashboardPage({ setActiveTab }: { setActiveTab: (tab: 'content' | 'hotTopics' | 'analysis' | 'topicAnalysis' | 'wechatCollect' | 'wechatAccount' | 'crawler' | 'settings' | 'create' | 'pendingPublish' | 'techniques' | 'analytics' | 'styles' | 'dashboard' | 'ipPlan') => void }) {
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    pendingDrafts: 0,
    analysisTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    loadStats(controller.signal);
    return () => controller.abort();
  }, []);

  const loadStats = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [articlesRes, analysisRes] = await Promise.all([
        fetch('/api/published-articles', { signal }),
        fetch('/api/analysis', { signal }),
      ]);
      const articlesResult = await articlesRes.json();
      const analysisResult = await analysisRes.json();

      const articlesData = articlesResult.success ? articlesResult.data : (Array.isArray(articlesResult) ? articlesResult : []);
      const analysisData = Array.isArray(analysisResult) ? analysisResult : [];

      const published = articlesData.filter((a: { publishStatus: string }) => a.publishStatus === 'published').length;
      const drafts = articlesData.filter((a: { publishStatus: string }) => a.publishStatus === 'draft').length;

      setStats({
        totalArticles: articlesData.length,
        publishedArticles: published,
        pendingDrafts: drafts,
        analysisTasks: analysisData.length,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { 
      label: '总文章数', 
      value: stats.totalArticles, 
      color: '#1f2937', 
      bgColor: '#f8fafc',
      icon: '📄',
      iconBg: '#e2e8f0',
      trend: '+12%'
    },
    { 
      label: '已发布', 
      value: stats.publishedArticles, 
      color: '#10b981', 
      bgColor: '#ecfdf5',
      icon: '📤',
      iconBg: '#a7f3d0',
      trend: '+8%'
    },
    { 
      label: '草稿箱', 
      value: stats.pendingDrafts, 
      color: '#f59e0b', 
      bgColor: '#fffbeb',
      icon: '✏️',
      iconBg: '#fde68a',
      trend: '+3%'
    },
    { 
      label: '分析任务', 
      value: stats.analysisTasks, 
      color: '#E8652D', 
      bgColor: '#fef3ee',
      icon: '📊',
      iconBg: '#fecaca',
      trend: '+15%'
    },
  ];

  const quickActions: Array<{ icon: string; title: string; desc: string; tab: 'content' | 'hotTopics' | 'analysis' | 'topicAnalysis' | 'wechatCollect' | 'wechatAccount' | 'crawler' | 'settings' | 'create' | 'pendingPublish' | 'techniques' | 'analytics' | 'styles' | 'dashboard' | 'ipPlan'; color: string }> = [
    { icon: '📥', title: '文章采集', desc: '采集公众号文章', tab: 'wechatCollect', color: '#3b82f6' },
    { icon: '🔍', title: '公众号采集', desc: '搜索公众号与订阅', tab: 'wechatAccount', color: '#8b5cf6' },
    { icon: '📊', title: '选题分析', desc: '选题评估与分析', tab: 'topicAnalysis', color: '#E8652D' },
    { icon: '✍️', title: '创作工作台', desc: 'AI一键创作文章', tab: 'create', color: '#10b981' },
    { icon: '🎯', title: 'IP方案', desc: '5步打造公众号IP', tab: 'ipPlan', color: '#f59e0b' },
  ];

  const workflowSteps = [
    { step: '1', title: '选题分析', desc: '输入关键词，AI分析热点内容', icon: '🔍' },
    { step: '2', title: '风格拆解', desc: '分析对标账号写作风格', icon: '🎨' },
    { step: '3', title: '内容创作', desc: 'AI辅助生成高质量文章', icon: '✍️' },
    { step: '4', title: '发布管理', desc: '一键发布到多个平台', icon: '🚀' },
  ];

  const tips = [
    { icon: '💡', tip: '选题分析时，使用具体关键词效果更佳' },
    { icon: '📚', tip: '风格拆解需要提供3-5篇对标文章' },
    { icon: '🎨', tip: '创作时可选择已拆解的写作风格' },
    { icon: '👁️', tip: '发布前可预览文章效果' },
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

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {loading ? (
          // Skeleton loading state
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card" style={styles.statCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                  <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                </div>
                <div className="skeleton" style={{ width: '50px', height: '32px', borderRadius: '6px' }} />
              </div>
            ))}
          </>
        ) : (
          statItems.map((stat, i) => (
            <div 
              key={i} 
              className="card card-hover" 
              style={{ ...styles.statCard, borderLeft: `3px solid ${stat.color}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: stat.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{stat.label}</div>
                  <div style={{ fontSize: '11px', color: stat.color, fontWeight: 600 }}>{stat.trend}</div>
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>快速入口</h2>
        <div style={styles.quickActionsGrid}>
          {quickActions.map((action, i) => (
            <div
              key={i}
              className="card card-hover"
              style={styles.quickActionCard}
              onClick={() => setActiveTab(action.tab)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${action.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ 
                fontSize: '32px', 
                marginBottom: '12px',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>{action.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>{action.title}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{action.desc}</div>
              <div style={{
                marginTop: '12px',
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: action.color,
                opacity: 0.3,
                transition: 'width 0.3s ease, opacity 0.3s ease',
              }} className="quick-action-bar" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Workflow & Tips */}
      <div style={styles.bottomGrid}>
        {/* Workflow Steps */}
        <div className="card" style={styles.bottomCard}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📈</span>
            工作流程
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
            {/* Connector line */}
            <div style={{
              position: 'absolute',
              left: '14px',
              top: '28px',
              bottom: '28px',
              width: '2px',
              background: 'linear-gradient(to bottom, #E8652D, #f59e0b, #10b981, #3b82f6)',
              borderRadius: '1px',
              opacity: 0.3,
            }} />
            {workflowSteps.map((item, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px', 
                padding: '12px',
                borderRadius: '10px',
                transition: 'background-color 0.2s',
                cursor: 'default',
                position: 'relative',
                zIndex: 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: i === 0 ? '#E8652D' : i === 1 ? '#f59e0b' : i === 2 ? '#10b981' : '#3b82f6',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${i === 0 ? '#E8652D40' : i === 1 ? '#f59e0b40' : i === 2 ? '#10b98140' : '#3b82f640'}`,
                }}>{item.step}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.title}
                    <span style={{ fontSize: '12px' }}>{item.icon}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="card" style={styles.bottomCard}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            使用技巧
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tips.map((item, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '10px', 
                  padding: '14px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '10px',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span style={{ 
                  color: '#E8652D', 
                  fontSize: '18px',
                  flexShrink: 0,
                  marginTop: '-2px',
                }}>{item.icon}</span>
                <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>{item.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s ease',
  },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  bottomCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
};

export default DashboardPage;
