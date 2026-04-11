import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hotTopics, hotTopicHistory, wechatSubscriptions, collectedArticles, monitorLogs } from '@/lib/db/schema';
import { eq, desc, and, gt, inArray } from 'drizzle-orm';

const PLATFORMS = ['weibo', 'douyin', 'xiaohongshu', 'zhihu', 'baidu'] as const;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'status') {
    return await getMonitorStatus();
  }

  if (action === 'logs') {
    const limit = parseInt(searchParams.get('limit') || '50');
    return await getMonitorLogs(limit);
  }

  if (action === 'alerts') {
    return await getAlerts();
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === 'start') {
    const { interval = 300 } = body;
    return await startMonitor(interval);
  }

  if (action === 'stop') {
    return await stopMonitor();
  }

  if (action === 'run-once') {
    return await runMonitorOnce();
  }

  if (action === 'check-black-horses') {
    return await checkBlackHorses();
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function getMonitorStatus() {
  const recentTopics = await db().select()
    .from(hotTopics)
    .orderBy(desc(hotTopics.fetchedAt))
    .limit(1);

  const recentArticles = await db().select()
    .from(collectedArticles)
    .orderBy(desc(collectedArticles.createdAt))
    .limit(1);

  const activeSubscriptions = await db().select()
    .from(wechatSubscriptions)
    .where(eq(wechatSubscriptions.monitorEnabled, true));

  const blackHorses = await db().select()
    .from(hotTopics)
    .where(eq(hotTopics.isBlackHorse, true))
    .limit(10);

  return NextResponse.json({
    status: 'running',
    lastHotTopicsFetch: recentTopics[0]?.fetchedAt || null,
    lastArticleFetch: recentArticles[0]?.createdAt || null,
    activeSubscriptions: activeSubscriptions.length,
    blackHorseCount: blackHorses.length,
    platforms: PLATFORMS.map(p => ({
      name: p,
      status: 'active',
      lastFetch: recentTopics[0]?.fetchedAt || null,
    })),
  });
}

async function getMonitorLogs(limit: number) {
  const logs = await db().select()
    .from(monitorLogs)
    .orderBy(desc(monitorLogs.createdAt))
    .limit(limit);

  return NextResponse.json({ logs });
}

async function getAlerts() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const newBlackHorses = await db().select()
    .from(hotTopics)
    .where(and(
      eq(hotTopics.isBlackHorse, true),
      gt(hotTopics.createdAt, oneHourAgo)
    ))
    .orderBy(desc(hotTopics.predictedGrowth))
    .limit(10);

  const trendingTopics = await db().select()
    .from(hotTopics)
    .where(and(
      eq(hotTopics.trendDirection, 'up'),
      gt(hotTopics.hotValue, 5000000)
    ))
    .orderBy(desc(hotTopics.hotValue))
    .limit(10);

  return NextResponse.json({
    blackHorses: newBlackHorses,
    trending: trendingTopics,
    alertCount: newBlackHorses.length + trendingTopics.length,
  });
}

async function startMonitor(interval: number) {
  await logMonitorEvent('monitor_started', `监控已启动，间隔 ${interval} 秒`);

  return NextResponse.json({
    success: true,
    message: '热点自动监控功能暂未实现，请手动刷新获取最新热点',
    interval,
    isRealData: false,
  });
}

async function stopMonitor() {
  await logMonitorEvent('monitor_stopped', '监控已停止');

  return NextResponse.json({
    success: true,
    message: '监控已停止',
  });
}

async function runMonitorOnce() {
  const results = {
    hotTopics: 0,
    articles: 0,
    blackHorses: 0,
    errors: [] as string[],
  };

  try {
    for (const platform of PLATFORMS) {
      const topics = await fetchPlatformTopics(platform);
      results.hotTopics += topics.length;
    }

    const blackHorses = await predictBlackHorses();
    results.blackHorses = blackHorses.length;

    await logMonitorEvent('monitor_run', 
      `监控完成：获取 ${results.hotTopics} 条热点，发现 ${results.blackHorses} 个黑马`);

  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    await logMonitorEvent('monitor_error', results.errors.join('\n'));
  }

  return NextResponse.json({
    success: results.errors.length === 0,
    results,
  });
}

async function checkBlackHorses() {
  const blackHorses = await predictBlackHorses();

  await logMonitorEvent('black_horse_check', 
    `发现 ${blackHorses.length} 个黑马：${blackHorses.map(h => h.title).join(', ')}`);

  return NextResponse.json({
    success: true,
    blackHorses,
    count: blackHorses.length,
  });
}

async function fetchPlatformTopics(platform: string) {
  const mockTopics = generateMockHotTopics(platform);

  const inserted: typeof hotTopics.$inferSelect[] = [];

  for (const topic of mockTopics) {
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

  // 标记当前返回的是Mock数据
  return inserted.map(item => ({ ...item, isRealData: false }));
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

async function logMonitorEvent(type: string, message: string) {
  try {
    await db().insert(monitorLogs).values({
      type,
      message,
      createdAt: new Date(),
    });
  } catch {
    // Ignore logging errors
  }
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
