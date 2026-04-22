'use client';

import React, { useState } from 'react';

interface MonitorCategory {
  id: string;
  name: string;
  keywords: string[];
}

interface AddKeywordModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (keyword: string) => void;
  selectedCategory: MonitorCategory | undefined;
  selectedCategoryId: string;
}

export default function AddKeywordModal({ show, onClose, onAdd, selectedCategory }: AddKeywordModalProps) {
  const [newKeyword, setNewKeyword] = useState('');

  if (!show) return null;

  const handleAdd = () => {
    if (newKeyword.trim() && selectedCategory) {
      onAdd(newKeyword.trim());
      setNewKeyword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newKeyword.trim() && selectedCategory) {
      onAdd(newKeyword.trim());
      setNewKeyword('');
    }
  };

  return (
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
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>🔑 添加关键词</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
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
            onKeyDown={handleKeyDown}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
            onClick={handleAdd}
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
  );
}
