import { describe, it, expect, beforeEach, vi } from 'vitest';
import { autosaveManager } from '@/lib/utils/autosave';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
global.window = {} as Window & typeof globalThis;

describe('autosaveManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    autosaveManager.stopAutosave();
  });

  it('saves and retrieves drafts', () => {
    autosaveManager.saveDraft({ id: 'd1', title: 'Draft 1', content: 'Content' });
    const draft = autosaveManager.getDraft('d1');
    expect(draft?.title).toBe('Draft 1');
    expect(draft?.content).toBe('Content');
  });

  it('updates existing draft', () => {
    autosaveManager.saveDraft({ id: 'd1', title: 'Old', content: 'Old' });
    autosaveManager.saveDraft({ id: 'd1', title: 'New', content: 'New' });
    const draft = autosaveManager.getDraft('d1');
    expect(draft?.title).toBe('New');
  });

  it('returns null for missing draft', () => {
    expect(autosaveManager.getDraft('missing')).toBeNull();
  });

  it('deletes draft', () => {
    autosaveManager.saveDraft({ id: 'd1', title: 'T', content: 'C' });
    autosaveManager.deleteDraft('d1');
    expect(autosaveManager.getDraft('d1')).toBeNull();
  });

  it('limits drafts to 50', () => {
    for (let i = 0; i < 55; i++) {
      autosaveManager.saveDraft({ id: `d${i}`, title: `Draft ${i}`, content: 'C' });
    }
    const drafts = autosaveManager.getDrafts();
    expect(drafts.length).toBeLessThanOrEqual(50);
  });

  it('clears old drafts', () => {
    const oldDraft = {
      id: 'old', title: 'Old', content: 'C', timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, type: 'article' as const,
    };
    localStorageMock.setItem('autosave_drafts', JSON.stringify([oldDraft]));
    autosaveManager.clearOldDrafts();
    expect(autosaveManager.getDrafts().length).toBe(0);
  });

  it('starts and stops autosave', () => {
    vi.useFakeTimers();
    const saveSpy = vi.fn().mockResolvedValue(undefined);
    autosaveManager.startAutosave(() => ({ id: 'd1', title: 'T', content: 'C' }), saveSpy);
    vi.advanceTimersByTime(30000);
    expect(saveSpy).toHaveBeenCalled();
    autosaveManager.stopAutosave();
    vi.useRealTimers();
  });

  it('manages current draft id', () => {
    autosaveManager.setCurrentDraftId('draft-123');
    expect(autosaveManager.getCurrentDraftId()).toBe('draft-123');
    autosaveManager.setCurrentDraftId(null);
    expect(autosaveManager.getCurrentDraftId()).toBeNull();
  });
});
