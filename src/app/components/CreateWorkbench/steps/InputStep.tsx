'use client';

import React from 'react';
import { styles } from '../styles';
import type {
  InputSource,
  WorkflowStep,
  CollectedArticle,
  LayoutStyle,
} from '../types';

interface InputStepProps {
  inputSource: InputSource;
  setInputSource: (source: InputSource) => void;
  keyword: string;
  setKeyword: (k: string) => void;
  selectedTopicId: string;
  setSelectedTopicId: (id: string) => void;
  selectedArticleIds: number[];
  setSelectedArticleIds: (ids: number[]) => void;
  selectedStyleId: string;
  setSelectedStyleId: (id: string) => void;
  selectedLayoutId: string;
  setSelectedLayoutId: (id: string) => void;
  topics: Array<{ id: string; title: string; source: string; likes: number; selected: boolean }>;
  writingStyles: Array<{ id: number; name: string; template: string }>;
  layoutStyles: LayoutStyle[];
  collectedArticles: CollectedArticle[];
  llmConfig: { model: string; apiKey: string };
  canProceedFromInput: () => boolean;
  onSearch: () => void;
  onNextStep: () => void;
  onOneClickPublish: () => void;
  isLoading: boolean;
}

export function InputStep({
  inputSource,
  setInputSource,
  keyword,
  setKeyword,
  selectedTopicId,
  setSelectedTopicId,
  selectedArticleIds,
  setSelectedArticleIds,
  selectedStyleId,
  setSelectedStyleId,
  selectedLayoutId,
  setSelectedLayoutId,
  topics,
  writingStyles,
  layoutStyles,
  collectedArticles,
  llmConfig,
  canProceedFromInput,
  onSearch,
  onNextStep,
  onOneClickPublish,
  isLoading,
}: InputStepProps) {
  return (
    <div style={styles.mainContentSingle}>
      <div style={styles.card} data-cw-card>
        <h3 style={styles.cardTitle} data-cw-card-title>📥 选择输入来源</h3>

        <div style={styles.sourceTabs} data-cw-source-tabs>
          <div
            style={{ ...styles.sourceTab, ...(inputSource === 'keyword' ? styles.sourceTabActive : {}) }}
            onClick={() => setInputSource('keyword')}
            data-cw-source-tab
          >
            <div style={styles.sourceTabTitle} data-cw-source-tab-title>🔍 关键词搜索</div>
            <div style={styles.sourceTabDesc} data-cw-source-tab-desc>输入关键词搜索热点</div>
          </div>
          <div
            style={{ ...styles.sourceTab, ...(inputSource === 'topic' ? styles.sourceTabActive : {}) }}
            onClick={() => setInputSource('topic')}
            data-cw-source-tab
          >
            <div style={styles.sourceTabTitle} data-cw-source-tab-title>📌 选题库</div>
            <div style={styles.sourceTabDesc} data-cw-source-tab-desc>从已有选题中选择</div>
          </div>
          <div
            style={{ ...styles.sourceTab, ...(inputSource === 'article' ? styles.sourceTabActive : {}) }}
            onClick={() => setInputSource('article')}
            data-cw-source-tab
          >
            <div style={styles.sourceTabTitle} data-cw-source-tab-title>📄 已采集文章</div>
            <div style={styles.sourceTabDesc} data-cw-source-tab-desc>改写已有文章</div>
          </div>
        </div>

        {inputSource === 'keyword' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>输入关键词</label>
            <input
              type="text"
              style={styles.input}
              placeholder="如：AI编程、Claude Code、职场效率"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              data-cw-input
            />
          </div>
        )}

        {inputSource === 'topic' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>选择选题</label>
            <select
              style={styles.select}
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              data-cw-input
            >
              <option value="">请选择选题...</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.title} ({topic.source})
                </option>
              ))}
            </select>
          </div>
        )}

        {inputSource === 'article' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>选择文章（可多选）</label>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px'
            }}>
              {collectedArticles.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                  暂无已采集的文章，请先在&quot;内容监控&quot;中采集文章
                </div>
              ) : (
                collectedArticles.map(article => (
                  <label
                    key={article.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '12px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      backgroundColor: selectedArticleIds.includes(article.id) ? '#f0f9ff' : 'transparent',
                      borderRadius: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedArticleIds.includes(article.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedArticleIds([...selectedArticleIds, article.id]);
                        } else {
                          setSelectedArticleIds(selectedArticleIds.filter(id => id !== article.id));
                        }
                      }}
                      style={{ marginTop: '4px', marginRight: '12px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {article.author}
                        {article.readCount && article.readCount >= 10000 ? ` · 🔥${(article.readCount / 10000).toFixed(1)}万阅读` :
                         article.readCount && article.readCount >= 1000 ? ` · ${(article.readCount / 1000).toFixed(1)}k阅读` : ''}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedArticleIds.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#059669' }}>
                已选择 {selectedArticleIds.length} 篇文章
              </div>
            )}
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>写作风格</label>
          <div style={styles.styleChips}>
            <div
              style={{ ...styles.styleChip, ...(selectedStyleId === '' ? styles.styleChipActive : {}) }}
              onClick={() => setSelectedStyleId('')}
              data-cw-style-chip
            >
              默认风格
            </div>
            {writingStyles.map(style => (
              <div
                key={style.id}
                style={{ ...styles.styleChip, ...(selectedStyleId === String(style.id) ? styles.styleChipActive : {}) }}
                onClick={() => setSelectedStyleId(String(style.id))}
                data-cw-style-chip
              >
                {style.name}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>排版风格</label>
          <div style={styles.styleChips}>
            <div
              style={{ ...styles.styleChip, ...(selectedLayoutId === '' ? styles.styleChipActive : {}) }}
              onClick={() => setSelectedLayoutId('')}
              data-cw-style-chip
            >
              默认排版
            </div>
            {layoutStyles.map(style => (
              <div
                key={style.id}
                style={{ ...styles.styleChip, ...(selectedLayoutId === String(style.id) ? styles.styleChipActive : {}) }}
                onClick={() => setSelectedLayoutId(String(style.id))}
                title={style.description || ''}
                data-cw-style-chip
              >
                {style.name}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.configCard} data-cw-config-card>
          <div style={styles.configRow} data-cw-config-row>
            <span style={styles.configLabel}>当前大模型</span>
            <span style={styles.configValue}>
              {llmConfig.model || '未配置'}
            </span>
          </div>
          <div style={styles.configRow} data-cw-config-row>
            <span style={styles.configLabel}>API状态</span>
            <span style={{ ...styles.configValue, color: llmConfig.apiKey ? '#10b981' : '#ef4444' }}>
              {llmConfig.apiKey ? '✓ 已配置' : '⚠ 未配置'}
            </span>
          </div>
        </div>

        <div style={styles.buttonGroup} data-cw-btn-group>
          {inputSource === 'keyword' ? (
            <button
              style={{ ...styles.button, ...(!canProceedFromInput() || isLoading ? styles.buttonDisabled : {}) }}
              onClick={onSearch}
              disabled={!canProceedFromInput() || isLoading}
              data-cw-btn
            >
              🔍 搜索热点话题
            </button>
          ) : (
            <>
              <button
                style={{ ...styles.button, ...(!canProceedFromInput() || isLoading ? styles.buttonDisabled : {}) }}
                onClick={onNextStep}
                disabled={!canProceedFromInput() || isLoading}
                data-cw-btn
              >
                下一步 →
              </button>
              {inputSource === 'article' && selectedArticleIds.length > 0 && selectedStyleId && (
                <button
                  style={{ ...styles.button, backgroundColor: '#10b981', ...(!canProceedFromInput() || isLoading ? styles.buttonDisabled : {}) }}
                  onClick={onOneClickPublish}
                  disabled={!canProceedFromInput() || isLoading}
                  data-cw-btn
                >
                  ⚡ 批量改写发布
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
