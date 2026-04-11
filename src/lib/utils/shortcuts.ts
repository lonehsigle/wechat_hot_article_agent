type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

class ShortcutManager {
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      if (!e.ctrlKey && !e.metaKey) return;
    }

    const key = e.key.toLowerCase();
    const shortcutKey = this.buildShortcutKey(key, e.ctrlKey || e.metaKey, e.shiftKey, e.altKey);
    
    const config = this.shortcuts.get(shortcutKey);
    if (config) {
      e.preventDefault();
      config.handler();
    }
  };

  private buildShortcutKey(key: string, ctrl: boolean, shift: boolean, alt: boolean): string {
    const parts: string[] = [];
    if (ctrl) parts.push('ctrl');
    if (shift) parts.push('shift');
    if (alt) parts.push('alt');
    parts.push(key);
    return parts.join('+');
  }

  register(config: ShortcutConfig): () => void {
    const key = this.buildShortcutKey(config.key, config.ctrl ?? false, config.shift ?? false, config.alt ?? false);
    this.shortcuts.set(key, config);
    return () => this.shortcuts.delete(key);
  }

  unregister(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean): void {
    const shortcutKey = this.buildShortcutKey(key, ctrl ?? false, shift ?? false, alt ?? false);
    this.shortcuts.delete(shortcutKey);
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  getShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
    }
    this.shortcuts.clear();
  }
}

export const shortcutManager = new ShortcutManager();

export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, description: '保存当前内容' },
  NEW_ARTICLE: { key: 'n', ctrl: true, description: '新建文章' },
  SEARCH: { key: 'k', ctrl: true, description: '搜索' },
  PUBLISH: { key: 'p', ctrl: true, shift: true, description: '发布文章' },
  PREVIEW: { key: 'p', ctrl: true, description: '预览文章' },
  UNDO: { key: 'z', ctrl: true, description: '撤销' },
  REDO: { key: 'z', ctrl: true, shift: true, description: '重做' },
  BOLD: { key: 'b', ctrl: true, description: '加粗' },
  ITALIC: { key: 'i', ctrl: true, description: '斜体' },
  HEADING: { key: 'h', ctrl: true, alt: true, description: '标题' },
  LINK: { key: 'l', ctrl: true, description: '插入链接' },
  IMAGE: { key: 'g', ctrl: true, description: '插入图片' },
} as const;

export type ShortcutType = keyof typeof SHORTCUTS;
