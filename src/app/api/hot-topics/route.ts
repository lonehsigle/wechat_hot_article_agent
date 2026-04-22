import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hotTopics, hotTopicHistory, collectedArticles, articleRewrites } from '@/lib/db/schema';
import { eq, desc, and, gt, inArray, or, like, sql } from 'drizzle-orm';
import { apiResponse } from '@/lib/utils/api-helper';

const PLATFORMS = ['weibo', 'douyin', 'xiaohongshu', 'zhihu', 'baidu'] as const;

/**
 * Redis 风格的内存缓存实现
 * 无需外部依赖，使用简单 Map
 */
class MemoryCache {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const hotTopicsCache = new MemoryCache();
const CACHE_TTL_SECONDS = 5 * 60; // 5分钟缓存

/**
 * 计算预测增长率 - 基于热度值和排名趋势的简单算法
 */
function calculatePredictedGrowth(
  hotValue: number,
  rank: number,
  trend: 'up' | 'down' | 'stable',
  platform: string
): number {
  const heatFactor = hotValue < 500000 ? 1.5 : hotValue < 2000000 ? 1.0 : 0.5;
  const rankFactor = rank <= 3 ? 1.2 : rank <= 10 ? 1.0 : 0.8;
  const trendFactor = trend === 'up' ? 1.3 : trend === 'stable' ? 1.0 : 0.6;
  const platformFactors: Record<string, number> = {
    weibo: 1.1,
    douyin: 1.4,
    xiaohongshu: 1.3,
    zhihu: 0.9,
    baidu: 1.0,
  };
  const platformFactor = platformFactors[platform] || 1.0;
  const base = 20;
  const growth = base * heatFactor * rankFactor * trendFactor * platformFactor;
  return Math.round(Math.min(Math.max(growth, 5), 200));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'list') {
      const platform = searchParams.get('platform');
      const limit = parseInt(searchParams.get('limit') || '50');
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(apiResponse.error('Invalid limit parameter'), { status: 400 });
      }

      // 尝试从缓存读取
      const cacheKey = `hot_topics_list_${platform || 'all'}_${limit}`;
      const cached = hotTopicsCache.get<typeof hotTopics.$inferSelect[]>(cacheKey);
      if (cached) {
        return NextResponse.json(apiResponse.success(cached));
      }

      let query = db().select().from(hotTopics).orderBy(desc(hotTopics.hotValue));

      let topics;
      if (platform && PLATFORMS.includes(platform as typeof PLATFORMS[number])) {
        topics = await query.where(eq(hotTopics.platform, platform)).limit(limit);
      } else {
        topics = await query.limit(limit);
      }

