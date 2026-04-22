'use client';

import React from 'react';
import { styles, getTitleTypeLabel, getTitleTypeStyle } from '../styles';
import type { TitleOption, ContentAnalysis, CollectedArticle, InputSource } from '../types';

interface Topic {
  id: string;
  title: string;
  source: string;
  likes: number;
  selected: boolean;
}

interface TitleStepProps {
  titleOptions: TitleOption[];
  selectedTitle: string;
  setSelectedTitle: (t: string) => void;
  evaluatingTitles: boolean;
  inputSource: InputSource;
  keyword: string;
  selectedTopicId: string;
  selectedArticleIds: number[];
  collectedArticles: CollectedArticle[];
  topics: Topic[];
  contentAnalysis: ContentAnalysis | null;
  isLoading: boolean;
  onGenerateTitles: () => void;
  onGenerateContent: () => void;
}

export function TitleStep({
  titleOptions,
  selectedTitle,
  setSelectedTitle,
  evaluatingTitles,
  inputSource,
  keyword,
  selectedTopicId,
  selectedArticleIds,
  collectedArticles,
  topics,
  contentAnalysis,
  isLoading,
  onGenerateTitles,
  onGenerateContent,
}: TitleStepProps) {
  const getInputLabel = () => {
    if (inputSource === 'keyword') return keyword;
    if (inputSource === 'topic') return topics.find(t => t.id === selectedTopicId)?.title?.substring(0, 20) + '...' || '';
    if (inputSource === 'article') return `${selectedArticleIds.length}篇文章`;
    return '';
  };

  return (
    <div style={styles.mainContent} data-cw-grid>
      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>
            📝 选择标题
            {evaluatingTitles && <span style={{ fontSize: '12px', color: '#8b5cf6', marginLeft: '8px' }}>AI评估中...</span>}
          </h3>

          {titleOptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              <p>点击下方按钮生成标题</p>
            </div>
          ) : (
            <div style={styles.titleList}>
              {titleOptions.map((title, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.titleItem,
                    ...(selectedTitle === title.text ? styles.titleItemSelected : {}),
                    position: 'relative',
                  }}
                  onClick={() => setSelectedTitle(title.text)}
                  data-cw-title-item
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ ...styles.titleText, flex: 1 }}>
                      {title.evaluation?.totalScore && title.evaluation.totalScore >= 80 && (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          marginRight: '6px'
                        }}>
                          🔥 推荐
                        </span>
                      )}
                      {title.text}
                    </div>
                    {title.evaluation && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: title.evaluation.totalScore >= 80 ? '#dcfce7' : title.evaluation.totalScore >= 60 ? '#fef3c7' : '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: title.evaluation.totalScore >= 80 ? '#166534' : title.evaluation.totalScore >= 60 ? '#92400e' : '#64748b',
                        whiteSpace: 'nowrap',
                      }}>
                        <span>{title.evaluation.totalScore}分</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ ...styles.titleType, ...getTitleTypeStyle(title.type) }}>
                      {getTitleTypeLabel(title.type)}
                    </span>

                    {title.evaluation && (
                      <>
                        {title.evaluation.clickScore !== undefined && (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            点击{title.evaluation.clickScore}%
                          </span>
                        )}
                        {title.evaluation.viralScore !== undefined && (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            热门{title.evaluation.viralScore}%
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {title.evaluation?.analysis && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#64748b',
                      lineHeight: '1.4',
                    }}>
                      💡 {title.evaluation.analysis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={styles.buttonGroup} data-cw-btn-group>
            <button
              style={styles.buttonSecondary}
              onClick={onGenerateTitles}
              disabled={isLoading || evaluatingTitles}
              data-cw-btn
            >
              🔄 重新生成
            </button>
            <button
              style={{ ...styles.button, ...(!selectedTitle || isLoading ? styles.buttonDisabled : {}) }}
              onClick={onGenerateContent}
              disabled={!selectedTitle || isLoading}
              data-cw-btn
            >
              确认标题，生成内容 →
            </button>
          </div>
        </div>
      </div>

      <div>
        <div style={styles.card} data-cw-card>
          <h3 style={styles.cardTitle} data-cw-card-title>📊 输入信息</h3>
          <div style={styles.configCard} data-cw-config-card>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>输入来源</span>
              <span style={styles.configValue}>
                {inputSource === 'keyword' ? '关键词搜索' :
                 inputSource === 'topic' ? '选题库' : '已采集文章'}
              </span>
            </div>
            <div style={styles.configRow} data-cw-config-row>
              <span style={styles.configLabel}>关键词/主题</span>
              <span style={styles.configValue}>{getInputLabel()}</span>
            </div>
            {inputSource === 'article' && selectedArticleIds.length > 0 && (
              <div style={{ ...styles.configRow, borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }} data-cw-config-row>
                <span style={styles.configLabel}>参考文章</span>
                <span style={{ ...styles.configValue, fontSize: '12px', maxWidth: '200px', wordBreak: 'break-all' }}>
                  {collectedArticles.filter(a => selectedArticleIds.includes(a.id)).map(a => a.title).join('、').substring(0, 50)}...
                </span>
              </div>
            )}

            {contentAnalysis && (
              <div style={{
                ...styles.configRow,
                borderTop: '1px solid #e2e8f0',
                paddingTop: '12px',
                marginTop: '8px',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '8px',
              }} data-cw-config-row>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <span style={styles.configLabel}>内容类型</span>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    {contentAnalysis.typeName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    置信度 {contentAnalysis.confidence}%
                  </span>
                </div>

                {contentAnalysis.features?.length > 0 && (
                  <div style={{ width: '100%' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>特征识别：</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {contentAnalysis.features.map((f, i) => (
                        <span key={i} style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          borderRadius: '3px',
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {contentAnalysis.suggestions?.length > 0 && (
                  <div style={{ width: '100%' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>改写建议：</span>
                    <div style={{ fontSize: '11px', color: '#059669', lineHeight: '1.5' }}>
                      {contentAnalysis.suggestions[0]}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
