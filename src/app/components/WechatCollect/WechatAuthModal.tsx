'use client';

interface WechatAuthModalProps {
  mode: 'qrcode' | 'cookie';
  qrCodeUrl: string | null;
  polling: boolean;
  loading: boolean;
  cookie: string;
  onModeChange: (mode: 'qrcode' | 'cookie') => void;
  onCookieChange: (cookie: string) => void;
  onStart: () => void;
  onSubmitCookie: () => void;
  onClose: () => void;
}

export function WechatAuthModal({
  mode,
  qrCodeUrl,
  polling,
  loading,
  cookie,
  onModeChange,
  onCookieChange,
  onStart,
  onSubmitCookie,
  onClose,
}: WechatAuthModalProps) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '500px', maxWidth: '90vw', padding: '24px' }} onClick={event => event.stopPropagation()}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>📱 微信授权配置</h3>

        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onModeChange('qrcode')}
            style={{ flex: 1, padding: '10px 16px', backgroundColor: mode === 'qrcode' ? '#07c160' : '#f3f4f6', color: mode === 'qrcode' ? '#fff' : '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
          >
            扫码授权
          </button>
          <button
            type="button"
            onClick={() => onModeChange('cookie')}
            style={{ flex: 1, padding: '10px 16px', backgroundColor: mode === 'cookie' ? '#E8652D' : '#f3f4f6', color: mode === 'cookie' ? '#fff' : '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
          >
            Cookie授权
          </button>
        </div>

        {mode === 'qrcode' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {qrCodeUrl ? (
              <div>
                <img src={qrCodeUrl} alt="微信扫码登录" style={{ width: '200px', height: '200px', border: '2px solid #e5e7eb', borderRadius: '8px' }} />
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>{polling ? '⏳ 等待扫码授权中...' : '请使用微信扫描二维码'}</p>
                {polling && <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '8px' }}>授权中，请勿关闭此窗口...</p>}
                <button
                  type="button"
                  onClick={onStart}
                  disabled={polling}
                  style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: polling ? '#d1d5db' : '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: polling ? 'not-allowed' : 'pointer' }}
                >
                  刷新二维码
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>点击下方按钮启动扫码授权流程</p>
                <button
                  type="button"
                  onClick={onStart}
                  disabled={loading}
                  style={{ padding: '12px 24px', backgroundColor: loading ? '#d1d5db' : '#07c160', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? '启动中...' : '🚀 启动扫码授权'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>微信 Cookie</label>
            <textarea
              value={cookie}
              onChange={event => onCookieChange(event.target.value)}
              placeholder="请粘贴从微信公众平台获取的Cookie..."
              style={{ width: '100%', height: '80px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '4px' }}><strong>获取方法：</strong></p>
              <p>1. 登录 <a href="https://mp.weixin.qq.com" target="_blank" rel="noopener noreferrer" style={{ color: '#E8652D' }}>微信公众平台</a></p>
              <p>2. 打开浏览器开发者工具 (F12)</p>
              <p>3. 切换到 Network 标签，刷新页面</p>
              <p>4. 找到任意请求，复制 Cookie 值</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>取消</button>
          {mode === 'cookie' && (
            <button type="button" onClick={onSubmitCookie} disabled={loading} style={{ padding: '8px 16px', backgroundColor: loading ? '#9ca3af' : '#07c160', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '授权中...' : '确认授权'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
