'use client';

import React, { useState, useEffect } from 'react';
import styles from '../../styles';

interface WechatAccount {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  authorName: string;
  isDefault: boolean;
  targetAudience?: string;
  readerPersona?: string;
  contentStyle?: string;
  mainTopics?: string[];
  tonePreference?: string;
}

interface AccountModalProps {
  show: boolean;
  account: WechatAccount | null;
  onClose: () => void;
  onSave: (account: WechatAccount) => void;
  wechatAccounts: WechatAccount[];
}

export default function AccountModal({ show, account, onClose, onSave, wechatAccounts }: AccountModalProps) {
  const [formData, setFormData] = useState<WechatAccount | null>(null);

  useEffect(() => {
    if (account) {
      setFormData({ ...account });
    }
  }, [account]);

  if (!show || !formData) return null;

  const isNew = !wechatAccounts.find(a => a.id === formData.id);

  const updateField = <K extends keyof WechatAccount>(field: K, value: WechatAccount[K]) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            {isNew ? '新增公众号账号' : '编辑公众号账号'}
          </h3>
          <button style={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div style={styles.modalBody}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>账号名称 *</label>
            <input
              type="text"
              style={styles.formInput}
              placeholder="如：科技观察、程序员日报"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>AppID</label>
            <input
              type="text"
              style={styles.formInput}
              placeholder="请输入微信公众号 AppID"
              value={formData.appId}
              onChange={(e) => updateField('appId', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>AppSecret</label>
            <input
              type="password"
              style={styles.formInput}
              placeholder="请输入微信公众号 AppSecret"
              value={formData.appSecret}
              onChange={(e) => updateField('appSecret', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>作者名称</label>
            <input
              type="text"
              style={styles.formInput}
              placeholder="默认作者署名"
              value={formData.authorName}
              onChange={(e) => updateField('authorName', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>目标用户群体</label>
            <textarea
              style={{ ...styles.formInput, minHeight: '60px', resize: 'vertical' }}
              placeholder="描述您的目标用户群体，如：25-35岁职场人士、科技爱好者、创业者等"
              value={formData.targetAudience || ''}
              onChange={(e) => updateField('targetAudience', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>读者画像</label>
            <textarea
              style={{ ...styles.formInput, minHeight: '80px', resize: 'vertical' }}
              placeholder="详细描述读者画像，如：关注科技趋势、喜欢深度内容、注重实用价值等"
              value={formData.readerPersona || ''}
              onChange={(e) => updateField('readerPersona', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>内容风格</label>
            <select
              style={styles.formSelect}
              value={formData.contentStyle || ''}
              onChange={(e) => updateField('contentStyle', e.target.value)}
            >
              <option value="">请选择内容风格</option>
              <option value="专业深度">专业深度</option>
              <option value="轻松幽默">轻松幽默</option>
              <option value="干货实用">干货实用</option>
              <option value="情感共鸣">情感共鸣</option>
              <option value="故事叙述">故事叙述</option>
              <option value="资讯速递">资讯速递</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>主要话题领域</label>
            <input
              type="text"
              style={styles.formInput}
              placeholder="用逗号分隔，如：科技,AI,创业,职场"
              value={(formData.mainTopics || []).join(',')}
              onChange={(e) => updateField('mainTopics', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>语言风格偏好</label>
            <select
              style={styles.formSelect}
              value={formData.tonePreference || ''}
              onChange={(e) => updateField('tonePreference', e.target.value)}
            >
              <option value="">请选择语言风格</option>
              <option value="正式严谨">正式严谨</option>
              <option value="亲切自然">亲切自然</option>
              <option value="活泼有趣">活泼有趣</option>
              <option value="专业权威">专业权威</option>
              <option value="接地气">接地气</option>
            </select>
          </div>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>取消</button>
          <button style={styles.saveBtn} onClick={() => onSave(formData)}>保存</button>
        </div>
      </div>
    </div>
  );
}
