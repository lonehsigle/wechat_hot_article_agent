let toastContainer: HTMLDivElement | null = null;

type ToastType = 'success' | 'error' | 'warning' | 'info';

function getContainer(): HTMLDivElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function getTypeStyles(type: ToastType): string {
  const styles: Record<ToastType, string> = {
    success: 'background-color: #10b981; border-left: 4px solid #059669;',
    error: 'background-color: #ef4444; border-left: 4px solid #dc2626;',
    warning: 'background-color: #f59e0b; border-left: 4px solid #d97706;',
    info: 'background-color: #3b82f6; border-left: 4px solid #2563eb;',
  };
  return styles[type];
}

function getTypeIcon(type: ToastType): string {
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
  return icons[type];
}

export function showToast(message: string, type: ToastType = 'info', duration: number = 3000): void {
  if (typeof window === 'undefined') return;
  
  const container = getContainer();
  const toast = document.createElement('div');
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    ${getTypeStyles(type)}
    animation: slideIn 0.3s ease-out;
    font-size: 14px;
    line-height: 1.5;
  `;
  
  const icon = document.createElement('span');
  icon.textContent = getTypeIcon(type);
  icon.style.cssText = 'font-size: 16px; font-weight: bold;';
  
  const text = document.createElement('span');
  text.textContent = message;
  text.style.cssText = 'flex: 1;';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
    opacity: 0.7;
  `;
  closeBtn.onclick = () => toast.remove();
  
  toast.appendChild(icon);
  toast.appendChild(text);
  toast.appendChild(closeBtn);
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export default { showToast };
