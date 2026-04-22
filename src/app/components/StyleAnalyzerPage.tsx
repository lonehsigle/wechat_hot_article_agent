'use client';

import React, { useState, useEffect } from 'react';

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
      setWritingStyles(data.success && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
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

export default StyleAnalyzerPage;
