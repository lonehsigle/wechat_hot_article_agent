'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Material {
  id: number;
  type: string;
  source: string;
  title: string;
  content: string;
  keyPoints?: string[];
}

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialType, setMaterialType] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const loadMaterials = useCallback(async (type?: string, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const url = type && type !== 'all' ? `/api/materials?type=${encodeURIComponent(type)}` : '/api/materials';
      const res = await fetch(url, { signal });
      const data = await res.json();
      setMaterials(data.success ? (data.materials || []) : (Array.isArray(data) ? data : []));
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to load materials:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMaterial = useCallback(async (id: number) => {
    if (!confirm('确定删除此素材？')) return;
    try {
      await fetch(`/api/materials?id=${id}`, { method: 'DELETE' });
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadMaterials(materialType === 'all' ? undefined : materialType, controller.signal);
    return () => controller.abort();
  }, [materialType, loadMaterials]);

  return {
    materials,
    setMaterials,
    materialType,
    setMaterialType,
    loading,
    loadMaterials,
    deleteMaterial,
  };
}
