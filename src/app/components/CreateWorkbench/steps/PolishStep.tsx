'use client';

import React from 'react';
import { styles } from '../styles';
import type { AICheckResult, GeneratedImage } from '../types';

interface PolishStepProps {
  aiCheckResult: AICheckResult | null;
  polishedContent: string;
  setPolishedContent: (c: string) => void;
  openingContent: string;
  articleContent: string;
  endingContent: string;
  selectedTitle: string;
  generatedImages: GeneratedImage[];
  isLoading: boolean;
  onPolish: () => void;
  onGenerateImages: () => void;
  onBack: () => void;
}

export function PolishStep({
  aiCheckResult,
  polishedContent,
  setPolishedContent,
  openingContent,
  articleContent,
  endingContent,
  selectedTitle,
  generatedImages,
  isLoading,
  onPolish,
  onGenerateImages,
  onBack,
}: PolishStepProps) {
  const originalLength = openingContent.length + articleContent.length + endingContent.length;

  return (
    <div style={styles.mainContent} data-cw-grid>
      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>🎨 润色优化</h3>

          {aiCheckResult && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: aiCheckResult.score >= 80 ? '#dcfce7' : aiCheckResult.score >= 50 ? '#fef3c7' : '#fee2e2',
                  color: aiCheckResult.score >= 80 ? '#166534' : aiCheckResult.score >= 50 ? '#92400e' : '#991b1b'
                }}>
                  AI味评分: {aiCheckResult.score}分
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {aiCheckResult.score >= 80 ? '✅ 低AI味（好）' :
                   aiCheckResult.score >= 50 ? '⚠️ 中等AI味' : '❌ 高AI味（需优化）'}
                </span>
              </div>
              {aiCheckResult.issues.length > 0 && (
                <div style={{ fontSize: '13px', color: '#475569' }}>
                  <strong>检测到的问题：</strong>{aiCheckResult.issues.slice(0, 3).join('；')}
                  {aiCheckResult.issues.length > 3 && `等${aiCheckResult.issues.length}个问题`}
                </div>
              )}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>润色后的内容</label>
            <textarea
              style={{ ...styles.contentEditor, minHeight: '500px' }}
              value={polishedContent}
              onChange={(e) => setPolishedContent(e.target.value)}
              placeholder="润色后的内容将显示在这里..."
              data-cw-textarea
            />
          </div>

          <div style={styles.buttonGroup} data-cw-btn-group>
            <button
              style={styles.buttonSecondary}
              onClick={onBack}
              data-cw-btn
            >
              ← 返回修改内容
            </button>
            <button
              style={{ ...styles.button, backgroundColor: '#f59e0b' }}
              onClick={onPolish}
              disabled={isLoading}
              data-cw-btn
            >
              🔄 重新润色
            </button>
            <button
              style={{ ...styles.button, backgroundColor: '#8b5cf6' }}
              onClick={onGenerateImages}
              disabled={isLoading || !polishedContent}
              data-cw-btn
            >
              🖼️ 生成配图 →
            </button>
          </div>
        </div>
      </div>

      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📊 对比</h3>
          <div style={styles.configCard} data-cw-config-card>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>原文字数</span>
              <span style={styles.configValue}>{originalLength} 字</span>
            </div>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>润色后字数</span>
              <span style={{ ...styles.configValue, color: '#10b981' }}>
                {polishedContent.length} 字
              </span>
            </div>
          </div>
        </div>

        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📋 标题</h3>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', lineHeight: '1.5' }}>
            {selectedTitle}
          </div>
        </div>
      </div>
    </div>
  );
}