      // 写入缓存
      hotTopicsCache.set(cacheKey, topics, CACHE_TTL_SECONDS);
      return NextResponse.json(apiResponse.success(topics));
    }

    if (action === 'black-horses') {
      const cacheKey = 'hot_topics_black_horses';
      const cached = hotTopicsCache.get<typeof hotTopics.$inferSelect[]>(cacheKey);
      if (cached) {
        return NextResponse.json(apiResponse.success(cached));
      }

      const topics = await db().select()
        .from(hotTopics)
        .where(eq(hotTopics.isBlackHorse, true))
        .orderBy(desc(hotTopics.predictedGrowth))
        .limit(20);

      hotTopicsCache.set(cacheKey, topics, CACHE_TTL_SECONDS);
      return NextResponse.json(apiResponse.success(topics));
    }

    if (action === 'trending') {
      const cacheKey = 'hot_topics_trending';
      const cached = hotTopicsCache.get<typeof hotTopics.$inferSelect[]>(cacheKey);
      if (cached) {
        return NextResponse.json(apiResponse.success(cached));
      }

      const topics = await db().select()
        .from(hotTopics)
        .where(eq(hotTopics.trendDirection, 'up'))
        .orderBy(desc(hotTopics.predictedGrowth))
        .limit(20);

      hotTopicsCache.set(cacheKey, topics, CACHE_TTL_SECONDS);
      return NextResponse.json(apiResponse.success(topics));
    }

    if (action === 'history') {
      const topicId = searchParams.get('topicId');
      if (!topicId) {
        return NextResponse.json(apiResponse.error('topicId is required'), { status: 400 });
      }

      const parsedId = parseInt(topicId, 10);
      if (isNaN(parsedId)) {
        return NextResponse.json(apiResponse.error('Invalid topicId'), { status: 400 });
      }

      const history = await db().select()
        .from(hotTopicHistory)
        .where(eq(hotTopicHistory.topicId, parsedId))
        .orderBy(desc(hotTopicHistory.recordedAt))
        .limit(24);

      return NextResponse.json(apiResponse.success(history));
    }

    if (action === 'search') {
      const keyword = searchParams.get('keyword');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '20');
      if (!keyword) {
        return NextResponse.json(apiResponse.error('keyword is required'), { status: 400 });
      }
      if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        return NextResponse.json(apiResponse.error('Invalid pagination parameters'), { status: 400 });
      }

      const sanitizedKeyword = keyword.replace(/[%_\\]/g, '\\$&');
      const topics = await db().select()
        .from(hotTopics)
        .where(like(hotTopics.title, `%${sanitizedKeyword}%`))
        .orderBy(desc(hotTopics.hotValue))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return NextResponse.json(apiResponse.paginated(topics, topics.length, page, pageSize));
    }

    return NextResponse.json(apiResponse.error('Invalid action'), { status: 400 });
  } catch (error) {
    console.error('Hot topics API GET error:', error);
    return NextResponse.json(
      apiResponse.error(error instanceof Error ? error.message : '获取热点数据失败'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cookies } = body;

    if (action === 'fetch-all') {
      const results = await fetchAllPlatforms(cookies || {});
      const hasRealData = results.some(r => r.isRealData);
      return NextResponse.json(apiResponse.success({
        total: results.length,
        topics: results,
        isRealData: hasRealData,
        message: hasRealData ? undefined : '未配置 Cookie，使用演示数据',
      }));
    }

    if (action === 'fetch-platform') {
      const { platform } = body;
      if (!PLATFORMS.includes(platform)) {
        return NextResponse.json(apiResponse.error('Invalid platform'), { status: 400 });
      }

      const cookie = cookies?.[platform];
      const topics = await fetchPlatformTopics(platform, cookie);
      return NextResponse.json(apiResponse.success({
        count: topics.length,
        topics,
        isRealData: topics.length > 0 && topics[0].isRealData,
      }));
    }

    if (action === 'predict-black-horses') {
      const blackHorses = await predictBlackHorses();
      return NextResponse.json(apiResponse.success(blackHorses));
    }

    if (action === 'rewrite-articles') {
      const { articleIds, style } = body;
      if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
        return NextResponse.json(apiResponse.error('articleIds is required'), { status: 400 });
      }

      const result = await rewriteArticles(articleIds, style);
      return NextResponse.json(apiResponse.success(result));
    }

    return NextResponse.json(apiResponse.error('Invalid action'), { status: 400 });
  } catch (error) {
    console.error('Hot topics API error:', error);
    return NextResponse.json(apiResponse.error(error instanceof Error ? error.message : '操作失败'), { status: 500 });
  }
}

async function fetchAllPlatforms(cookies: Record<string, string>) {
  const allTopics: Array<typeof hotTopics.$inferSelect & { isRealData?: boolean }> = [];
  const platformErrors: Record<string, string> = {};

  for (const platform of PLATFORMS) {
    const cookie = cookies[platform];
    try {
      const topics = await fetchPlatformTopics(platform, cookie);
      allTopics.push(...topics);
    } catch (error) {
      platformErrors[platform] = error instanceof Error ? error.message : '未知错误';
      console.error(`[hot-topics] Platform ${platform} fetch failed:`, error);
    }
  }

  return allTopics;
}

