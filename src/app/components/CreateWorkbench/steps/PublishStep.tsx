'use client';

import React from 'react';
import { styles } from '../styles';
import type { WechatAccount, GeneratedImage } from '../types';

interface PublishStepProps {
  wechatAccounts: WechatAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  selectedTitle: string;
  polishedContent: string;
  generatedImages: GeneratedImage[];
  publishStatus: 'idle' | 'uploading' | 'success' | 'error';
  publishMessage: string;
  isLoading: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
  onComplete: () => void;
  onBack: () => void;
}

export function PublishStep({
  wechatAccounts,
  selectedAccountId,
  setSelectedAccountId,
  selectedTitle,
  polishedContent,
  generatedImages,
  publishStatus,
  publishMessage,
  isLoading,
  onPublish,
  onSaveDraft,
  onComplete,
  onBack,
}: PublishStepProps) {
  const selectedAccount = wechatAccounts.find(a => a.id === parseInt(selectedAccountId));
  const hasAppId = selectedAccount?.appId;

  return (
    <div style={styles.mainContent} data-cw-grid>
      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📤 发布到微信公众号</h3>

          <div style={styles.inputGroup}>
            <label style={styles.label}>选择发布账号</label>
            <select
              style={styles.select}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              data-cw-input
            >
              <option value="">请选择公众号账号...</option>
              {wechatAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}{account.isDefault ? '（默认）' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedAccountId && (
            <div style={styles.configCard} data-cw-config-card>
              <div style={styles.configRow} data-cw-config-row>
                <span style={styles.configLabel}>账号状态</span>
                <span style={{
                  ...styles.configValue,
                  color: hasAppId ? '#10b981' : '#ef4444'
                }}>
                  {hasAppId ? '✓ 已配置' : '⚠ 未配置AppID'}
                </span>
              </div>
            </div>
          )}

          {publishStatus === 'success' && (
            <div style={{
              padding: '16px',
              backgroundColor: '#dcfce7',
              borderRadius: '8px',
              color: '#166534',
              marginBottom: '16px'
            }}>
              ✅ {publishMessage}
            </div>
          )}

          {publishStatus === 'error' && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fee2e2',
              borderRadius: '8px',
              color: '#991b1b',
              marginBottom: '16px'
            }}>
              ❌ {publishMessage}
            </div>
          )}

          <div style={styles.buttonGroup} data-cw-btn-group>
            <button
              style={styles.buttonSecondary}
              onClick={onBack}
              data-cw-btn
            >
              ← 返回配图
            </button>
            <button
              style={{ ...styles.button, backgroundColor: '#6b7280' }}
              onClick={onSaveDraft}
              disabled={isLoading}
              data-cw-btn
            >
              💾 保存草稿
            </button>
            <button
              style={{ ...styles.button, backgroundColor: '#10b981' }}
              onClick={onPublish}
              disabled={isLoading || !selectedAccountId || publishStatus === 'success'}
              data-cw-btn
            >
              📤 发布到草稿箱
            </button>
            {publishStatus === 'success' && (
              <button
                style={styles.button}
                onClick={onComplete}
                data-cw-btn
              >
                ✅ 完成创作
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📋 发布预览</h3>
          <div style={styles.configCard} data-cw-config-card>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>文章标题</span>
              <span style={styles.configValue}>{selectedTitle}</span>
            </div>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>文章字数</span>
              <span style={styles.configValue}>{polishedContent.length} 字</span>
            </div>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>配图数量</span>
              <span style={styles.configValue}>{generatedImages.length} 张</span>
            </div>
          </div>
        </div>

        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>🖼️ 配图预览</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {generatedImages.map((img, idx) => (
              <img
                key={idx}
                src={`data:image/jpeg;base64,${img.imageBase64}`}
                alt={`配图${idx + 1}`}
                style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                data-cw-image-preview
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
