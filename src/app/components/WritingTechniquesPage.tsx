'use client';

import React, { useState, useEffect } from 'react';

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
            backgroundColor: '#E8652D',
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
                style={{ padding: '8px 16px', backgroundColor: '#E8652D', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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

export default WritingTechniquesPage;