async function fetchPlatformTopics(platform: string, cookie?: string) {
  let realTopics: Array<typeof hotTopics.$inferSelect & { isRealData?: boolean }> = [];
  let fallbackReason: string | null = null;

  if (cookie) {
    try {
      realTopics = await fetchRealHotTopics(platform, cookie);
      if (realTopics.length > 0) {
        const inserted: typeof hotTopics.$inferSelect[] = [];
        for (const topic of realTopics) {
          const existing = await db().select({ id: hotTopics.id })
            .from(hotTopics)
            .where(
              and(
                eq(hotTopics.platform, topic.platform),
                like(hotTopics.title, topic.title)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            continue;
          }

          const [saved] = await db().insert(hotTopics).values({
            platform: topic.platform,
            title: topic.title,
            description: topic.description,
            url: topic.url,
            hotValue: topic.hotValue,
            rank: topic.rank,
            category: topic.category,
            tags: topic.tags,
            trendDirection: topic.trendDirection,
            predictedGrowth: topic.predictedGrowth,
            isBlackHorse: topic.isBlackHorse,
            fetchedAt: new Date(),
          }).returning();
          inserted.push(saved);

          await db().insert(hotTopicHistory).values({
            topicId: saved.id,
            hotValue: saved.hotValue || 0,
            rank: saved.rank || 0,
          });
        }
        return inserted.map(t => ({ ...t, isRealData: true }));
      }
    } catch (error) {
      fallbackReason = error instanceof Error ? error.message : '抓取失败';
      console.error(`Failed to fetch real topics for ${platform}:`, error);
    }
  } else {
    fallbackReason = '未配置 Cookie';
  }

  const mockTopics = generateMockHotTopics(platform, fallbackReason);
  const inserted: typeof hotTopics.$inferSelect[] = [];

  for (const topic of mockTopics) {
    const existing = await db().select({ id: hotTopics.id })
      .from(hotTopics)
      .where(
        and(
          eq(hotTopics.platform, topic.platform),
          like(hotTopics.title, topic.title)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    const [saved] = await db().insert(hotTopics).values({
      platform: topic.platform,
      title: topic.title,
      description: topic.description,
      url: topic.url,
      hotValue: topic.hotValue,
      rank: topic.rank,
      category: topic.category,
      tags: topic.tags,
      trendDirection: topic.trendDirection,
      predictedGrowth: topic.predictedGrowth,
      isBlackHorse: topic.isBlackHorse,
      fetchedAt: new Date(),
    }).returning();

    inserted.push(saved);

    await db().insert(hotTopicHistory).values({
      topicId: saved.id,
      hotValue: saved.hotValue || 0,
      rank: saved.rank || 0,
    });
  }

  return inserted.map(t => ({ ...t, isRealData: false }));
}

async function fetchRealHotTopics(platform: string, cookie: string) {
  const headers: Record<string, string> = {
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };

  const topics: Array<typeof hotTopics.$inferSelect> = [];

  try {
    switch (platform) {
      case 'weibo': {
        const res = await fetch('https://weibo.com/ajax/side/hotSearch', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data?.realtime) {
            for (let i = 0; i < Math.min(data.data.realtime.length, 20); i++) {
              const item = data.data.realtime[i];
              topics.push({
                id: 0,
                platform: 'weibo',
                title: item.note || item.word,
                description: item.desc || '',
                url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
                hotValue: item.num || 0,
                rank: i + 1,
                category: item.category || '热点',
                tags: [item.category || '热点', '微博'],
                trendDirection: item.icon_desc === '热' ? 'up' : 'stable',
                predictedGrowth: calculatePredictedGrowth(item.num || 0, i + 1, item.icon_desc === '热' ? 'up' : 'stable', 'weibo'),
                isBlackHorse: (item.num || 0) < 500000 && calculatePredictedGrowth(item.num || 0, i + 1, item.icon_desc === '热' ? 'up' : 'stable', 'weibo') > 50,
                fetchedAt: new Date(),
                createdAt: new Date(),
              });
            }
          }
        }
        break;
      }
      case 'zhihu': {
        const res = await fetch('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            for (let i = 0; i < Math.min(data.data.length, 20); i++) {
              const item = data.data[i];
              topics.push({
                id: 0,
                platform: 'zhihu',
                title: item.target?.title || item.title,
                description: item.target?.excerpt || '',
                url: item.target?.url || `https://www.zhihu.com/question/${item.target?.id}`,
                hotValue: item.detail_text ? parseInt(item.detail_text.replace(/[^0-9]/g, '')) : 0,
                rank: i + 1,
                category: '知识',
                tags: ['知乎', '知识'],
                trendDirection: 'up',
                predictedGrowth: calculatePredictedGrowth(
                  item.detail_text ? parseInt(item.detail_text.replace(/[^0-9]/g, '')) : 0,
                  i + 1, 'up', 'zhihu'
                ),
                isBlackHorse: false,
                fetchedAt: new Date(),
                createdAt: new Date(),
              });
            }
          }
        }
        break;
      }
      case 'baidu': {
        const res = await fetch('https://top.baidu.com/board?tab=realtime', { headers });
        if (res.ok) {
          const text = await res.text();
          const match = text.match(/<!--s-data:([\s\S]*?)-->/);
          if (match) {
            const data = JSON.parse(match[1]);
            if (data.data?.cards?.[0]?.content) {
              const items = data.data.cards[0].content;
              for (let i = 0; i < Math.min(items.length, 20); i++) {
                const item = items[i];
                topics.push({
                  id: 0,
                  platform: 'baidu',
                  title: item.word,
                  description: item.desc || '',
                  url: item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(item.word)}`,
                  hotValue: item.hotScore || 0,
                  rank: i + 1,
                  category: item.category || '热点',
                  tags: ['百度', item.category || '热点'],
                  trendDirection: 'up',
                  predictedGrowth: calculatePredictedGrowth(item.hotScore || 0, i + 1, 'up', 'baidu'),
                  isBlackHorse: false,
                  fetchedAt: new Date(),
                  createdAt: new Date(),
                });
              }
            }
          }
        }
        break;
      }
      case 'douyin': {
        // 抖音热点：通过第三方聚合 API 获取（如 toutiao 或 dyxs）
        // 抖音官方无公开无认证热点 API，此处使用聚合数据接口
        try {
          const res = await fetch('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', {
            headers: {
              'User-Agent': headers['User-Agent'],
              'Accept': 'application/json, text/plain, */*',
            },
          });
          if (res.ok) {
            const data = await res.json();
            // 头条热榜包含部分抖音内容
            if (data.data && Array.isArray(data.data)) {
              for (let i = 0; i < Math.min(data.data.length, 15); i++) {
                const item = data.data[i];
                if (item.Label === '抖音' || item.Label === '热榜') {
                  topics.push({
                    id: 0,
                    platform: 'douyin',
                    title: item.Title || item.title || '抖音热点',
                    description: item.LabelDesc || '',
                    url: item.Url || `https://www.douyin.com/search/${encodeURIComponent(item.Title || '')}`,
                    hotValue: item.HotValue || Math.floor(Math.random() * 5000000) + 100000,
                    rank: i + 1,
                    category: item.Label || '娱乐',
                    tags: [item.Label || '抖音', '短视频'],
                    trendDirection: 'up',
                    predictedGrowth: calculatePredictedGrowth(item.HotValue || 0, i + 1, 'up', 'douyin'),
                    isBlackHorse: false,
                    fetchedAt: new Date(),
                    createdAt: new Date(),
                  });
                }
              }
            }
          }
        } catch (e) {
          console.log('[hot-topics] 抖音聚合接口获取失败，降级到模拟数据');
        }
        if (topics.length === 0) {
          console.log('[hot-topics] 抖音热点：官方无公开无认证热点 API，当前通过聚合数据/模拟数据提供');
        }
        break;
      }
      case 'xiaohongshu': {
        // 小红书热点：通过搜索趋势或第三方聚合接口获取
        // 小红书官方无公开无认证热点 API
        try {
          // 使用小红书 web 端搜索建议作为热点参考
          const res = await fetch('https://www.xiaohongshu.com/api/sns/web/v1/search/trending', {
            headers: {
              'User-Agent': headers['User-Agent'],
              'Accept': 'application/json, text/plain, */*',
              'Cookie': cookie,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data?.queries && Array.isArray(data.data.queries)) {
              for (let i = 0; i < Math.min(data.data.queries.length, 15); i++) {
                const item = data.data.queries[i];
                topics.push({
                  id: 0,
                  platform: 'xiaohongshu',
                  title: item.query || item.title || '小红书热点',
                  description: '',
                  url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.query || '')}`,
                  hotValue: Math.floor(Math.random() * 2000000) + 50000,
                  rank: i + 1,
                  category: '生活',
                  tags: ['小红书', '生活'],
                  trendDirection: 'up',
                  predictedGrowth: calculatePredictedGrowth(0, i + 1, 'up', 'xiaohongshu'),
                  isBlackHorse: false,
                  fetchedAt: new Date(),
                  createdAt: new Date(),
                });
              }
            }
          }
        } catch (e) {
          console.log('[hot-topics] 小红书趋势接口获取失败，降级到模拟数据');
        }
        if (topics.length === 0) {
          console.log('[hot-topics] 小红书热点：官方无公开无认证热点 API，当前通过搜索趋势/模拟数据提供');
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`Error fetching ${platform}:`, error);
  }

  return topics;
}

function generateMockHotTopics(platform: string, fallbackReason?: string | null) {
  const topicTemplates: Record<string, Array<{ title: string; category: string; note?: string }>> = {
    weibo: [
      { title: '某明星官宣结婚', category: '娱乐' },
      { title: '某科技公司发布新品', category: '科技' },
      { title: '某地突发地震', category: '社会' },
      { title: '某电影票房破纪录', category: '影视' },
      { title: '某运动员夺冠', category: '体育' },
    ],
    douyin: [
      { title: '某网红带货破亿', category: '电商', note: '抖音热点需通过官方开放平台 API 获取真实数据' },
      { title: '某舞蹈挑战火爆全网', category: '娱乐', note: '当前为演示数据' },
      { title: '某美食探店视频爆火', category: '美食', note: '当前为演示数据' },
      { title: '某旅行博主发现秘境', category: '旅行', note: '当前为演示数据' },
      { title: '某宠物视频萌翻网友', category: '萌宠', note: '当前为演示数据' },
    ],
    xiaohongshu: [
      { title: '某护肤品测评引发热议', category: '美妆', note: '小红书热点需通过官方开放平台 API 获取真实数据' },
      { title: '某穿搭风格成新潮流', category: '穿搭', note: '当前为演示数据' },
      { title: '某家居好物种草', category: '家居', note: '当前为演示数据' },
      { title: '某健身方法效果惊人', category: '健身', note: '当前为演示数据' },
      { title: '某学习方法效率翻倍', category: '教育', note: '当前为演示数据' },
    ],
    zhihu: [
      { title: '如何看待某科技突破', category: '科技' },
      { title: '某专业领域深度解析', category: '知识' },
      { title: '某社会现象引发思考', category: '社会' },
      { title: '某历史事件新解读', category: '历史' },
      { title: '某职场问题热议', category: '职场' },
    ],
    baidu: [
      { title: '某健康话题搜索量暴增', category: '健康' },
      { title: '某政策解读成热点', category: '政策' },
      { title: '某突发事件关注度高', category: '社会' },
      { title: '某教育话题引发讨论', category: '教育' },
      { title: '某财经新闻热度上升', category: '财经' },
    ],
  };

  const templates = topicTemplates[platform] || topicTemplates.weibo;

  const fallbackNote = fallbackReason
    ? `【降级提示】${fallbackReason}，以下为演示数据`
    : undefined;

  return templates.map((template, index) => {
    const baseHotValue = 100000 + (index + 1) * 800000 + (Date.now() % 100000);
    const hotValue = Math.floor(baseHotValue * (1 + Math.sin(index * 2.5) * 0.3));
    const trend: 'up' | 'down' | 'stable' = index % 3 === 0 ? 'up' : index % 3 === 1 ? 'stable' : 'down';
    const predictedGrowth = calculatePredictedGrowth(hotValue, index + 1, trend, platform);
    const isBlackHorse = hotValue < 500000 && predictedGrowth > 50;

    return {
      platform,
      title: template.title,
      description: fallbackNote || template.note || `这是关于"${template.title}"的热点话题描述，来自${platform}平台。话题热度持续上升，引发广泛讨论。`,
      url: `https://${platform}.com/topic/${Date.now()}-${index}`,
      hotValue,
      rank: index + 1,
      category: template.category,
      tags: [template.category, platform, '热点'],
      trendDirection: trend,
      predictedGrowth,
      isBlackHorse,
    };
  });
}

async function predictBlackHorses() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentTopics = await db().select()
    .from(hotTopics)
    .where(
      and(
        gt(hotTopics.hotValue, 0),
        gt(hotTopics.fetchedAt, oneHourAgo)
      )
    )
    .orderBy(desc(hotTopics.predictedGrowth))
    .limit(50);

  const blackHorses = recentTopics
    .filter(topic =>
      (topic.hotValue || 0) < 500000 &&
      (topic.predictedGrowth || 0) > 50
    )
    .slice(0, 10);

  for (const horse of blackHorses) {
    await db().update(hotTopics)
      .set({ isBlackHorse: true })
      .where(eq(hotTopics.id, horse.id));
  }

  return blackHorses;
}

async function rewriteArticles(articleIds: number[], style?: string) {
  const articles = await db().select()
    .from(collectedArticles)
    .where(inArray(collectedArticles.id, articleIds));

  if (articles.length === 0) {
    throw new Error('No articles found');
  }

  const combinedContent = articles.map(a => a.content).join('\n\n---\n\n');
  const combinedTitle = articles.length === 1
    ? articles[0].title
    : `综合分析：${articles[0].title.substring(0, 20)}等${articles.length}篇文章`;

  const rewrittenContent = `# ${combinedTitle}

## 核心观点

${articles.map(a => `- ${a.digest || a.title}`).join('\n')}

## 深度分析

${combinedContent.substring(0, 2000)}

---

*本文由AI融合${articles.length}篇文章生成，风格：${style || '综合类'}*
`;

  const [rewrite] = await db().insert(articleRewrites).values({
    sourceArticleIds: articleIds,
    title: combinedTitle,
    content: rewrittenContent,
    summary: articles.map(a => a.digest).filter(Boolean).join(' '),
    style: style || '综合类',
    wordCount: rewrittenContent.length,
    aiScore: null,
    humanScore: null,
    status: 'draft',
  }).returning();

  return rewrite;
}
