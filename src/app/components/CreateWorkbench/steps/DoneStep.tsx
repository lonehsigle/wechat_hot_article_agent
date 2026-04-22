'use client';

import React from 'react';
import { styles } from '../styles';
import type { GeneratedImage } from '../types';

interface DoneStepProps {
  selectedTitle: string;
  polishedContent: string;
  generatedImages: GeneratedImage[];
  onReset: () => void;
}

export function DoneStep({
  selectedTitle,
  polishedContent,
  generatedImages,
  onReset,
}: DoneStepProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(polishedContent);
    alert('内容已复制到剪贴板！');
  };

  return (
    <div style={styles.card} data-cw-card>
      <div style={styles.doneCard} data-cw-done-card>
        <div style={styles.doneIcon} data-cw-done-icon>🎉</div>
        <h3 style={styles.doneTitle} data-cw-done-title>创作完成！</h3>
        <p style={styles.doneDesc}>
          文章《{selectedTitle}》已创作完成并发布
        </p>
        <div style={styles.configCard} data-cw-config-card>
          <div style={styles.configRow} data-cw-config-row>
            <span style={styles.configLabel}>文章字数</span>
            <span style={styles.configValue}>{polishedContent.length} 字</span>
          </div>
          <div style={styles.configRow} data-cw-config-row>
            <span style={styles.configLabel}>配图数量</span>
            <span style={styles.configValue}>{generatedImages.length} 张</span>
          </div>
          <div style={styles.configRow} data-cw-config-row>
            <span style={styles.configLabel}>发布状态</span>
            <span style={{ ...styles.configValue, color: '#10b981' }}>✓ 已发布到草稿箱</span>
          </div>
        </div>
        <div style={styles.buttonGroup} data-cw-btn-group>
          <button
            style={styles.buttonSecondary}
            onClick={onReset}
            data-cw-btn
          >
            🔄 创作新文章
          </button>
          <button
            style={styles.button}
            onClick={handleCopy}
            data-cw-btn
          >
            📋 复制内容
          </button>
        </div>
      </div>
    </div>
  );
}
