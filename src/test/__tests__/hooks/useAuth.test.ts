import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/app/hooks/useAuth';
import { mockRouter } from '@/test/setup';

describe('useAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('initial state: user is null and checkingAuth is true', () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.checkingAuth).toBe(true);
  });

  it('sets user when auth check succeeds', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
    };

    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ authenticated: true, user: mockUser }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('redirects to home when not authenticated', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ authenticated: false }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('redirects to home on fetch error', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(mockRouter.push).toHaveBeenCalledWith('/');
    consoleSpy.mockRestore();
  });

  it('does not redirect on AbortError', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    vi.mocked(global.fetch).mockRejectedValue(abortError);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handleLogout calls fetch and redirects', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ authenticated: true, user: { id: 1, username: 'u', email: 'e', displayName: 'd', role: 'user' } }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });

    vi.mocked(global.fetch).mockClear();
    await result.current.handleLogout();

    expect(global.fetch).toHaveBeenCalledWith('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('setUser updates user state', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ authenticated: true, user: { id: 1, username: 'u', email: 'e', displayName: 'd', role: 'user' } }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });

    const newUser = { id: 2, username: 'new', email: 'new@example.com', displayName: 'New User', role: 'admin' };
    result.current.setUser(newUser);

    await waitFor(() => {
      expect(result.current.user).toEqual(newUser);
    });
  });
});
