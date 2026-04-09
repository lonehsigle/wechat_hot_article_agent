import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hotTopics, hotTopicHistory, collectedArticles, articleRewrites } from '@/lib/db/schema';
import { eq, desc, and, gt, inArray, or, like, sql } from 'drizzle-orm';

const PLATFORMS = ['weibo', 'douyin', 'xiaohongshu', 'zhihu', 'baidu'] as const;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'list') {
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = db().select().from(hotTopics).orderBy(desc(hotTopics.hotValue));
    
    if (platform && PLATFORMS.includes(platform as typeof PLATFORMS[number])) {
      const topics = await query.where(eq(hotTopics.platform, platform)).limit(limit);
      return NextResponse.json(topics);
    }
    
    const topics = await query.limit(limit);
    return NextResponse.json(topics);
  }

  if (action === 'black-horses') {
    const topics = await db().select()
      .from(hotTopics)
      .where(eq(hotTopics.isBlackHorse, true))
      .orderBy(desc(hotTopics.predictedGrowth))
      .limit(20);
    
    return NextResponse.json(topics);
  }

  if (action === 'trending') {
    const topics = await db().select()
      .from(hotTopics)
      .where(eq(hotTopics.trendDirection, 'up'))
      .orderBy(desc(hotTopics.predictedGrowth))
      .limit(20);
    
    return NextResponse.json(topics);
  }

  if (action === 'history') {
    const topicId = searchParams.get('topicId');
    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }
    
    const history = await db().select()
      .from(hotTopicHistory)
      .where(eq(hotTopicHistory.topicId, parseInt(topicId)))
      .orderBy(desc(hotTopicHistory.recordedAt))
      .limit(24);
    
    return NextResponse.json(history);
  }

  if (action === 'search') {
    const keyword = searchParams.get('keyword');
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }
    
    const topics = await db().select()
      .from(hotTopics)
      .where(like(hotTopics.title, `%${keyword}%`))
      .orderBy(desc(hotTopics.hotValue))
      .limit(50);
    
    return NextResponse.json(topics);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cookies } = body;

    if (action === 'fetch-all') {
      const results = await fetchAllPlatforms(cookies || {});
      const hasRealData = results.some(r => r.isRealData);
      return NextResponse.json({ 
        success: true, 
        total: results.length, 
        topics: results,
        isRealData: hasRealData,
        message: hasRealData ? undefined : '未配置 Cookie，使用演示数据'
      });
    }

    if (action === 'fetch-platform') {
      const { platform } = body;
      if (!PLATFORMS.includes(platform)) {
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
      }
      
      const cookie = cookies?.[platform];
      const topics = await fetchPlatformTopics(platform, cookie);
      return NextResponse.json({ 
        success: true, 
        count: topics.length, 
        topics,
        isRealData: topics.length > 0 && topics[0].isRealData
      });
    }

    if (action === 'predict-black-horses') {
      const blackHorses = await predictBlackHorses();
      return NextResponse.json({ success: true, blackHorses });
    }

    if (action === 'rewrite-articles') {
      const { articleIds, style } = body;
      if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
        return NextResponse.json({ error: 'articleIds is required' }, { status: 400 });
      }
      
      const result = await rewriteArticles(articleIds, style);
      return NextResponse.json({ success: true, article: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Hot topics API error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '操作失败' }, { status: 500 });
  }
}

async function fetchAllPlatforms(cookies: Record<string, string>) {
  const allTopics: Array<typeof hotTopics.$inferSelect & { isRealData?: boolean }> = [];
  
  for (const platform of PLATFORMS) {
    const cookie = cookies[platform];
    const topics = await fetchPlatformTopics(platform, cookie);
    allTopics.push(...topics);
  }
  
  return allTopics;
}

async function fetchPlatformTopics(platform: string, cookie?: string) {
  let realTopics: Array<typeof hotTopics.$inferSelect & { isRealData?: boolean }> = [];
  
  if (cookie) {
    try {
      realTopics = await fetchRealHotTopics(platform, cookie);
      if (realTopics.length > 0) {
        const inserted: typeof hotTopics.$inferSelect[] = [];
        for (const topic of realTopics) {
          // 去重检查：按标题模糊匹配同平台已有话题
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
            continue; // 已存在相同标题的话题，跳过插入
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
      console.error(`Failed to fetch real topics for ${platform}:`, error);
    }
  }
  
  const mockTopics = generateMockHotTopics(platform);
  const inserted: typeof hotTopics.$inferSelect[] = [];
  
  for (const topic of mockTopics) {
    // 去重检查：按标题模糊匹配同平台已有话题
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
      continue; // 已存在相同标题的话题，跳过插入
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
                predictedGrowth: Math.random() * 50,
                isBlackHorse: false,
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
                predictedGrowth: Math.random() * 50,
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
                predictedGrowth: Math.random() * 50,
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
      default:
        break;
    }
  } catch (error) {
    console.error(`Error fetching ${platform}:`, error);
  }

  return topics;
}

function generateMockHotTopics(platform: string) {
  const topicTemplates: Record<string, Array<{ title: string; category: string }>> = {
    weibo: [
      { title: '某明星官宣结婚', category: '娱乐' },
      { title: '某科技公司发布新品', category: '科技' },
      { title: '某地突发地震', category: '社会' },
      { title: '某电影票房破纪录', category: '影视' },
      { title: '某运动员夺冠', category: '体育' },
    ],
    douyin: [
      { title: '某网红带货破亿', category: '电商' },
      { title: '某舞蹈挑战火爆全网', category: '娱乐' },
      { title: '某美食探店视频爆火', category: '美食' },
      { title: '某旅行博主发现秘境', category: '旅行' },
      { title: '某宠物视频萌翻网友', category: '萌宠' },
    ],
    xiaohongshu: [
      { title: '某护肤品测评引发热议', category: '美妆' },
      { title: '某穿搭风格成新潮流', category: '穿搭' },
      { title: '某家居好物种草', category: '家居' },
      { title: '某健身方法效果惊人', category: '健身' },
      { title: '某学习方法效率翻倍', category: '教育' },
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
  
  return templates.map((template, index) => {
    const hotValue = Math.floor(Math.random() * 10000000) + 100000;
    const isBlackHorse = hotValue < 500000 && Math.random() > 0.7;
    
    return {
      platform,
      title: template.title,
      description: `这是关于"${template.title}"的热点话题描述，来自${platform}平台。话题热度持续上升，引发广泛讨论。`,
      url: `https://${platform}.com/topic/${Date.now()}-${index}`,
      hotValue,
      rank: index + 1,
      category: template.category,
      tags: [template.category, platform, '热点'],
      trendDirection: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      predictedGrowth: isBlackHorse ? Math.random() * 200 + 100 : Math.random() * 50,
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
    aiScore: Math.random() * 30 + 70,
    humanScore: Math.random() * 20 + 80,
    status: 'draft',
  }).returning();
  
  return rewrite;
}
