'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: string;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth', { signal: controller.signal });
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          router.push('/');
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Auth check failed:', error);
          router.push('/');
        }
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
    return () => controller.abort();
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [router]);

  return {
    user,
    setUser,
    checkingAuth,
    handleLogout,
  };
}
