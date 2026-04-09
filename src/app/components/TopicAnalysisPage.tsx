'use client';

import React, { useState, useEffect } from 'react';

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'zhipu' | 'deepseek' | 'kimi' | 'minimax';
  apiKey: string;
  model: string;
  baseUrl?: string;
}

function TopicAnalysisPage() {
  const [articles, setArticles] = useState<Array<{
    id: number;
    title: string;
    author: string | null;
    digest: string | null;
    content: string | null;
    publishTime: string | null;
    readCount: number;
    likeCount: number;
    commentCount: number;
    recommendCount: number;
    shareCount: number;
    engagementRate: number;
    sourceUrl: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    insights: string[];
    topicSuggestions: Array<{ title: string; reason: string; potential: string }>;
    contentTrends: string[];
    audienceInsights: string[];
  } | null>(null);
  const [llmConfig, setLlmConfig] = useState<{
    provider: string;
    apiKey: string;
    model: string;
    baseUrl?: string | null;
  } | null>(null);
  const [stats, setStats] = useState({
    totalArticles: 0,
    avgReadCount: 0,
    avgLikeCount: 0,
    avgEngagementRate: 0,
  });
  const [wordCloud, setWordCloud] = useState<Array<{ word: string; count: number }>>([]);
  const [cacheKey, setCacheKey] = useState<string>('');
  const [publishTimeDistribution, setPublishTimeDistribution] = useState<Array<{ hour: number; count: number }>>([]);

  const calculatePublishTimeDistribution = (articleList: Array<{ publishTime: string | null }>) => {
    const distribution: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      distribution[i] = 0;
    }

    articleList.forEach(article => {
      if (article.publishTime) {
        try {
          const date = new Date(article.publishTime);
          const hour = date.getHours();
          distribution[hour]++;
        } catch (e) {
          console.error('Invalid publishTime:', article.publishTime);
        }
      }
    });

    const result = Object.entries(distribution).map(([hour, count]) => ({
      hour: parseInt(hour, 10),
      count,
    }));

    setPublishTimeDistribution(result);
  };

  useEffect(() => {
    loadArticles();
    loadLLMConfig();
  }, []);

  const loadLLMConfig = async () => {
    try {
      const res = await fetch('/api/llm-config');
      const config = await res.json();
      if (config) {
        setLlmConfig({
          provider: (config.provider as LLMConfig['provider']) || 'minimax',
          apiKey: config.apiKey || '',
          model: config.model || 'MiniMax-M2.7',
          baseUrl: config.baseUrl || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to load LLM config:', error);
    }
  };

  const calculateEngagementRate = (article: { readCount: number; likeCount: number; commentCount: number; recommendCount: number; shareCount: number }) => {
    if (article.readCount <= 0) return 0;
    return Number(((article.commentCount + article.shareCount + article.likeCount + article.recommendCount) / article.readCount * 100).toFixed(2));
  };

  const generateCacheKey = (articleList: Array<{ id: number; updatedAt?: string }>) => {
    const ids = articleList.map(a => a.id).sort((a, b) => a - b).join('-');
    return `wordcloud-${ids}`;
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wechat-collect?action=list-articles&pageSize=100');
      const data = await res.json();
      const articleList = Array.isArray(data) ? data : [];
      setArticles(articleList);

      calculatePublishTimeDistribution(articleList);

      const key = generateCacheKey(articleList);
      setCacheKey(key);

      const validArticles = articleList.filter((a: { readCount: number; likeCount: number; recommendCount: number; shareCount: number }) =>
        a.readCount > 0 || a.likeCount > 0 || a.recommendCount > 0 || a.shareCount > 0
      );

      if (validArticles.length > 0) {
        const totalRead = validArticles.reduce((sum: number, a: { readCount: number }) => sum + (a.readCount || 0), 0);
        const totalLike = validArticles.reduce((sum: number, a: { likeCount: number }) => sum + (a.likeCount || 0), 0);

        let totalEngagement = 0;
        validArticles.forEach((a: { readCount: number; likeCount: number; commentCount: number; recommendCount: number; shareCount: number }) => {
          totalEngagement += calculateEngagementRate(a);
        });

        setStats({
          totalArticles: validArticles.length,
          avgReadCount: Math.round(totalRead / validArticles.length),
          avgLikeCount: Math.round(totalLike / validArticles.length),
          avgEngagementRate: Number((totalEngagement / validArticles.length).toFixed(2)),
        });
      } else {
        setStats({
          totalArticles: articleList.length,
          avgReadCount: 0,
          avgLikeCount: 0,
          avgEngagementRate: 0,
        });
      }

      const cacheRes = await fetch('/api/topic-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-wordcloud-cache', cacheKey: key }),
      });
      const cacheData = await cacheRes.json();

      if (cacheData.cache?.basicWordCloud && cacheData.cache.basicWordCloud.length > 0) {
        setWordCloud(cacheData.cache.basicWordCloud);
      } else {
        const articlesForSegment = articleList.map((a: { title: string; digest: string | null; content: string | null }) => ({
          title: a.title,
          digest: a.digest,
          content: a.content,
        }));

        const segmentRes = await fetch('/api/segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articles: articlesForSegment }),
        });

        const segmentData = await segmentRes.json();
        if (segmentData.success && segmentData.wordCloud) {
          setWordCloud(segmentData.wordCloud);

          await fetch('/api/topic-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save-basic-wordcloud',
              cacheKey: key,
              wordCloud: segmentData.wordCloud,
              articles: articleList.map((a: { id: number; title: string; readCount: number; likeCount: number }) => ({
                title: a.title,
                readCount: a.readCount,
                likeCount: a.likeCount,
              })),
            }),
          });
        }
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWordCloud = (articleList: Array<{ title: string; digest: string | null; content: string | null }>) => {
    const stopWords = new Set([
      '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
      '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '他', '她', '它', '这个', '那个', '可以', '没', '啊', '呢',
      '吧', '吗', '哦', '嗯', '哈', '啦', '呀', '哪', '怎', '么', '还', '能', '让', '把', '被', '比', '更', '最', '但', '而',
      '或', '与', '及', '等', '对', '为', '以', '从', '向', '于', '给', '之', '其', '者', '所', '即', '如', '若', '虽', '则',
      '因为', '所以', '如果', '虽然', '但是', '然而', '而且', '或者', '以及', '对于', '关于', '通过', '进行', '已经', '正在',
      '将', '会', '可能', '应该', '需要', '必须', '能够', '可以', '这个', '那个', '这些', '那些', '这样', '那样', '如此',
      '我们', '你们', '他们', '她们', '它们', '大家', '自己', '别人', '他人', '某', '每', '各', '某', '本', '该', '此',
      '来', '起来', '出来', '进来', '回来', '过来', '上去', '下来', '进去', '回去', '过去', '开来',
      '得', '地', '着', '过', '了', '呢', '吗', '吧', '啊', '呀', '哦', '嗯', '哈', '啦', '嘞', '喽', '嘛', '么',
      '一点', '一些', '一下', '一直', '一起', '一切', '一边', '一面', '一时', '一样', '一再', '一味',
      '就是', '只是', '还是', '总是', '都是', '就有', '都有', '才是', '也是', '就有', '又有', '还有',
      '不是', '没', '别', '莫', '勿', '休', '甭', '不用', '不要', '不会', '不能', '不可', '不敢', '不该',
      '这种', '那种', '哪种', '这种', '那种', '各种', '某种', '某种', '任何', '所有', '全部', '部分',
      '之后', '之前', '以后', '以前', '以上', '以下', '之间', '之内', '之外', '之中', '当中', '其中',
      '其实', '实际', '确实', '真的', '真是', '真是', '当然', '固然', '虽然', '即使', '尽管', '哪怕',
      '比如', '例如', '譬如', '诸如', '像是', '好像', '仿佛', '似乎', '简直', '几乎', '差不多',
      '然后', '接着', '于是', '因此', '所以', '因而', '从而', '进而', '继而', '随后', '随即',
      '这里', '那里', '哪里', '这边', '那边', '哪边', '这儿', '那儿', '哪儿', '此处', '彼处',
      '现在', '当时', '此时', '彼时', '当时', '那时', '何时', '有时', '随时', '同时', '届时',
      '怎样', '怎么', '如何', '何如', '为何', '何故', '何必', '何不', '何曾', '何尝', '何须',
      '多少', '几', '几个', '几时', '几许', '几何', '若干', '多少', '多', '少', '大', '小', '长', '短', '高', '低', '远', '近',
      '第一', '第二', '第三', '首先', '其次', '再次', '最后', '最终', '最初', '起初', '开始', '结束',
      '爸爸', '妈妈', '儿子', '女儿', '哥哥', '姐姐', '弟弟', '妹妹', '爷爷', '奶奶', '外公', '外婆',
      '特别', '非常', '十分', '相当', '比较', '稍微', '略微', '有些', '有点', '颇为', '甚为',
      '拼命', '一阵子', '别急', '急着', '点击', '名片', '关注', '公众号', '微信', '朋友圈', '转发', '点赞', '收藏',
    ]);

    const blackPatterns = [
      /点击名片/g, /关注我们/g, /扫码关注/g, /长按识别/g, /二维码/g,
      /转发给/g, /分享给/g, /点赞.*在看/g, /点击.*阅读/g,
      /更多精彩/g, /推荐阅读/g, /相关文章/g, /往期回顾/g,
      /本文来源/g, /作者简介/g, /版权声明/g, /免责声明/g,
      /商务合作/g, /联系方式/g, /投稿邮箱/g,
    ];

    const cleanText = (text: string): string => {
      let cleaned = text;
      blackPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });
      return cleaned;
    };

    const isValidWord = (word: string): boolean => {
      if (word.length < 2 || word.length > 6) return false;
      if (stopWords.has(word)) return false;
      if (/^\d+$/.test(word)) return false;
      if (/^[a-zA-Z]+$/.test(word)) return false;
      if (/(.)\1{2,}/.test(word)) return false;
      if (/^[的一是不了在人有我这个]/.test(word)) return false;
      if (/[的一是不了在人有我这个]$/.test(word)) return false;
      return true;
    };

    const wordCount: Record<string, number> = {};

    articleList.forEach(article => {
      const title = cleanText(article.title || '');
      const digest = cleanText(article.digest || '');
      const content = cleanText((article.content || '').substring(0, 800));

      const titleWords = title.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
      const digestWords = digest.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
      const contentWords = content.match(/[\u4e00-\u9fa5]{2,6}/g) || [];

      titleWords.forEach(word => {
        if (isValidWord(word)) {
          wordCount[word] = (wordCount[word] || 0) + 3;
        }
      });

      digestWords.forEach(word => {
        if (isValidWord(word)) {
          wordCount[word] = (wordCount[word] || 0) + 2;
        }
      });

      contentWords.forEach(word => {
        if (isValidWord(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });

    const minCount = Math.max(2, Math.floor(articleList.length * 0.1));

    return Object.entries(wordCount)
      .filter(([_, count]) => count >= minCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({ word, count }));
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const topLikesArticles = articles
    .filter(a => a.likeCount > 0)
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5);

  const topEngagementArticles = articles
    .filter(a => a.readCount > 0 && (a.likeCount > 0 || a.recommendCount > 0 || a.shareCount > 0 || a.commentCount > 0))
    .map(a => ({ ...a, calculatedEngagementRate: calculateEngagementRate(a) }))
    .sort((a, b) => b.calculatedEngagementRate - a.calculatedEngagementRate)
    .slice(0, 5);

  const maxWordCount = Math.max(...(wordCloud.map(w => w.count) || [1]));

  const runAIAnalysis = async () => {
    if (!llmConfig) {
      alert('请先配置MiniMax API');
      return;
    }

    setAnalyzing(true);
    setAiAnalysis(null);

    try {
      const res = await fetch('/api/topic-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          articles: articles.map(a => ({
            title: a.title,
            author: a.author,
            readCount: a.readCount,
            likeCount: a.likeCount,
            commentCount: a.commentCount,
            recommendCount: a.recommendCount,
            shareCount: a.shareCount,
            publishTime: a.publishTime,
            digest: a.digest,
          })),
          wordCloud,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAiAnalysis(data);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('分析失败，请检查API配置');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
          📊 选题分析
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          基于文章采集的数据进行分析，请在文章库中补充阅读量、点赞数、互动率等数据
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <span style={{ fontSize: '24px' }}>⏳ 加载中...</span>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#E8652D', marginBottom: '8px' }}>
                {stats.totalArticles}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>已分析文章</div>
            </div>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                {formatNumber(stats.avgReadCount)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>平均阅读量</div>
            </div>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>
                {formatNumber(stats.avgLikeCount)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>平均点赞数</div>
            </div>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>
                {stats.avgEngagementRate}%
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>平均互动率</div>
            </div>
          </div>

          {stats.totalArticles === 0 && (
            <div style={{
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #f59e0b',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>暂无有效数据</div>
                  <div style={{ fontSize: '14px', color: '#92400e' }}>
                    请先在「文章库」中为文章补充阅读量、点赞数、互动率等数据，然后刷新本页面查看分析结果
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                ❤️ 点赞 TOP5
              </h3>
              {topLikesArticles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topLikesArticles.map((article, i) => (
                    <div key={article.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', minWidth: 0 }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: i === 0 ? '#fef3c7' : i === 1 ? '#e5e7eb' : i === 2 ? '#fed7aa' : '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {article.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{article.author || '未知作者'}</div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444', flexShrink: 0 }}>
                        ❤️ {formatNumber(article.likeCount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  暂无点赞数据，请在文章库中补充
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                📈 互动率 TOP5
              </h3>
              {topEngagementArticles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topEngagementArticles.map((article, i) => (
                    <div key={article.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', minWidth: 0 }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: i === 0 ? '#dcfce7' : i === 1 ? '#e5e7eb' : i === 2 ? '#fef3c7' : '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {article.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{article.author || '未知作者'}</div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981', flexShrink: 0 }}>
                        {article.calculatedEngagementRate.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  暂无互动率数据，请在文章库中补充
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  ☁️ 高频词云
                </h3>
              </div>

              {wordCloud.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '20px' }}>
                  {wordCloud.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        fontSize: `${12 + (item.count / maxWordCount) * 16}px`,
                        fontWeight: item.count > maxWordCount * 0.5 ? '600' : '400',
                        color: ['#E8652D', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
                        backgroundColor: `${['#eff6ff', '#ecfdf5', '#fffbeb', '#fef2f2', '#f5f3ff', '#fdf2f8'][i % 6]}`,
                        borderRadius: '20px',
                      }}
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  暂无词云数据
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  📊 发布时间分布
                </h3>
              </div>

              {publishTimeDistribution.length > 0 ? (
                <div style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '4px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                    {publishTimeDistribution.map((item, i) => {
                      const maxCount = Math.max(...publishTimeDistribution.map(d => d.count), 1);
                      const height = Math.max(4, (item.count / maxCount) * 140);
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{
                            width: '100%',
                            height: `${height}px`,
                            backgroundColor: item.count > 0 ? '#E8652D' : '#e5e7eb',
                            borderRadius: '2px 2px 0 0',
                            transition: 'height 0.3s',
                            position: 'relative',
                          }}>
                            {item.count > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '10px',
                                color: '#E8652D',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                              }}>
                                {item.count}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
                            {item.hour}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
                    <span>0时</span>
                    <span>6时</span>
                    <span>12时</span>
                    <span>18时</span>
                    <span>24时</span>
                  </div>
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>
                      📈 发布时间分析
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {(() => {
                        const peakHours = publishTimeDistribution.filter(h => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
                        if (peakHours.length === 0) return '暂无数据';
                        const total = publishTimeDistribution.reduce((sum, h) => sum + h.count, 0);
                        const peakStr = peakHours.map(h => `${h.hour}(${h.count}篇)`).join('、');
                        return `高峰时段: ${peakStr}，共${total}篇文章`;
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  暂无发布时间数据
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                🤖 AI 智能分析
              </h3>
              <button
                onClick={runAIAnalysis}
                disabled={analyzing || stats.totalArticles === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: analyzing || stats.totalArticles === 0 ? '#9ca3af' : '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: analyzing || stats.totalArticles === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {analyzing ? '⏳ 分析中...' : '🚀 开始AI分析'}
              </button>
            </div>

            {!llmConfig && (
              <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#92400e' }}>
                  ⚠️ 请先在「系统设置」中配置 MiniMax API
                </div>
              </div>
            )}

            {analyzing && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                <div>AI 正在分析文章数据，请稍候...</div>
              </div>
            )}

            {aiAnalysis && !analyzing && (
              <div>
                <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '16px', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>📊 分析摘要</div>
                  <div style={{ fontSize: '14px', color: '#15803d', lineHeight: '1.6' }}>{aiAnalysis.summary}</div>
                </div>

                {aiAnalysis.insights.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>💡 核心洞察</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {aiAnalysis.insights.map((insight, i) => (
                        <li key={i} style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.topicSuggestions.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>✨ 推荐选题</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {aiAnalysis.topicSuggestions.map((topic, i) => (
                        <div key={i} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{topic.title}</span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              backgroundColor: topic.potential === '高' ? '#dcfce7' : topic.potential === '中' ? '#fef3c7' : '#fee2e2',
                              color: topic.potential === '高' ? '#166534' : topic.potential === '中' ? '#92400e' : '#991b1b',
                            }}>
                              潜力：{topic.potential}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{topic.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.contentTrends.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>📈 内容趋势</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {aiAnalysis.contentTrends.map((trend, i) => (
                        <span key={i} style={{ padding: '4px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '16px', fontSize: '12px' }}>
                          {trend}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.audienceInsights.length > 0 && (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>👥 读者洞察</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {aiAnalysis.audienceInsights.map((insight, i) => (
                        <li key={i} style={{ fontSize: '13px', color: '#4b5563' }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!aiAnalysis && !analyzing && stats.totalArticles > 0 && llmConfig && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
                <div>点击「开始AI分析」按钮，使用 {llmConfig.model || '已配置的模型'} 分析文章数据</div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                📋 文章列表（{articles.length}篇）
              </h3>
              <button
                onClick={loadArticles}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#E8652D',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                🔄 刷新数据
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflow: 'auto' }}>
              {articles.slice(0, 20).map(article => (
                <div
                  key={article.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {article.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {article.author || '未知作者'} · {article.publishTime ? new Date(article.publishTime).toLocaleDateString('zh-CN') : '未知时间'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                    <span>👁 {formatNumber(article.readCount || 0)}</span>
                    <span>❤️ {formatNumber(article.likeCount || 0)}</span>
                    <span style={{ color: calculateEngagementRate(article) > 0 ? '#10b981' : '#9ca3af' }}>
                      {calculateEngagementRate(article) > 0 ? `${calculateEngagementRate(article).toFixed(2)}%` : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TopicAnalysisPage;
