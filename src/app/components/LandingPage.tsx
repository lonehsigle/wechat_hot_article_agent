'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: '🔥',
    title: '热点聚合',
    description: '实时监控全网热点话题，智能推荐优质选题方向',
    color: '#ef4444',
  },
  {
    icon: '📥',
    title: '文章采集',
    description: '一键采集微信公众号文章，建立专属素材库',
    color: '#3b82f6',
  },
  {
    icon: '✍️',
    title: 'AI创作',
    description: '智能生成高质量文章，支持多种写作风格',
    color: '#10b981',
  },
  {
    icon: '📊',
    title: '数据分析',
    description: '深度分析文章表现，优化内容策略',
    color: '#8b5cf6',
  },
  {
    icon: '🔄',
    title: '闭环优化',
    description: '持续追踪内容效果，智能优化创作方向',
    color: '#f59e0b',
  },
  {
    icon: '🔍',
    title: '选题分析',
    description: 'AI评估选题潜力，提升爆款命中率',
    color: '#06b6d4',
  },
];

const stats = [
  { value: '10+', label: '支持平台' },
  { value: '100+', label: '热点源' },
  { value: 'AI', label: '智能创作' },
  { value: '24/7', label: '实时监控' },
];

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.username.trim()) errors.username = '请输入用户名';
    if (loginMode === 'register' && !formData.email.trim()) errors.email = '请输入邮箱';
    if (loginMode === 'register' && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    if (!formData.password.trim()) errors.password = '请输入密码';
    if (formData.password.trim() && formData.password.length < 6) errors.password = '密码至少6位';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: loginMode,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/app');
      } else {
        setError(data.error || '操作失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page" style={styles.container}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📊</span>
          <span style={styles.logoText}>内容工作台</span>
        </div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>功能特性</a>
          <a href="#about" style={styles.navLink}>关于我们</a>
          <button 
            className="btn-ghost"
            style={{ ...styles.loginBtn, ...styles.btnGhostOverride }}
            onClick={() => {
              setShowLogin(true);
              setLoginMode('login');
              setFieldErrors({});
              setError('');
            }}
          >
            登录
          </button>
          <button 
            className="btn-primary"
            style={{ ...styles.registerBtn, ...styles.btnPrimaryOverride }}
            onClick={() => {
              setShowLogin(true);
              setLoginMode('register');
              setFieldErrors({});
              setError('');
            }}
          >
            免费注册
          </button>
        </div>
      </nav>

      <section className="hero-gradient" style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            智能内容创作平台
            <br />
            <span style={styles.heroHighlight}>让创作更高效</span>
          </h1>
          <p style={styles.heroDesc}>
            集热点监控、素材采集、AI创作、数据分析于一体
            <br />
            助力内容创作者打造爆款内容
          </p>
          <div style={styles.heroActions}>
            <button 
              className="btn-primary cta-pulse"
              style={{ ...styles.primaryBtn, ...styles.btnPrimaryOverride }}
              onClick={() => {
                setShowLogin(true);
                setLoginMode('register');
                setFieldErrors({});
                setError('');
              }}
            >
              立即开始使用
            </button>
            <button 
              className="btn-secondary"
              style={{ ...styles.secondaryBtn, ...styles.btnSecondaryOverride }}
              onClick={scrollToFeatures}
            >
              了解更多
            </button>
          </div>
        </div>
        <div style={styles.heroImage}>
          <div className="animate-float" style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <span style={styles.previewDot} />
              <span style={{ ...styles.previewDot, backgroundColor: '#fbbf24' }} />
              <span style={{ ...styles.previewDot, backgroundColor: '#10b981' }} />
            </div>
            <div style={styles.previewContent}>
              <div style={styles.previewSidebar}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={styles.previewNavItem} />
                ))}
              </div>
              <div style={styles.previewMain}>
                <div style={styles.previewTitle} />
                <div style={styles.previewText} />
                <div style={{ ...styles.previewText, width: '80%' }} />
                <div style={styles.previewCards}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={styles.previewCardItem} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" style={styles.features}>
        <h2 style={styles.sectionTitle}>核心功能</h2>
        <p style={styles.sectionDesc}>全方位满足内容创作需求</p>
        <div className="feature-grid" style={styles.featureGrid}>
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="card card-hover feature-lift"
              style={{ ...styles.featureCard, animationDelay: `${index * 0.1}s` }}
            >
              <div style={{ 
                ...styles.featureIcon, 
                backgroundColor: `${feature.color}15`,
                color: feature.color,
              }}>
                {feature.icon}
              </div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.stats}>
        <div style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className="stat-animate" style={{ ...styles.statItem, animationDelay: `${index * 0.15}s` }}>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" style={styles.about}>
        <h2 style={styles.sectionTitle}>为什么选择我们</h2>
        <div className="about-grid" style={styles.aboutGrid}>
          <div className="card card-hover" style={styles.aboutCard}>
            <div style={styles.aboutIcon}>🎯</div>
            <h3 style={styles.aboutTitle}>精准选题</h3>
            <p style={styles.aboutDesc}>
              AI智能分析热点趋势，精准推荐高潜力选题方向
            </p>
          </div>
          <div className="card card-hover" style={styles.aboutCard}>
            <div style={styles.aboutIcon}>⚡</div>
            <h3 style={styles.aboutTitle}>高效创作</h3>
            <p style={styles.aboutDesc}>
              一键生成高质量文章，大幅提升创作效率
            </p>
          </div>
          <div className="card card-hover" style={styles.aboutCard}>
            <div style={styles.aboutIcon}>📈</div>
            <h3 style={styles.aboutTitle}>数据驱动</h3>
            <p style={styles.aboutDesc}>
              实时追踪内容表现，用数据优化创作策略
            </p>
          </div>
        </div>
      </section>

      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>开始您的内容创作之旅</h2>
        <p style={styles.ctaDesc}>免费注册，立即体验智能创作</p>
        <button 
          className="btn-primary cta-pulse"
          style={{ ...styles.ctaBtn, ...styles.btnPrimaryOverride, padding: '16px 48px', fontSize: '18px' }}
          onClick={() => {
            setShowLogin(true);
            setLoginMode('register');
            setFieldErrors({});
            setError('');
          }}
        >
          免费注册
        </button>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <span style={styles.footerLogo}>📊</span>
            <span>内容工作台</span>
          </div>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>使用条款</a>
            <a href="#" style={styles.footerLink}>隐私政策</a>
            <a href="#" style={styles.footerLink}>帮助中心</a>
          </div>
          <div style={styles.footerCopyright}>
            © 2026 内容工作台. All rights reserved.
          </div>
        </div>
      </footer>

      {showLogin && (
        <div style={styles.modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {loginMode === 'login' ? '登录' : '注册账号'}
              </h3>
              <button 
                style={styles.modalClose}
                onClick={() => setShowLogin(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalBody}>
              {error && (
                <div className="animate-slide-in-up" style={styles.errorMsg}>{error}</div>
              )}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>用户名</label>
                <input
                  type="text"
                  className={fieldErrors.username ? 'input input-error' : 'input'}
                  style={{ ...styles.formInput, ...(fieldErrors.username ? styles.inputError : {}) }}
                  value={formData.username}
                  onChange={e => {
                    setFormData({ ...formData, username: e.target.value });
                    if (fieldErrors.username) {
                      setFieldErrors(prev => { const n = { ...prev }; delete n.username; return n; });
                    }
                  }}
                  placeholder="请输入用户名"
                />
                {fieldErrors.username && (
                  <div style={styles.fieldError}>{fieldErrors.username}</div>
                )}
              </div>
              {loginMode === 'register' && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>邮箱</label>
                  <input
                    type="email"
                    className={fieldErrors.email ? 'input input-error' : 'input'}
                    style={{ ...styles.formInput, ...(fieldErrors.email ? styles.inputError : {}) }}
                    value={formData.email}
                    onChange={e => {
                      setFormData({ ...formData, email: e.target.value });
                      if (fieldErrors.email) {
                        setFieldErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                      }
                    }}
                    placeholder="请输入邮箱"
                  />
                  {fieldErrors.email && (
                    <div style={styles.fieldError}>{fieldErrors.email}</div>
                  )}
                </div>
              )}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>密码</label>
                <input
                  type="password"
                  className={fieldErrors.password ? 'input input-error' : 'input'}
                  style={{ ...styles.formInput, ...(fieldErrors.password ? styles.inputError : {}) }}
                  value={formData.password}
                  onChange={e => {
                    setFormData({ ...formData, password: e.target.value });
                    if (fieldErrors.password) {
                      setFieldErrors(prev => { const n = { ...prev }; delete n.password; return n; });
                    }
                  }}
                  placeholder="请输入密码"
                />
                {fieldErrors.password && (
                  <div style={styles.fieldError}>{fieldErrors.password}</div>
                )}
              </div>
              {loginMode === 'register' && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>昵称（可选）</label>
                  <input
                    type="text"
                    className="input"
                    style={styles.formInput}
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="请输入昵称"
                  />
                </div>
              )}
              <button 
                type="submit" 
                className="btn-primary"
                style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? '处理中...' : (loginMode === 'login' ? '登录' : '注册')}
              </button>
              <div style={styles.switchMode}>
                {loginMode === 'login' ? (
                  <>
                    还没有账号？
                    <button 
                      type="button"
                      style={styles.switchBtn}
                      onClick={() => {
                        setLoginMode('register');
                        setError('');
                        setFieldErrors({});
                        setFormData({
                          username: '',
                          email: '',
                          password: '',
                          displayName: '',
                        });
                      }}
                    >
                      立即注册
                    </button>
                  </>
                ) : (
                  <>
                    已有账号？
                    <button 
                      type="button"
                      style={styles.switchBtn}
                      onClick={() => {
                        setLoginMode('login');
                        setError('');
                        setFieldErrors({});
                        setFormData({
                          username: '',
                          email: '',
                          password: '',
                          displayName: '',
                        });
                      }}
                    >
                      立即登录
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* CSS overrides for class compatibility */
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 48px',
    borderBottom: '1px solid #f3f4f6',
    position: 'sticky',
    top: 0,
    backgroundColor: '#ffffffee',
    backdropFilter: 'blur(12px)',
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1f2937',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  btnPrimaryOverride: {
    borderRadius: '8px',
    fontWeight: 600,
  },
  btnSecondaryOverride: {
    borderRadius: '8px',
    fontWeight: 600,
    border: '2px solid #e5e7eb',
    backgroundColor: 'transparent',
    color: '#374151',
  },
  btnGhostOverride: {
    borderRadius: '8px',
    fontWeight: 500,
    border: '1px solid #d1d5db',
    backgroundColor: 'transparent',
    color: '#374151',
  },
  loginBtn: {
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  registerBtn: {
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '80px 48px',
    maxWidth: '1280px',
    margin: '0 auto',
    gap: '64px',
    minHeight: '70vh',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#1f2937',
    lineHeight: 1.2,
    marginBottom: '24px',
  },
  heroHighlight: {
    background: 'linear-gradient(135deg, #E8652D, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroDesc: {
    fontSize: '18px',
    color: '#6b7280',
    lineHeight: 1.8,
    marginBottom: '32px',
  },
  heroActions: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    padding: '14px 32px',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondaryBtn: {
    padding: '14px 32px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  heroImage: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  previewCard: {
    width: '480px',
    height: '320px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  previewDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
  },
  previewContent: {
    display: 'flex',
    height: 'calc(100% - 44px)',
  },
  previewSidebar: {
    width: '60px',
    backgroundColor: '#f9fafb',
    borderRight: '1px solid #e5e7eb',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  previewNavItem: {
    width: '100%',
    height: '24px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
  },
  previewMain: {
    flex: 1,
    padding: '16px',
  },
  previewTitle: {
    width: '60%',
    height: '20px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  previewText: {
    width: '100%',
    height: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  previewCards: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  previewCardItem: {
    flex: 1,
    height: '80px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
  },
  features: {
    padding: '80px 48px',
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '12px',
  },
  sectionDesc: {
    fontSize: '18px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '48px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
  },
  featureIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '12px',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.6,
  },
  stats: {
    padding: '64px 48px',
    backgroundColor: '#E8652D',
  },
  statsGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '96px',
    maxWidth: '1200px',
    margin: '0 auto',
    flexWrap: 'wrap',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  about: {
    padding: '80px 48px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  aboutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
  },
  aboutCard: {
    textAlign: 'center',
    padding: '32px',
  },
  aboutIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  aboutTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '12px',
  },
  aboutDesc: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.6,
  },
  cta: {
    padding: '80px 48px',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '16px',
  },
  ctaDesc: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '32px',
  },
  ctaBtn: {
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: {
    padding: '48px',
    backgroundColor: '#1f2937',
    color: '#ffffff',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    fontWeight: 600,
  },
  footerLogo: {
    fontSize: '24px',
  },
  footerLinks: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
  },
  footerLink: {
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s',
  },
  footerCopyright: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '420px',
    maxWidth: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 24px 0',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1f2937',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#9ca3af',
    cursor: 'pointer',
    lineHeight: 1,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  modalBody: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
  },
  fieldError: {
    fontSize: '13px',
    color: '#ef4444',
    marginTop: '6px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'all 0.2s',
  },
  switchMode: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#6b7280',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#E8652D',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginLeft: '4px',
    transition: 'color 0.2s',
  },
  errorMsg: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
  },
};
