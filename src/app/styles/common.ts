import React from 'react';

// ============================================
// Common Style Functions for WeChat Content Platform
// Centralized reusable CSS-in-JS style utilities
// ============================================

// Color System
export const colors = {
  primary: '#E8652D',
  primaryDark: '#d4551f',
  primaryLight: 'rgba(232, 101, 45, 0.1)',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f6f8',
  bgDark: '#1e293b',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  borderColor: '#e2e8f0',
  borderColorLight: '#f1f5f9',
  surfaceRaised: '#ffffff',
  surfaceSunken: '#f8fafc',
} as const;

// Border Radius
export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.12)',
  primary: '0 4px 14px rgba(232, 101, 45, 0.35)',
  card: '0 1px 3px rgba(0, 0, 0, 0.1)',
  cardHover: '0 12px 24px rgba(0, 0, 0, 0.1)',
} as const;

// Transitions
export const transitions = {
  default: 'all 0.2s ease',
  fast: 'all 0.15s ease',
  slow: 'all 0.3s ease',
  bounce: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ============================================
// Button Style Generators
// ============================================

export function btnPrimary(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: transitions.default,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...overrides,
  };
}

export function btnSecondary(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: transitions.default,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...overrides,
  };
}

export function btnGhost(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: 'none',
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: transitions.default,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...overrides,
  };
}

export function btnDanger(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    ...btnPrimary(),
    backgroundColor: colors.danger,
    ...overrides,
  };
}

export function btnSuccess(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    ...btnPrimary(),
    backgroundColor: colors.success,
    ...overrides,
  };
}

// ============================================
// Card Style Generators
// ============================================

export function card(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.lg,
    padding: '20px',
    border: `1px solid ${colors.borderColor}`,
    transition: transitions.default,
    ...overrides,
  };
}

export function cardHover(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    ...card(),
    cursor: 'pointer',
    ...overrides,
  };
}

export function cardElevated(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.lg,
    padding: '20px',
    border: `1px solid ${colors.borderColor}`,
    boxShadow: shadows.card,
    transition: transitions.bounce,
    ...overrides,
  };
}

// ============================================
// Input Style Generators
// ============================================

export function input(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.md,
    fontSize: '14px',
    color: colors.textPrimary,
    backgroundColor: colors.bgPrimary,
    outline: 'none',
    transition: transitions.default,
    ...overrides,
  };
}

export function inputError(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    ...input(),
    borderColor: colors.danger,
    boxShadow: `0 0 0 3px ${colors.danger}20`,
    ...overrides,
  };
}

export function textarea(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    ...input(),
    minHeight: '100px',
    resize: 'vertical',
    ...overrides,
  };
}

export function select(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    ...input(),
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
    ...overrides,
  };
}

// ============================================
// Badge / Tag Style Generators
// ============================================

export function badge(variant: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' = 'primary', overrides?: React.CSSProperties): React.CSSProperties {
  const variantColors = {
    primary: { bg: colors.primaryLight, color: colors.primary },
    success: { bg: 'rgba(16, 185, 129, 0.1)', color: colors.success },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', color: colors.warning },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', color: colors.danger },
    secondary: { bg: 'rgba(59, 130, 246, 0.1)', color: colors.secondary },
  };

  const vc = variantColors[variant];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: radius.full,
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1,
    backgroundColor: vc.bg,
    color: vc.color,
    ...overrides,
  };
}

export function tag(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: colors.surfaceSunken,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.sm,
    fontSize: '13px',
    color: colors.textPrimary,
    ...overrides,
  };
}

// ============================================
// Modal Style Generators
// ============================================

export function modalOverlay(overrides?: React.CSSProperties): React.CSSProperties {
  return {
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
    ...overrides,
  };
}

export function modal(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.xl,
    width: '480px',
    maxWidth: '100%',
    overflow: 'hidden',
    boxShadow: shadows.xl,
    ...overrides,
  };
}

export function modalHeader(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: `1px solid ${colors.borderColor}`,
    ...overrides,
  };
}

export function modalBody(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    padding: '24px',
    ...overrides,
  };
}

export function modalFooter(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: `1px solid ${colors.borderColor}`,
    backgroundColor: colors.surfaceSunken,
    ...overrides,
  };
}

// ============================================
// Form Style Generators
// ============================================

export function formGroup(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    marginBottom: '20px',
    ...overrides,
  };
}

export function formLabel(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: colors.textPrimary,
    marginBottom: '8px',
    ...overrides,
  };
}

export function formError(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    fontSize: '13px',
    color: colors.danger,
    marginTop: '6px',
    ...overrides,
  };
}

// ============================================
// Layout Style Generators
// ============================================

export function flexRow(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    ...overrides,
  };
}

export function flexCol(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    ...overrides,
  };
}

export function grid(cols: number | string, gap: string = '16px', overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: typeof cols === 'number' ? `repeat(${cols}, 1fr)` : cols,
    gap,
    ...overrides,
  };
}

export function responsiveGrid(minWidth: string = '280px', gap: string = '16px', overrides?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
    gap,
    ...overrides,
  };
}

// ============================================
// Skeleton / Loading Style Generators
// ============================================

export function skeleton(width?: string, height?: string, overrides?: React.CSSProperties): React.CSSProperties {
  return {
    width: width || '100%',
    height: height || '20px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: radius.sm,
    animation: 'skeleton-loading 1.5s ease-in-out infinite',
    ...overrides,
  };
}

export function skeletonCircle(size: string = '40px', overrides?: React.CSSProperties): React.CSSProperties {
  return {
    ...skeleton(size, size),
    borderRadius: '50%',
    ...overrides,
  };
}

// ============================================
// Section / Page Header Style Generators
// ============================================

export function pageHeader(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    marginBottom: '24px',
    ...overrides,
  };
}

export function pageTitle(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    fontSize: '24px',
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: '8px',
    ...overrides,
  };
}

export function pageSubtitle(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    fontSize: '14px',
    color: colors.textSecondary,
    ...overrides,
  };
}

export function sectionTitle(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '16px',
    ...overrides,
  };
}

// ============================================
// Scrollable Table Wrapper
// ============================================

export function tableScroll(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderRadius: radius.lg,
    border: `1px solid ${colors.borderColor}`,
    ...overrides,
  };
}

// ============================================
// Status Color Helpers
// ============================================

export function statusColor(status: string): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    published: { bg: 'rgba(16, 185, 129, 0.1)', color: colors.success },
    draft: { bg: 'rgba(245, 158, 11, 0.1)', color: colors.warning },
    pending: { bg: 'rgba(59, 130, 246, 0.1)', color: colors.secondary },
    error: { bg: 'rgba(239, 68, 68, 0.1)', color: colors.danger },
    processing: { bg: 'rgba(232, 101, 45, 0.1)', color: colors.primary },
    success: { bg: 'rgba(16, 185, 129, 0.1)', color: colors.success },
    failed: { bg: 'rgba(239, 68, 68, 0.1)', color: colors.danger },
    active: { bg: 'rgba(16, 185, 129, 0.1)', color: colors.success },
    inactive: { bg: 'rgba(107, 114, 128, 0.1)', color: colors.textSecondary },
  };
  return map[status] || { bg: colors.surfaceSunken, color: colors.textSecondary };
}

// ============================================
// Media Query Helpers (for use in components)
// ============================================

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= breakpoints.md;
}

export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > breakpoints.md && window.innerWidth <= breakpoints.lg;
}

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth > breakpoints.lg;
}
