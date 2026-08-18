'use client';

interface ParsedSubscription {
  biz: string;
  nickname: string;
  articleTitle: string;
}

interface AddSubscriptionModalProps {
  url: string;
  parsing: boolean;
  parsedInfo: ParsedSubscription | null;
  onUrlChange: (url: string) => void;
  onParse: () => void;
  onAdd: () => void;
  onClose: () => void;
}

export function AddSubscriptionModal({
  url,
  parsing,
  parsedInfo,
  onUrlChange,
  onParse,
  onAdd,
  onClose,
}: AddSubscriptionModalProps) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '500px', maxWidth: '90vw', padding: '24px' }} onClick={event => event.stopPropagation()}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>➕ 添加公众号</h3>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>公众号文章链接</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={url}
              onChange={event => onUrlChange(event.target.value)}
              placeholder="https://mp.weixin.qq.com/s/..."
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
            <button
              type="button"
              onClick={onParse}
              disabled={parsing || !url.trim()}
              style={{ padding: '10px 16px', backgroundColor: parsing ? '#9ca3af' : '#E8652D', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: parsing ? 'not-allowed' : 'pointer' }}
            >
              {parsing ? '解析中...' : '解析'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>输入任意一篇该公众号的文章链接，点击&quot;解析&quot;获取公众号信息</p>
        </div>

        {parsedInfo && (
          <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>📰</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#166534' }}>{parsedInfo.nickname}</span>
            </div>
            {parsedInfo.articleTitle && (
              <div style={{ fontSize: '13px', color: '#6b7280' }}>示例文章：{parsedInfo.articleTitle}</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>取消</button>
          <button type="button" onClick={onAdd} disabled={!parsedInfo} style={{ padding: '8px 16px', backgroundColor: parsedInfo ? '#10b981' : '#e5e7eb', color: parsedInfo ? '#fff' : '#9ca3af', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: parsedInfo ? 'pointer' : 'not-allowed' }}>添加公众号</button>
        </div>
      </div>
    </div>
  );
}
