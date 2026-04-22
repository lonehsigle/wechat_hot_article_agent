'use client';

import React from 'react';
import { styles } from '../styles';
import type { GeneratedImage } from '../types';

interface ImagesStepProps {
  generatedImages: GeneratedImage[];
  polishedContent: string;
  selectedTitle: string;
  isLoading: boolean;
  onGenerateImages: () => void;
  onPublish: () => void;
  onBack: () => void;
}

export function ImagesStep({
  generatedImages,
  polishedContent,
  selectedTitle,
  isLoading,
  onGenerateImages,
  onPublish,
  onBack,
}: ImagesStepProps) {
  return (
    <div style={styles.mainContent} data-cw-grid>
      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>🖼️ 文章配图</h3>

          {generatedImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              <p>点击下方按钮生成配图</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                将在文章30%、60%、90%位置生成配图
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {generatedImages.map((img, idx) => (
                <div key={idx} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    fontSize: '12px',
                    color: '#64748b',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    📍 位置：{Math.round(img.position * 100)}% | Prompt: {img.prompt.substring(0, 50)}...
                  </div>
                  <img
                    src={`data:image/jpeg;base64,${img.imageBase64}`}
                    alt={`配图${idx + 1}`}
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={styles.buttonGroup} data-cw-btn-group>
            <button
              style={styles.buttonSecondary}
              onClick={onBack}
              data-cw-btn
            >
              ← 返回润色
            </button>
            <button
              style={{ ...styles.button, backgroundColor: '#8b5cf6' }}
              onClick={onGenerateImages}
              disabled={isLoading}
              data-cw-btn
            >
              🔄 重新生成配图
            </button>
            <button
              style={{ ...styles.button, backgroundColor: '#10b981' }}
              onClick={onPublish}
              disabled={isLoading}
              data-cw-btn
            >
              确认配图，去发布 →
            </button>
          </div>
        </div>
      </div>

      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📋 文章预览</h3>
          <div style={{ ...styles.previewContent, maxHeight: '400px' }} data-cw-preview>
            <strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>{selectedTitle}</strong>
            {polishedContent.substring(0, 500)}...
          </div>
        </div>

        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📊 配图信息</h3>
          <div style={styles.configCard} data-cw-config-card>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>配图数量</span>
              <span style={styles.configValue}>{generatedImages.length} 张</span>
            </div>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>图片尺寸</span>
              <span style={styles.configValue}>16:9 横版</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
