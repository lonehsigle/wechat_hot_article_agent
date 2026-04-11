'use client';

import { useState } from 'react';
import { shortcutManager, SHORTCUTS } from '@/lib/utils/shortcuts';

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutHelpPanel({ isOpen, onClose }: ShortcutHelpProps) {
  if (!isOpen) return null;

  const formatShortcut = (config: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
    const parts: string[] = [];
    if (config.ctrl) parts.push('⌘/Ctrl');
    if (config.shift) parts.push('Shift');
    if (config.alt) parts.push('Alt');
    parts.push(config.key.toUpperCase());
    return parts.join(' + ');
  };

  const shortcutList = Object.entries(SHORTCUTS).map(([name, config]) => ({
    name: name.replace(/_/g, ' '),
    shortcut: formatShortcut(config),
    description: config.description,
  }));

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>⌨️ 快捷键帮助</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        <div style={styles.content}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>通用操作</h3>
            <div style={styles.shortcutList}>
              {shortcutList.slice(0, 5).map((item, index) => (
                <div key={index} style={styles.shortcutItem}>
                  <span style={styles.shortcutKey}>{item.shortcut}</span>
                  <span style={styles.shortcutDesc}>{item.description}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>编辑操作</h3>
            <div style={styles.shortcutList}>
              {shortcutList.slice(5).map((item, index) => (
                <div key={index} style={styles.shortcutItem}>
                  <span style={styles.shortcutKey}>{item.shortcut}</span>
                  <span style={styles.shortcutDesc}>{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={styles.footer}>
          <span style={styles.hint}>按 <kbd style={styles.kbd}>?</kbd> 显示/隐藏此面板</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  content: {
    padding: '24px',
    overflow: 'auto',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  shortcutList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  shortcutItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  shortcutKey: {
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: '500',
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  shortcutDesc: {
    fontSize: '14px',
    color: '#6b7280',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  hint: {
    fontSize: '13px',
    color: '#9ca3af',
  },
  kbd: {
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
  },
};
