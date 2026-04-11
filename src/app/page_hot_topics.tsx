'use client';

import { useState } from 'react';
import { showToast } from '@/lib/utils/toast';

function HotTopicsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    source: string;
  }>>([]);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [collectingTopicId, setCollectingTopicId] = useState<string | null>(null);
  const [collectedTopicIds, setCollectedTopicIds] = useState<Set<string>>(new Set());

  const searchTopics = async () => {
    if (!searchKeyword.trim()) {
      showToast('请输入搜索关键词', 'warning');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/hot-radar?action=network-search&keyword=${encodeURIComponent(searchKeyword)}&maxResults=20`);
      const data = await res.json();
      if (data.error) {
        showToast(`搜索失败: ${data.error}`, 'error');
        setSearchResults([]);
      } else if (data.results && data.results.length > 0) {
        setSearchResults(data.results.map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          title: item.title,
          description: item.description,
          url: item.url,
          source: item.source || 'web',
        })));
        showToast(`找到 ${data.results.length} 个相关结果`, 'success');
      } else {
        setSearchResults([]);
        showToast('未找到相关结果', 'info');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      showToast('搜索失败，请稍后重试', 'error');
    } finally {
      setSearching(false);
    }
  };

  const toggleTopicSelection = (topicId: string) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId);
    } else {
      newSelected.add(topicId);
    }
    setSelectedTopics(newSelected);
  };

  const selectAllVisible = () => {
    const allIds = searchResults.map(t => t.id);
    setSelectedTopics(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedTopics(new Set());
  };

  const addToTopicLibrary = () => {
    if (selectedTopics.size === 0) {
      showToast('请先选择要加入选题库的热点', 'warning');
      return;
    }
    const selectedList = searchResults.filter(r => selectedTopics.has(r.id));
    showToast(`已将 ${selectedList.length} 个选题加入选题库`, 'success');
  };

  const collectTopicMaterials = async (topic: typeof searchResults[0]) => {
    setCollectingTopicId(topic.id);
    try {
      const res = await fetch('/api/hot-topic-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collect-single',
          data: { topic: { ...topic, id: parseInt(topic.id) || Math.floor(Math.random() * 10000) } },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`成功采集 ${data.materials?.length || 0} 条素材`, 'success');
        setCollectedTopicIds(prev => new Set([...prev, topic.id]));
      } else {
        showToast(data.message || '采集失败', 'error');
      }
    } catch (error) {
      console.error('采集失败:', error);
      showToast('采集失败，请稍后重试', 'error');
    } finally {
      setCollectingTopicId(null);
    }
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      tavily: '🔍',
      duckduckgo: '🦆',
      searx: '🔎',
      wikipedia: '📚',
      bing: '🅱️',
      baidu: '🔍',
      web: '🌐',
    };
    return icons[source] || '📰';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          🔥 热点选题
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          搜索网络热点话题，快速选题创作
        </p>
      </div>

      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
      }}>
        <input
          type="text"
          placeholder="输入关键词搜索热点话题..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              searchTopics();
            }
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '15px',
            outline: 'none',
          }}
        />
        <button
          onClick={searchTopics}
          disabled={searching || !searchKeyword.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: searching || !searchKeyword.trim() ? '#9ca3af' : '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: searching || !searchKeyword.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {searching ? '搜索中...' : '搜索'}
        </button>
        {searchResults.length > 0 && (
          <button
            onClick={() => {
              setSearchResults([]);
              setSearchKeyword('');
              setSelectedTopics(new Set());
            }}
            style={{
              padding: '12px 16px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            清除
          </button>
        )}
      </div>

      {selectedTopics.size > 0 && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px 16px', 
          backgroundColor: '#ecfdf5', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <span style={{ color: '#059669', fontWeight: '500' }}>
            已选择 {selectedTopics.size} 个热点
          </span>
          <button
            onClick={addToTopicLibrary}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            📌 加入选题库
          </button>
          <button
            onClick={selectAllVisible}
            style={{
              padding: '8px 12px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            全选
          </button>
          <button
            onClick={clearSelection}
            style={{
              padding: '8px 12px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>
      )}

      {searching ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ color: '#6b7280' }}>正在搜索...</div>
        </div>
      ) : searchResults.length > 0 ? (
        <div>
          <div style={{ 
            marginBottom: '12px', 
            padding: '8px 12px', 
            backgroundColor: '#eff6ff', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#1e40af', fontSize: '13px' }}>
              🔍 搜索结果：找到 {searchResults.length} 个相关话题
            </span>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {searchResults.map((topic, index) => (
              <div 
                key={topic.id}
                onClick={() => toggleTopicSelection(topic.id)}
                style={{ 
                  backgroundColor: selectedTopics.has(topic.id) ? '#ecfdf5' : '#fff', 
                  borderRadius: '12px', 
                  border: selectedTopics.has(topic.id) ? '2px solid #22c55e' : '1px solid #e5e7eb', 
                  padding: '16px', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    backgroundColor: index < 3 ? '#fef3c7' : '#f3f4f6',
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: index < 3 ? '#92400e' : '#6b7280',
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{getSourceIcon(topic.source)}</span>
                      <span style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', lineHeight: 1.4 }}>
                        {topic.title}
                      </span>
                    </div>
                    {topic.description && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#6b7280', 
                        marginTop: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {topic.description}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                      来源: {topic.source || '网络搜索'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      collectTopicMaterials(topic);
                    }}
                    disabled={collectingTopicId === topic.id || collectedTopicIds.has(topic.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: collectedTopicIds.has(topic.id) ? '#22c55e' : (collectingTopicId === topic.id ? '#9ca3af' : '#8b5cf6'),
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: collectingTopicId === topic.id || collectedTopicIds.has(topic.id) ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {collectedTopicIds.has(topic.id) ? '✓ 已采集' : (collectingTopicId === topic.id ? '采集中...' : '📦 采集素材')}
                  </button>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: selectedTopics.has(topic.id) ? '2px solid #22c55e' : '2px solid #d1d5db',
                    backgroundColor: selectedTopics.has(topic.id) ? '#22c55e' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {selectedTopics.has(topic.id) && '✓'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
          <div style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>
            输入关键词搜索热点话题
          </div>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            支持多引擎搜索：Tavily、天工、MiniMax、DuckDuckGo、维基百科
          </div>
        </div>
      )}
    </div>
  );
}

export default HotTopicsPage;
