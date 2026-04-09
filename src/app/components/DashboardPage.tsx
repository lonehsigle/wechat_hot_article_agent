'use client';

import React, { useState, useEffect } from 'react';

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
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#E8652D' }}>{stats.analysisTasks}</div>
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
                e.currentTarget.style.borderColor = '#E8652D';
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
                  backgroundColor: '#E8652D',
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

export default DashboardPage;
