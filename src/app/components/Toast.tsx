'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.container}>
        {toasts.map((toast, index) => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            index={index}
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  index: number;
  onClose: () => void;
}

function ToastItem({ toast, index, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, toast.duration);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev - (100 / (toast.duration / 50));
        return next > 0 ? next : 0;
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [toast.duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const typeConfig = {
    success: { 
      backgroundColor: 'rgba(16, 185, 129, 0.95)', 
      borderColor: '#059669',
      iconColor: '#059669',
      progressColor: '#059669',
      icon: '✓',
    },
    error: { 
      backgroundColor: 'rgba(239, 68, 68, 0.95)', 
      borderColor: '#dc2626',
      iconColor: '#dc2626',
      progressColor: '#dc2626',
      icon: '✕',
    },
    warning: { 
      backgroundColor: 'rgba(245, 158, 11, 0.95)', 
      borderColor: '#d97706',
      iconColor: '#d97706',
      progressColor: '#d97706',
      icon: '⚠',
    },
    info: { 
      backgroundColor: 'rgba(59, 130, 246, 0.95)', 
      borderColor: '#2563eb',
      iconColor: '#2563eb',
      progressColor: '#2563eb',
      icon: 'ℹ',
    },
  };

  const config = typeConfig[toast.type];

  return (
    <div 
      style={{ 
        ...styles.toast, 
        ...styles[toast.type],
        animation: isExiting ? 'slideOut 0.3s ease-in forwards' : `slideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`,
        marginTop: index > 0 ? '10px' : '0',
      }}
    >
      <span style={{ ...styles.icon, backgroundColor: config.iconColor + '30' }}>{config.icon}</span>
      <span style={styles.message}>{toast.message}</span>
      <button onClick={handleClose} style={styles.closeButton}>×</button>
      {/* Progress bar */}
      <div style={{
        ...styles.progressBar,
        width: `${progress}%`,
        backgroundColor: config.progressColor,
      }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: '420px',
    width: 'calc(100vw - 40px)',
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    borderRadius: '12px',
    color: 'white',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)',
    borderLeft: '4px solid',
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
    minWidth: '300px',
    maxWidth: '400px',
    transition: 'all 0.3s ease',
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
    borderColor: '#059669',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    borderColor: '#dc2626',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.92)',
    borderColor: '#d97706',
  },
  info: {
    backgroundColor: 'rgba(59, 130, 246, 0.92)',
    borderColor: '#2563eb',
  },
  icon: {
    fontSize: '16px',
    fontWeight: 'bold',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#fff',
  },
  message: {
    flex: 1,
    fontSize: '14px',
    lineHeight: 1.5,
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    opacity: 0.7,
    transition: 'all 0.2s',
    flexShrink: 0,
    marginLeft: '4px',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    borderRadius: '0 0 0 2px',
    transition: 'width 0.05s linear',
  },
};

export default ToastProvider;
