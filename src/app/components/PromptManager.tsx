'use client';

import { useState, useEffect } from 'react';

interface PromptConfig {
  key: string;
  name: string;
  description: string;
  template: string;
}

const styles = {
  container: {
    padding: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  promptItem: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '12px',
  },
  promptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  promptName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
  },
  promptKey: {
    fontSize: '12px',
    color: '#6b7280',
    marginLeft: '8px',
  },
  promptDesc: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  editBtn: {
    padding: '4px 12px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    minHeight: '150px',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    resize: 'vertical' as 'vertical',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  saveBtn: {
    padding: '6px 16px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '6px 16px',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  templatePreview: {
    padding: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as 'nowrap',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#ef4444',
  },
};

export default function PromptManager() {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string>('');

  useEffect(() => {
    const controller = new AbortController();
    loadPrompts(controller.signal);
    return () => controller.abort();
  }, []);

  const loadPrompts = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await fetch('/api/create-workshop?action=get-prompts', { signal });
      const data = await res.json();
      setPrompts(data.success ? (data.prompts || []) : (data.prompts || []));
      setError(null);
    } catch (err) {
      setError('加载 Prompt 配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-prompt',
          key,
          template: editingTemplate,
        }),
      });
      
      if (res.ok) {
        setEditingKey(null);
        setEditingTemplate('');
        await loadPrompts();
      } else {
        setError('保存失败');
      }
    } catch (err) {
      setError('保存失败');
    }
  };

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>📝 Prompt 管理</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          管理和自定义 AI 创作使用的 Prompt 模板。点击编辑按钮可以修改 Prompt 内容。
        </p>
        
        {prompts.map((prompt) => (
          <div key={prompt.key} style={styles.promptItem}>
            <div style={styles.promptHeader}>
              <div>
                <span style={styles.promptName}>{prompt.name}</span>
                <span style={styles.promptKey}>({prompt.key})</span>
              </div>
              <button
                onClick={() => {
                  setEditingKey(prompt.key);
                  setEditingTemplate(prompt.template);
                }}
                style={styles.editBtn}
              >
                编辑
              </button>
            </div>
            <p style={styles.promptDesc}>{prompt.description}</p>
            
            {editingKey === prompt.key ? (
              <div style={{ marginTop: '12px' }}>
                <textarea
                  value={editingTemplate}
                  onChange={(e) => setEditingTemplate(e.target.value)}
                  style={styles.textarea}
                />
                <div style={styles.buttonGroup}>
                  <button onClick={() => handleSave(prompt.key)} style={styles.saveBtn}>
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditingKey(null);
                      setEditingTemplate('');
                    }}
                    style={styles.cancelBtn}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.templatePreview}>
                {prompt.template.substring(0, 150)}...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
