const AUTOSAVE_KEY = 'autosave_drafts';
const AUTOSAVE_INTERVAL = 30000;

interface AutosaveDraft {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  type: 'article' | 'topic' | 'material';
}

class AutosaveManager {
  private intervalId: NodeJS.Timeout | null = null;
  private currentDraftId: string | null = null;
  private onSaveCallback: ((draft: Partial<AutosaveDraft>) => Promise<void>) | null = null;

  getDrafts(): AutosaveDraft[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(AUTOSAVE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveDraft(draft: Partial<AutosaveDraft>): void {
    if (typeof window === 'undefined') return;
    try {
      const drafts = this.getDrafts();
      const existingIndex = drafts.findIndex(d => d.id === draft.id);
      
      const newDraft: AutosaveDraft = {
        id: draft.id || `draft_${Date.now()}`,
        title: draft.title || '',
        content: draft.content || '',
        timestamp: Date.now(),
        type: draft.type || 'article',
      };

      if (existingIndex >= 0) {
        drafts[existingIndex] = newDraft;
      } else {
        drafts.unshift(newDraft);
      }

      if (drafts.length > 50) {
        drafts.splice(50);
      }

      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('[Autosave] Failed to save draft:', error);
    }
  }

  getDraft(id: string): AutosaveDraft | null {
    const drafts = this.getDrafts();
    return drafts.find(d => d.id === id) || null;
  }

  deleteDraft(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const drafts = this.getDrafts();
      const filtered = drafts.filter(d => d.id !== id);
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[Autosave] Failed to delete draft:', error);
    }
  }

  clearOldDrafts(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    if (typeof window === 'undefined') return;
    try {
      const drafts = this.getDrafts();
      const cutoff = Date.now() - maxAge;
      const filtered = drafts.filter(d => d.timestamp > cutoff);
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[Autosave] Failed to clear old drafts:', error);
    }
  }

  startAutosave(
    getDraft: () => Partial<AutosaveDraft>,
    onSave?: (draft: Partial<AutosaveDraft>) => Promise<void>
  ): void {
    this.stopAutosave();
    this.onSaveCallback = onSave || null;
    
    this.intervalId = setInterval(() => {
      const draft = getDraft();
      if (draft.content || draft.title) {
        this.saveDraft(draft);
        if (this.onSaveCallback) {
          this.onSaveCallback(draft).catch(console.error);
        }
      }
    }, AUTOSAVE_INTERVAL);
  }

  stopAutosave(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setCurrentDraftId(id: string | null): void {
    this.currentDraftId = id;
  }

  getCurrentDraftId(): string | null {
    return this.currentDraftId;
  }
}

export const autosaveManager = new AutosaveManager();
export type { AutosaveDraft };
