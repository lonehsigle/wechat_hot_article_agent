'use client';

import React, { useState, useEffect } from 'react';

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
    const controller = new AbortController();
    loadAnalytics(controller.signal);
    return () => controller.abort();
  }, [dateRange]);

  const loadAnalytics = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [statsRes, articlesRes, suggestionsRes] = await Promise.all([
        fetch('/api/optimization-loop?action=stats', { signal }),
        fetch('/api/optimization-loop?action=list', { signal }),
        fetch('/api/optimization-loop?action=suggestions', { signal }),
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
      if (error instanceof Error && error.name === 'AbortError') return;
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
                backgroundColor: dateRange === range ? '#E8652D' : '#fff',
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
                              backgroundColor: ['#E8652D', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
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

export default AnalyticsPanel;
