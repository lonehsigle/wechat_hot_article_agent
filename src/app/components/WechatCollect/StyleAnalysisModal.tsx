'use client';

export interface StyleAnalysisResult {
  articleTitle: string;
  analysis: {
    titleStyle?: { description?: string };
    paragraphStyle?: { structure?: 'short' | 'long' | string; averageLength?: number };
    languageStyle?: {
      formality?: 'formal' | 'casual' | string;
      emotionalTone?: 'positive' | 'negative' | 'mixed' | string;
    };
    writingTechniques?: {
      storytelling?: boolean;
      dataCitation?: boolean;
      questionHook?: boolean;
      callToAction?: boolean;
      contrastTechnique?: boolean;
    };
    vocabulary?: { topWords?: string[] };
  };
  suggestedName: string;
  suggestedDescription: string;
  styleConfig: unknown;
}

interface StyleAnalysisModalProps {
  result: StyleAnalysisResult;
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function StyleAnalysisModal({ result, name, onNameChange, onSave, onClose }: StyleAnalysisModalProps) {
  const techniques = result.analysis.writingTechniques;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '600px', maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>🎨 风格分析结果</h3>
          <button type="button" onClick={onClose} aria-label="关闭风格分析结果" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '13px', color: '#166534', marginBottom: '4px' }}>文章标题</div>
          <div style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937' }}>{result.articleTitle}</div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>风格名称</label>
          <input
            type="text"
            value={name}
            onChange={event => onNameChange(event.target.value)}
            placeholder="输入风格名称..."
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>风格特征</div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <Feature label="标题风格">{result.analysis.titleStyle?.description || '常规风格'}</Feature>
            <Feature label="段落结构">
              {result.analysis.paragraphStyle?.structure === 'short' ? '短小精悍' : result.analysis.paragraphStyle?.structure === 'long' ? '详尽深入' : '长短适中'}，平均 {result.analysis.paragraphStyle?.averageLength || 0} 字/段
            </Feature>
            <Feature label="语言风格">
              {result.analysis.languageStyle?.formality === 'formal' ? '正式严谨' : result.analysis.languageStyle?.formality === 'casual' ? '轻松口语' : '半正式风格'}，情感基调：
              {result.analysis.languageStyle?.emotionalTone === 'positive' ? '积极正面' : result.analysis.languageStyle?.emotionalTone === 'negative' ? '批判反思' : result.analysis.languageStyle?.emotionalTone === 'mixed' ? '情感丰富' : '中性客观'}
            </Feature>

            {techniques && (
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>写作技巧</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {techniques.storytelling && <Technique background="#dbeafe" color="#1d4ed8">📖 故事叙述</Technique>}
                  {techniques.dataCitation && <Technique background="#dcfce7" color="#16a34a">📊 数据支撑</Technique>}
                  {techniques.questionHook && <Technique background="#fef3c7" color="#d97706">❓ 问题引导</Technique>}
                  {techniques.callToAction && <Technique background="#fce7f3" color="#db2777">📢 行动号召</Technique>}
                  {techniques.contrastTechnique && <Technique background="#e0e7ff" color="#4f46e5">⚖️ 对比论证</Technique>}
                </div>
              </div>
            )}

            {result.analysis.vocabulary?.topWords && result.analysis.vocabulary.topWords.length > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>高频词汇</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {result.analysis.vocabulary.topWords.slice(0, 10).map(word => (
                    <span key={word} style={{ padding: '3px 8px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', color: '#374151' }}>{word}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>取消</button>
          <button type="button" onClick={onSave} style={{ padding: '10px 20px', backgroundColor: '#ec4899', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>💾 保存风格</button>
        </div>
      </div>
    </div>
  );
}

function Feature({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#1f2937' }}>{children}</div>
    </div>
  );
}

function Technique({ background, color, children }: { background: string; color: string; children: React.ReactNode }) {
  return <span style={{ padding: '4px 10px', backgroundColor: background, color, borderRadius: '4px', fontSize: '12px' }}>{children}</span>;
}
