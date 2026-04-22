'use client';

import React from 'react';
import { styles } from '../styles';

interface ContentStepProps {
  openingContent: string;
  setOpeningContent: (c: string) => void;
  articleContent: string;
  setArticleContent: (c: string) => void;
  endingContent: string;
  setEndingContent: (c: string) => void;
  selectedTitle: string;
  isLoading: boolean;
  onGenerateOpening: () => void;
  onGenerateEnding: () => void;
  onPolish: () => void;
  onBack: () => void;
}

export function ContentStep({
  openingContent,
  setOpeningContent,
  articleContent,
  setArticleContent,
  endingContent,
  setEndingContent,
  selectedTitle,
  isLoading,
  onGenerateOpening,
  onGenerateEnding,
  onPolish,
  onBack,
}: ContentStepProps) {
  const totalChars = openingContent.length + articleContent.length + endingContent.length;

  return (
    <div style={styles.mainContent} data-cw-grid>
      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>✍️ 文章内容</h3>

          <div style={styles.inputGroup}>
            <label style={styles.label}>开头（身份+痛点+确定结果）</label>
            <textarea
              style={styles.contentEditor}
              value={openingContent}
              onChange={(e) => setOpeningContent(e.target.value)}
              placeholder="点击生成开头，或手动编辑..."
              rows={4}
              data-cw-textarea
            />
            <button
              style={{ ...styles.buttonSecondary, marginTop: '8px' }}
              onClick={onGenerateOpening}
              disabled={isLoading}
              data-cw-btn
            >
              ✨ 生成开头
            </button>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>正文</label>
            <textarea
              style={{ ...styles.contentEditor, minHeight: '400px' }}
              value={articleContent}
              onChange={(e) => setArticleContent(e.target.value)}
              placeholder="文章正文内容..."
              data-cw-textarea
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>结尾（总结+行动+互动）</label>
            <textarea
              style={styles.contentEditor}
              value={endingContent}
              onChange={(e) => setEndingContent(e.target.value)}
              placeholder="点击生成结尾，或手动编辑..."
              rows={4}
              data-cw-textarea
            />
            <button
              style={{ ...styles.buttonSecondary, marginTop: '8px' }}
              onClick={onGenerateEnding}
              disabled={isLoading}
              data-cw-btn
            >
              ✨ 生成结尾
            </button>
          </div>

          <div style={styles.buttonGroup} data-cw-btn-group>
            <button
              style={styles.buttonSecondary}
              onClick={onBack}
              data-cw-btn
            >
              ← 返回修改标题
            </button>
            <button
              style={styles.button}
              onClick={onPolish}
              disabled={isLoading}
              data-cw-btn
            >
              🎨 润色优化 →
            </button>
          </div>
        </div>
      </div>

      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📋 当前标题</h3>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', lineHeight: '1.5' }}>
            {selectedTitle}
          </div>
        </div>

        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📊 字数统计</h3>
          <div style={styles.configCard} data-cw-config-card>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>开头</span>
              <span style={styles.configValue}>{openingContent.length} 字</span>
            </div>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>正文</span>
              <span style={styles.configValue}>{articleContent.length} 字</span>
            </div>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>结尾</span>
              <span style={styles.configValue}>{endingContent.length} 字</span>
            </div>
            <div style={{ ...styles.configRow, borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }} data-cw-config-row>
              <span style={{ ...styles.configLabel, fontWeight: '600' }}>总计</span>
              <span style={{ ...styles.configValue, fontWeight: '600', color: '#3b82f6' }}>
                {totalChars} 字
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
