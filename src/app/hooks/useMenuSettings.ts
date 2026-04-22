'use client';

import { useState, useCallback } from 'react';

export interface MenuSettings {
  dashboard: boolean;
  hotTopics: boolean;
  crawler: boolean;
  wechatCollect: boolean;
  wechatAccount: boolean;
  topicAnalysis: boolean;
  create: boolean;
  pendingPublish: boolean;
  published: boolean;
  analytics: boolean;
  ipPlan: boolean;
}

export function useMenuSettings() {
  const [menuSettings, setMenuSettings] = useState<MenuSettings>({
    dashboard: true,
    hotTopics: true,
    crawler: true,
    wechatCollect: true,
    wechatAccount: true,
    topicAnalysis: true,
    create: true,
    pendingPublish: true,
    published: true,
    analytics: true,
    ipPlan: true,
  });
  const [menuSettingsSaving, setMenuSettingsSaving] = useState(false);
  const [menuSettingsSaved, setMenuSettingsSaved] = useState(false);

  const loadMenuSettings = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/app-settings?key=menuSettings', { signal });
      const data = await res.json();
      if (data.success && data.value) {
        setMenuSettings(prev => ({ ...prev, ...data.value }));
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to load menu settings:', error);
      }
    }
  }, []);

  const saveMenuSettings = useCallback(async (settings: MenuSettings) => {
    setMenuSettingsSaving(true);
    try {
      const res = await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'menuSettings',
          value: settings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuSettingsSaved(true);
        setTimeout(() => setMenuSettingsSaved(false), 2000);
        return true;
      } else {
        console.error('保存菜单设置失败:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to save menu settings:', error);
      return false;
    } finally {
      setMenuSettingsSaving(false);
    }
  }, []);

  return {
    menuSettings,
    setMenuSettings,
    menuSettingsSaving,
    menuSettingsSaved,
    loadMenuSettings,
    saveMenuSettings,
  };
}
