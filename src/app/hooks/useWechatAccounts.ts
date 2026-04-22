'use client';

import { useState, useCallback } from 'react';

export interface WechatAccount {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  authorName: string;
  isDefault: boolean;
  targetAudience?: string;
  readerPersona?: string;
  contentStyle?: string;
  mainTopics?: string[];
  tonePreference?: string;
}

export function useWechatAccounts() {
  const [wechatAccounts, setWechatAccounts] = useState<WechatAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadWechatAccounts = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/wechat-accounts', { signal });
      const data = await res.json();
      const accounts = data.success && Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : (data.accounts || []);
      if (accounts.length > 0) {
        const formatted = accounts.map((a: {
          id: number;
          name: string;
          appId: string;
          appSecret: string;
          authorName: string;
          isDefault: boolean;
          targetAudience?: string;
          readerPersona?: string;
        }) => ({
          id: String(a.id),
          name: a.name,
          appId: a.appId || '',
          appSecret: a.appSecret || '',
          authorName: a.authorName || '',
          isDefault: a.isDefault || false,
          targetAudience: a.targetAudience || '',
          readerPersona: a.readerPersona || '',
        }));
        setWechatAccounts(formatted);
        const defaultAccount = formatted.find((a: WechatAccount) => a.isDefault);
        setSelectedAccountId(defaultAccount?.id || formatted[0]?.id || '');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to load wechat accounts:', error);
      }
    }
  }, []);

  const addWechatAccount = useCallback(() => {
    const newAccount: WechatAccount = {
      id: `temp_${Date.now()}`,
      name: '',
      appId: '',
      appSecret: '',
      authorName: '文笙',
      isDefault: false,
    };
    return newAccount;
  }, []);

  const saveWechatAccount = useCallback(async (
    editingAccount: WechatAccount | null,
    currentAccounts: WechatAccount[],
    onSuccess?: (accounts: WechatAccount[]) => void
  ) => {
    if (!editingAccount || editingAccount.name.trim() === '') return;

    setLoading(true);
    try {
      const isNew = !currentAccounts.find(a => a.id === editingAccount.id);

      if (isNew) {
        const res = await fetch('/api/wechat-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editingAccount.name,
            appId: editingAccount.appId,
            appSecret: editingAccount.appSecret,
            authorName: editingAccount.authorName,
            isDefault: editingAccount.isDefault,
            targetAudience: editingAccount.targetAudience,
            readerPersona: editingAccount.readerPersona,
          }),
        });
        const data = await res.json();
        const account = data.success ? data.data : data;
        if (account) {
          const newAccount: WechatAccount = {
            id: String(account.id),
            name: account.name,
            appId: account.appId || '',
            appSecret: account.appSecret || '',
            authorName: account.authorName || '',
            isDefault: account.isDefault || false,
            targetAudience: account.targetAudience || '',
            readerPersona: account.readerPersona || '',
          };
          const updated = [...currentAccounts, newAccount];
          setWechatAccounts(updated);
          onSuccess?.(updated);
        }
      } else {
        await fetch('/api/wechat-accounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: parseInt(editingAccount.id),
            name: editingAccount.name,
            appId: editingAccount.appId,
            appSecret: editingAccount.appSecret,
            authorName: editingAccount.authorName,
            targetAudience: editingAccount.targetAudience,
            readerPersona: editingAccount.readerPersona,
          }),
        });
        const updated = currentAccounts.map(a => a.id === editingAccount.id ? editingAccount : a);
        setWechatAccounts(updated);
        onSuccess?.(updated);
      }
    } catch (error) {
      console.error('Failed to save wechat account:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWechatAccount = useCallback(async (id: string) => {
    try {
      await fetch(`/api/wechat-accounts?id=${id}`, { method: 'DELETE' });
      setWechatAccounts(prev => {
        const filtered = prev.filter(a => a.id !== id);
        return filtered;
      });
      setSelectedAccountId(prev => {
        if (prev === id) {
          const remaining = wechatAccounts.filter(a => a.id !== id);
          return remaining[0]?.id || '';
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to delete wechat account:', error);
    }
  }, [wechatAccounts]);

  const setDefaultAccount = useCallback(async (id: string) => {
    try {
      await fetch('/api/wechat-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(id), setDefault: true }),
      });
      setWechatAccounts(prev => prev.map(a => ({
        ...a,
        isDefault: a.id === id,
      })));
    } catch (error) {
      console.error('Failed to set default account:', error);
    }
  }, []);

  return {
    wechatAccounts,
    setWechatAccounts,
    selectedAccountId,
    setSelectedAccountId,
    loading,
    loadWechatAccounts,
    addWechatAccount,
    saveWechatAccount,
    deleteWechatAccount,
    setDefaultAccount,
  };
}
