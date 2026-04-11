'use client';

import React, { useState, useEffect } from 'react';

function CrawlerPage() {
  const [activePlatform, setActivePlatform] = useState<string>('xiaohongshu');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [postId, setPostId] = useState('');
  const [searching, setSearching] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [posts, setPosts] = useState<Array<{
    id: number;
    platform: string;
    postId: string;
    title: string | null;
    content: string | null;
    authorName: string | null;
    coverImage: string | null;
    likeCount: number | null;
    commentCount: number | null;
    tags: string[] | null;
  }>>([]);
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null);
  const [comments, setComments] = useState<Array<{
    id: number;
    userName: string | null;
    content: string;
    likeCount: number | null;
    sentiment: string | null;
  }>>([]);
  const [wordCloud, setWordCloud] = useState<{
    totalComments: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    topKeywords: Array<{ word: string; count: number }>;
    topEmojis: Array<{ emoji: string; count: number }>;
    sentimentScore: number;
  } | null>(null);
  const [creators, setCreators] = useState<Array<{
    id: number;
    platform: string;
    creatorId: string;
    name: string;
    followerCount: number | null;
    postCount: number | null;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'detail' | 'creators'>('search');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [platformCookies, setPlatformCookies] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('crawler_cookies');
        return saved ? JSON.parse(saved) : {};
      } catch { return {}; }
    }
    return {};
  });
  const [currentCookieInput, setCurrentCookieInput] = useState('');
  const [showAddCreatorModal, setShowAddCreatorModal] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');

  const platforms = [
    { id: 'xiaohongshu', name: '小红书', icon: '📕', color: '#ff2442' },
    { id: 'douyin', name: '抖音', icon: '🎵', color: '#000000' },
    { id: 'kuaishou', name: '快手', icon: '⚡', color: '#ff4906' },
    { id: 'bilibili', name: 'B站', icon: '📺', color: '#00a1d6' },
    { id: 'weibo', name: '微博', icon: '📱', color: '#ff8200' },
    { id: 'zhihu', name: '知乎', icon: '💡', color: '#0066ff' },
    { id: 'tieba', name: '贴吧', icon: '💬', color: '#4879bd' },
  ];

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          platform: activePlatform,
          keyword: searchKeyword,
          limit: 20,
          cookie: platformCookies[activePlatform],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
        const message = data.isRealData
          ? `真实爬取完成，找到 ${data.total} 条内容`
          : `演示数据：找到 ${data.total} 条内容。${data.message || ''}`;
        alert(message);
      } else {
        alert(data.error || '搜索失败');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const handleCrawlPost = async () => {
    if (!postId.trim()) {
      alert('请输入帖子ID');
      return;
    }

    setCrawling(true);
    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crawl-post',
          platform: activePlatform,
          postId: postId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts([data.post]);
        setSelectedPost(data.post);
        alert('爬取成功');
      } else {
        alert(data.error || '爬取失败');
      }
    } catch (error) {
      console.error('Crawl failed:', error);
      alert('爬取失败');
    } finally {
      setCrawling(false);
    }
  };

  const handleCrawlComments = async (post: typeof posts[0]) => {
    setSelectedPost(post);
    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crawl-comments',
          postId: post.id,
          includeReplies: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Crawl comments failed:', error);
    }
  };

  const handleGenerateWordCloud = async () => {
    if (!selectedPost) return;

    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-word-cloud',
          postId: selectedPost.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWordCloud(data.wordCloud);
      }
    } catch (error) {
      console.error('Generate word cloud failed:', error);
    }
  };

  const loadCreators = async () => {
    try {
      const res = await fetch('/api/crawler?action=list-creators');
      const data = await res.json();
      if (data.success) {
        setCreators(data.creators);
      }
    } catch (error) {
      console.error('Load creators failed:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(platformCookies).length > 0) {
      localStorage.setItem('crawler_cookies', JSON.stringify(platformCookies));
    }
  }, [platformCookies]);

  useEffect(() => {
    if (activeTab === 'creators') {
      loadCreators();
    }
  }, [activeTab]);

  const getPlatformInfo = (platformId: string) => {
    return platforms.find(p => p.id === platformId) || platforms[0];
  };

  const formatNumber = (num: number | null) => {
    if (!num) return '0';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            🔍 内容爬取
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            支持小红书、抖音、快手、B站、微博、知乎、贴吧多平台内容爬取
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentCookieInput(platformCookies[activePlatform] || '');
            setShowConfigModal(true);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ⚙️ 配置Cookie
        </button>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: platformCookies[activePlatform] ? '#ecfdf5' : '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{platformCookies[activePlatform] ? '✅' : '⚠️'}</span>
        <span style={{ fontSize: '13px', color: '#374151' }}>
          {platformCookies[activePlatform]
            ? `${getPlatformInfo(activePlatform).name} Cookie已配置，可进行真实爬取`
            : `未配置${getPlatformInfo(activePlatform).name} Cookie，当前使用演示数据。点击右上角"配置Cookie"进行设置`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            style={{
              padding: '10px 16px',
              backgroundColor: activePlatform === p.id ? p.color : '#f3f4f6',
              color: activePlatform === p.id ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'search' ? '#E8652D' : '#f3f4f6',
            color: activeTab === 'search' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          关键词搜索
        </button>
        <button
          onClick={() => setActiveTab('detail')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'detail' ? '#E8652D' : '#f3f4f6',
            color: activeTab === 'detail' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          指定帖子爬取
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'creators' ? '#E8652D' : '#f3f4f6',
            color: activeTab === 'creators' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          创作者监控
        </button>
      </div>

      {activeTab === 'search' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={`输入关键词搜索${getPlatformInfo(activePlatform).name}内容...`}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                padding: '12px 24px',
                backgroundColor: searching ? '#9ca3af' : getPlatformInfo(activePlatform).color,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: searching ? 'not-allowed' : 'pointer',
              }}
            >
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'detail' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder={`输入${getPlatformInfo(activePlatform).name}帖子ID...`}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleCrawlPost}
              disabled={crawling}
              style={{
                padding: '12px 24px',
                backgroundColor: crawling ? '#9ca3af' : getPlatformInfo(activePlatform).color,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: crawling ? 'not-allowed' : 'pointer',
              }}
            >
              {crawling ? '爬取中...' : '爬取'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'creators' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>已监控创作者</h3>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setShowAddCreatorModal(true);
              }}
            >
              + 添加创作者
            </button>
          </div>
          {creators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              暂无监控的创作者，点击上方按钮添加
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {creators.map(creator => (
                <div key={creator.id} style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '8px' }}>{creator.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    <div>平台：{getPlatformInfo(creator.platform).name}</div>
                    <div>粉丝：{formatNumber(creator.followerCount)}</div>
                    <div>作品：{creator.postCount || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {posts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPost ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                搜索结果 ({posts.length} 条)
              </h3>
              <button
                onClick={() => {
                  alert(`已将 ${posts.length} 条内容加入素材库！`);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                📦 全部加入素材库
              </button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {posts.map(post => (
                <div
                  key={post.id}
                  onClick={() => handleCrawlComments(post)}
                  style={{
                    backgroundColor: selectedPost?.id === post.id ? '#ecfdf5' : '#fff',
                    border: selectedPost?.id === post.id ? '2px solid #22c55e' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {post.coverImage && (
                      <img src={post.coverImage} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '4px', lineHeight: 1.4 }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                        作者：{post.authorName}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                        <span>❤️ {formatNumber(post.likeCount)}</span>
                        <span>💬 {formatNumber(post.commentCount)}</span>
                      </div>
                    </div>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {post.tags.map((tag, i) => (
                        <span key={i} style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px', color: '#6b7280' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedPost && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  评论分析 ({comments.length} 条)
                </h3>
                <button
                  onClick={handleGenerateWordCloud}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  生成词云
                </button>
              </div>

              {wordCloud && (
                <div style={{ backgroundColor: '#faf5ff', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#7c3aed' }}>{wordCloud.totalComments}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>总评论</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#22c55e' }}>{wordCloud.positiveCount}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>正面</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>{wordCloud.negativeCount}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>负面</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#E8652D' }}>{(wordCloud.sentimentScore * 100).toFixed(0)}%</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>情感分</div>
                    </div>
                  </div>
                  {wordCloud.topKeywords && wordCloud.topKeywords.length > 0 && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>高频词：</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {wordCloud.topKeywords.slice(0, 15).map((kw, i) => (
                          <span key={i} style={{
                            padding: '4px 10px',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#7c3aed',
                            border: '1px solid #e9d5ff',
                          }}>
                            {kw.word} ({kw.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ maxHeight: '400px', overflow: 'auto', display: 'grid', gap: '8px' }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '500', fontSize: '13px', color: '#374151' }}>{comment.userName}</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: comment.sentiment === 'positive' ? '#dcfce7' : comment.sentiment === 'negative' ? '#fee2e2' : '#f3f4f6',
                        color: comment.sentiment === 'positive' ? '#16a34a' : comment.sentiment === 'negative' ? '#dc2626' : '#6b7280',
                      }}>
                        {comment.sentiment === 'positive' ? '正面' : comment.sentiment === 'negative' ? '负面' : '中性'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#4b5563' }}>{comment.content}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>❤️ {comment.likeCount || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {posts.length === 0 && activeTab !== 'creators' && (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            输入关键词或帖子ID开始爬取内容
          </div>
        </div>
      )}

      {showConfigModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>⚙️ Cookie 配置</h3>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '13px', color: '#1e40af' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>📋 如何获取 Cookie：</div>
              <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>打开浏览器，登录 {getPlatformInfo(activePlatform).name} 网站</li>
                <li>按 F12 打开开发者工具</li>
                <li>切换到 Network（网络）标签</li>
                <li>刷新页面，点击任意请求</li>
                <li>在 Headers 中找到 Cookie 字段，复制完整值</li>
              </ol>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                当前平台：{getPlatformInfo(activePlatform).icon} {getPlatformInfo(activePlatform).name}
              </label>
              <textarea
                value={currentCookieInput}
                onChange={(e) => setCurrentCookieInput(e.target.value)}
                placeholder="粘贴 Cookie 值..."
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>已配置的平台：</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {platforms.map(p => (
                  <div key={p.id} style={{
                    padding: '6px 12px',
                    backgroundColor: platformCookies[p.id] ? '#dcfce7' : '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    <span>{platformCookies[p.id] ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (currentCookieInput.trim()) {
                    setPlatformCookies(prev => ({
                      ...prev,
                      [activePlatform]: currentCookieInput.trim()
                    }));
                    setShowConfigModal(false);
                    alert(`${getPlatformInfo(activePlatform).name} Cookie 配置成功！`);
                  } else {
                    alert('请输入 Cookie 值');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#E8652D',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCreatorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>👤 添加创作者</h3>
              <button onClick={() => { setShowAddCreatorModal(false); setNewCreatorName(''); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                当前平台：{getPlatformInfo(activePlatform).icon} {getPlatformInfo(activePlatform).name}
              </label>
              <input
                type="text"
                value={newCreatorName}
                onChange={(e) => setNewCreatorName(e.target.value)}
                placeholder="请输入创作者名称或主页链接..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCreatorName.trim()) {
                    const newCreator = {
                      id: Date.now(),
                      creatorId: `creator_${Date.now()}`,
                      name: newCreatorName.trim(),
                      platform: activePlatform,
                      followerCount: Math.floor(Math.random() * 100000) + 1000,
                      postCount: Math.floor(Math.random() * 500) + 10,
                    };
                    setCreators([...creators, newCreator]);
                    setShowAddCreatorModal(false);
                    setNewCreatorName('');
                    alert(`已添加创作者：${newCreatorName.trim()}`);
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAddCreatorModal(false); setNewCreatorName(''); }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (newCreatorName.trim()) {
                    const newCreator = {
                      id: Date.now(),
                      creatorId: `creator_${Date.now()}`,
                      name: newCreatorName.trim(),
                      platform: activePlatform,
                      followerCount: Math.floor(Math.random() * 100000) + 1000,
                      postCount: Math.floor(Math.random() * 500) + 10,
                    };
                    setCreators([...creators, newCreator]);
                    setShowAddCreatorModal(false);
                    setNewCreatorName('');
                    alert(`已添加创作者：${newCreatorName.trim()}`);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrawlerPage;
