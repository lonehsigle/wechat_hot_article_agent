import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platformPosts, postComments, creators, commentWordCloud, crawlTasks } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

const PLATFORMS = ['xiaohongshu', 'douyin', 'kuaishou', 'bilibili', 'weibo', 'tieba', 'zhihu'] as const;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'list-posts') {
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');
    return await listPosts(platform, limit);
  }

  if (action === 'get-post') {
    const id = searchParams.get('id');
    return await getPost(id);
  }

  if (action === 'list-comments') {
    const postId = searchParams.get('postId');
    const limit = parseInt(searchParams.get('limit') || '100');
    return await listComments(postId, limit);
  }

  if (action === 'list-creators') {
    const platform = searchParams.get('platform');
    return await listCreators(platform);
  }

  if (action === 'list-tasks') {
    return await listTasks();
  }

  if (action === 'word-cloud') {
    const postId = searchParams.get('postId');
    return await getWordCloud(postId);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === 'search') {
    const { platform, keyword, limit, cookie } = body;
    return await searchPosts(platform, keyword, limit, cookie);
  }

  if (action === 'crawl-post') {
    const { platform, postId } = body;
    return await crawlPost(platform, postId);
  }

  if (action === 'crawl-comments') {
    const { postId, includeReplies } = body;
    return await crawlComments(postId, includeReplies);
  }

  if (action === 'add-creator') {
    const { platform, creatorId, name } = body;
    return await addCreator(platform, creatorId, name);
  }

  if (action === 'crawl-creator') {
    const { creatorId } = body;
    return await crawlCreatorPosts(creatorId);
  }

  if (action === 'generate-word-cloud') {
    const { postId } = body;
    return await generateWordCloud(postId);
  }

  if (action === 'batch-crawl') {
    const { platform, keywords, postIds } = body;
    return await batchCrawl(platform, keywords, postIds);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function listPosts(platform: string | null, limit: number) {
  let posts;
  
  if (platform) {
    posts = await db().select().from(platformPosts)
      .where(eq(platformPosts.platform, platform))
      .orderBy(desc(platformPosts.fetchedAt))
      .limit(limit);
  } else {
    posts = await db().select().from(platformPosts)
      .orderBy(desc(platformPosts.fetchedAt))
      .limit(limit);
  }

  return NextResponse.json({ success: true, posts });
}

async function getPost(id: string | null) {
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const [post] = await db().select().from(platformPosts).where(eq(platformPosts.id, parseInt(id)));
  
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, post });
}

async function listComments(postId: string | null, limit: number) {
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  const comments = await db().select().from(postComments)
    .where(eq(postComments.postId, parseInt(postId)))
    .orderBy(desc(postComments.likeCount))
    .limit(limit);

  return NextResponse.json({ success: true, comments });
}

async function listCreators(platform: string | null) {
  let creatorsList;
  
  if (platform) {
    creatorsList = await db().select().from(creators)
      .where(eq(creators.platform, platform))
      .orderBy(desc(creators.followerCount));
  } else {
    creatorsList = await db().select().from(creators)
      .orderBy(desc(creators.followerCount));
  }

  return NextResponse.json({ success: true, creators: creatorsList });
}

async function listTasks() {
  const tasks = await db().select().from(crawlTasks).orderBy(desc(crawlTasks.createdAt));
  return NextResponse.json({ success: true, tasks });
}

async function getWordCloud(postId: string | null) {
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  const [wordCloud] = await db().select().from(commentWordCloud)
    .where(eq(commentWordCloud.postId, parseInt(postId)));

  return NextResponse.json({ success: true, wordCloud });
}

async function searchPosts(platform: string, keyword: string, limit: number = 20, cookie?: string) {
  if (!platform || !keyword) {
    return NextResponse.json({ error: 'platform and keyword are required' }, { status: 400 });
  }

  const [task] = await db().insert(crawlTasks).values({
    platform,
    type: 'search',
    keyword,
    status: 'running',
    startedAt: new Date(),
  }).returning();

  let posts;
  let isRealData = false;

  if (cookie && cookie.trim()) {
    // 有Cookie时，尝试真实爬取（这里需要实际实现爬虫逻辑）
    // 由于真实爬取涉及复杂的反爬处理，这里返回提示信息
    // 实际项目中可以使用 playwright 或 puppeteer 进行爬取
    isRealData = false;
    posts = generateMockSearchResults(platform, keyword, limit);
    // TODO: 实现真实爬取逻辑
    // posts = await realSearchPosts(platform, keyword, cookie, limit);
  } else {
    posts = generateMockSearchResults(platform, keyword, limit);
  }

  const insertedPosts = [];
  for (const post of posts) {
    const [saved] = await db().insert(platformPosts).values({
      platform: post.platform,
      postId: post.postId,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      coverImage: post.coverImage,
      images: post.images,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      collectCount: post.collectCount,
      viewCount: post.viewCount,
      tags: post.tags,
      category: post.category,
      fetchedAt: new Date(),
    }).returning();
    insertedPosts.push(saved);
  }

  await db().update(crawlTasks)
    .set({
      status: 'completed',
      totalItems: posts.length,
      crawledItems: posts.length,
      completedAt: new Date(),
    })
    .where(eq(crawlTasks.id, task.id));

  return NextResponse.json({
    success: true,
    taskId: task.id,
    posts: insertedPosts,
    total: insertedPosts.length,
    isRealData,
    message: cookie ? 'Cookie已接收，真实爬取功能需要部署爬虫服务' : '使用演示数据，配置Cookie后可尝试真实爬取',
  });
}

async function crawlPost(platform: string, postId: string) {
  if (!platform || !postId) {
    return NextResponse.json({ error: 'platform and postId are required' }, { status: 400 });
  }

  const [task] = await db().insert(crawlTasks).values({
    platform,
    type: 'detail',
    postId,
    status: 'running',
    startedAt: new Date(),
  }).returning();

  const mockPost = generateMockPostDetail(platform, postId);

  const [savedPost] = await db().insert(platformPosts).values({
    platform: mockPost.platform,
    postId: mockPost.postId,
    title: mockPost.title,
    content: mockPost.content,
    authorId: mockPost.authorId,
    authorName: mockPost.authorName,
    authorAvatar: mockPost.authorAvatar,
    coverImage: mockPost.coverImage,
    images: mockPost.images,
    videoUrl: mockPost.videoUrl,
    likeCount: mockPost.likeCount,
    commentCount: mockPost.commentCount,
    shareCount: mockPost.shareCount,
    collectCount: mockPost.collectCount,
    viewCount: mockPost.viewCount,
    publishTime: mockPost.publishTime,
    tags: mockPost.tags,
    category: mockPost.category,
    fetchedAt: new Date(),
  }).returning();

  await db().update(crawlTasks)
    .set({
      status: 'completed',
      totalItems: 1,
      crawledItems: 1,
      completedAt: new Date(),
    })
    .where(eq(crawlTasks.id, task.id));

  return NextResponse.json({
    success: true,
    taskId: task.id,
    post: savedPost,
  });
}

async function crawlComments(postId: number, includeReplies: boolean = true) {
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  const [post] = await db().select().from(platformPosts).where(eq(platformPosts.id, postId));
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const mockComments = generateMockComments(post.platform, postId, includeReplies);

  const insertedComments = [];
  for (const comment of mockComments) {
    const [saved] = await db().insert(postComments).values({
      postId: comment.postId,
      platform: comment.platform,
      commentId: comment.commentId,
      parentId: comment.parentId,
      rootId: comment.rootId,
      userId: comment.userId,
      userName: comment.userName,
      userAvatar: comment.userAvatar,
      content: comment.content,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      isAuthor: comment.isAuthor,
      publishTime: comment.publishTime,
      sentiment: comment.sentiment,
      keywords: comment.keywords,
      fetchedAt: new Date(),
    }).returning();
    insertedComments.push(saved);
  }

  return NextResponse.json({
    success: true,
    postId,
    comments: insertedComments,
    total: insertedComments.length,
  });
}

async function addCreator(platform: string, creatorId: string, name: string) {
  if (!platform || !creatorId || !name) {
    return NextResponse.json({ error: 'platform, creatorId and name are required' }, { status: 400 });
  }

  const [creator] = await db().insert(creators).values({
    platform,
    creatorId,
    name,
    monitorEnabled: false,
  }).returning();

  return NextResponse.json({ success: true, creator });
}

async function crawlCreatorPosts(creatorId: number) {
  if (!creatorId) {
    return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
  }

  const [creator] = await db().select().from(creators).where(eq(creators.id, creatorId));
  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  const mockPosts = generateMockCreatorPosts(creator.platform, creator.creatorId, creator.name);

  const insertedPosts = [];
  for (const post of mockPosts) {
    const [saved] = await db().insert(platformPosts).values({
      platform: post.platform,
      postId: post.postId,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      coverImage: post.coverImage,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      tags: post.tags,
      fetchedAt: new Date(),
    }).returning();
    insertedPosts.push(saved);
  }

  await db().update(creators)
    .set({ lastFetchAt: new Date() })
    .where(eq(creators.id, creatorId));

  return NextResponse.json({
    success: true,
    creator,
    posts: insertedPosts,
    total: insertedPosts.length,
  });
}

async function generateWordCloud(postId: number) {
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  const comments = await db().select().from(postComments)
    .where(eq(postComments.postId, postId));

  if (comments.length === 0) {
    return NextResponse.json({ error: 'No comments found' }, { status: 404 });
  }

  const keywordCounts: Record<string, number> = {};
  const emojiCounts: Record<string, number> = {};
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  for (const comment of comments) {
    const sentiment = comment.sentiment || 'neutral';
    if (sentiment === 'positive') positiveCount++;
    else if (sentiment === 'negative') negativeCount++;
    else neutralCount++;

    if (comment.keywords) {
      for (const keyword of comment.keywords) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
    }

    const emojis = comment.content?.match(/[\u{1F300}-\u{1F9FF}]/gu) || [];
    for (const emoji of emojis) {
      emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));

  const topEmojis = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([emoji, count]) => ({ emoji, count }));

  const sentimentScore = comments.length > 0 
    ? (positiveCount - negativeCount) / comments.length 
    : 0;

  const [wordCloud] = await db().insert(commentWordCloud).values({
    postId,
    platform: comments[0].platform,
    totalComments: comments.length,
    positiveCount,
    negativeCount,
    neutralCount,
    topKeywords,
    topEmojis,
    sentimentScore,
    generatedAt: new Date(),
  }).returning();

  return NextResponse.json({ success: true, wordCloud });
}

async function batchCrawl(platform: string, keywords: string[], postIds: string[]) {
  const results = {
    searchedPosts: 0,
    crawledPosts: 0,
    errors: [] as string[],
  };

  if (keywords && keywords.length > 0) {
    for (const keyword of keywords) {
      try {
        const result = await searchPosts(platform, keyword, 10);
        const data = await result.json();
        if (data.success) {
          results.searchedPosts += data.total;
        }
      } catch (error) {
        results.errors.push(`Search "${keyword}" failed: ${error}`);
      }
    }
  }

  if (postIds && postIds.length > 0) {
    for (const postId of postIds) {
      try {
        const result = await crawlPost(platform, postId);
        const data = await result.json();
        if (data.success) {
          results.crawledPosts++;
        }
      } catch (error) {
        results.errors.push(`Crawl post "${postId}" failed: ${error}`);
      }
    }
  }

  return NextResponse.json({ success: true, results });
}

function generateMockSearchResults(platform: string, keyword: string, limit: number) {
  const results = [];
  for (let i = 0; i < limit; i++) {
    results.push({
      platform,
      postId: `${platform}_${Date.now()}_${i}`,
      title: `关于"${keyword}"的${getPlatformName(platform)}内容 #${i + 1}`,
      content: `这是关于"${keyword}"的详细内容描述。在${getPlatformName(platform)}平台上，这个话题引起了广泛关注...`,
      authorId: `user_${Math.random().toString(36).substr(2, 9)}`,
      authorName: `${getRandomAuthorName()}`,
      authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      coverImage: `https://picsum.photos/400/300?random=${i}`,
      images: [],
      likeCount: Math.floor(Math.random() * 10000),
      commentCount: Math.floor(Math.random() * 1000),
      shareCount: Math.floor(Math.random() * 500),
      collectCount: Math.floor(Math.random() * 300),
      viewCount: Math.floor(Math.random() * 100000),
      tags: [keyword, getPlatformName(platform), getRandomTag()],
      category: getRandomCategory(),
    });
  }
  return results;
}

function generateMockPostDetail(platform: string, postId: string) {
  return {
    platform,
    postId,
    title: `深度解析：${getRandomTopic()}`,
    content: `这是一篇来自${getPlatformName(platform)}的详细内容。\n\n主要观点：\n1. 第一点分析...\n2. 第二点分析...\n3. 第三点分析...\n\n总结：这个话题值得深入探讨。`,
    authorId: `author_${Math.random().toString(36).substr(2, 9)}`,
    authorName: getRandomAuthorName(),
    authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${postId}`,
    coverImage: `https://picsum.photos/800/600?random=${postId}`,
    images: [],
    videoUrl: platform === 'douyin' || platform === 'kuaishou' || platform === 'bilibili' 
      ? `https://example.com/video/${postId}` 
      : null,
    likeCount: Math.floor(Math.random() * 50000),
    commentCount: Math.floor(Math.random() * 5000),
    shareCount: Math.floor(Math.random() * 2000),
    collectCount: Math.floor(Math.random() * 1000),
    viewCount: Math.floor(Math.random() * 500000),
    publishTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    tags: [getRandomTag(), getRandomTag(), getRandomTag()],
    category: getRandomCategory(),
  };
}

function generateMockComments(platform: string, postId: number, includeReplies: boolean) {
  const comments = [];
  const commentCount = Math.floor(Math.random() * 30) + 10;

  for (let i = 0; i < commentCount; i++) {
    const commentId = `comment_${Date.now()}_${i}`;
    const sentiment = Math.random() > 0.7 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral';
    
    comments.push({
      postId,
      platform,
      commentId,
      parentId: null,
      rootId: null,
      userId: `user_${Math.random().toString(36).substr(2, 9)}`,
      userName: getRandomAuthorName(),
      userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      content: getRandomComment(sentiment),
      likeCount: Math.floor(Math.random() * 500),
      replyCount: includeReplies ? Math.floor(Math.random() * 10) : 0,
      isAuthor: Math.random() > 0.95,
      publishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      sentiment,
      keywords: [getRandomTag(), getRandomTag()],
    });

    if (includeReplies && Math.random() > 0.6) {
      const replyCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < replyCount; j++) {
        comments.push({
          postId,
          platform,
          commentId: `reply_${Date.now()}_${i}_${j}`,
          parentId: commentId,
          rootId: commentId,
          userId: `user_${Math.random().toString(36).substr(2, 9)}`,
          userName: getRandomAuthorName(),
          userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}_${j}`,
          content: getRandomReply(),
          likeCount: Math.floor(Math.random() * 100),
          replyCount: 0,
          isAuthor: false,
          publishTime: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
          sentiment: 'neutral',
          keywords: [],
        });
      }
    }
  }

  return comments;
}

function generateMockCreatorPosts(platform: string, creatorId: string, creatorName: string) {
  const posts = [];
  const postCount = Math.floor(Math.random() * 10) + 5;

  for (let i = 0; i < postCount; i++) {
    posts.push({
      platform,
      postId: `${platform}_${creatorId}_${Date.now()}_${i}`,
      title: `${creatorName}的作品 #${i + 1}: ${getRandomTopic()}`,
      content: `这是${creatorName}发布的内容...`,
      authorId: creatorId,
      authorName: creatorName,
      coverImage: `https://picsum.photos/400/300?random=${creatorId}_${i}`,
      likeCount: Math.floor(Math.random() * 10000),
      commentCount: Math.floor(Math.random() * 1000),
      tags: [getRandomTag(), getRandomTag()],
    });
  }

  return posts;
}

function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    kuaishou: '快手',
    bilibili: 'B站',
    weibo: '微博',
    tieba: '贴吧',
    zhihu: '知乎',
  };
  return names[platform] || platform;
}

function getRandomAuthorName(): string {
  const names = ['小明同学', '科技观察者', '生活美学家', '数码达人', '美食探店', '旅行日记', '读书笔记', '健身打卡', '穿搭分享', '职场干货'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomTag(): string {
  const tags = ['生活', '科技', '美食', '旅行', '穿搭', '职场', '学习', '健身', '娱乐', '数码', '美妆', '家居', '育儿', '宠物', '汽车'];
  return tags[Math.floor(Math.random() * tags.length)];
}

function getRandomCategory(): string {
  const categories = ['生活分享', '知识科普', '产品评测', '经验总结', '观点评论', '教程指南'];
  return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomTopic(): string {
  const topics = ['如何提升工作效率', '2024年必买好物推荐', '我的读书心得', '健身三个月的变化', '职场新人必看', '旅行中的那些事', '美食探店记录', '数码产品测评'];
  return topics[Math.floor(Math.random() * topics.length)];
}

function getRandomComment(sentiment: string): string {
  const positive = ['太棒了！学到了很多', '感谢分享，很有帮助', '写得真好，期待更多', '收藏了，以后用得上', '终于找到靠谱的教程了', '博主太用心了'];
  const negative = ['感觉不太对', '这个观点我不认同', '有点失望', '希望能改进', '不太实用'];
  const neutral = ['学习了', '已收藏', 'mark一下', '路过看看', '了解一下', '感谢分享'];
  
  if (sentiment === 'positive') return positive[Math.floor(Math.random() * positive.length)];
  if (sentiment === 'negative') return negative[Math.floor(Math.random() * negative.length)];
  return neutral[Math.floor(Math.random() * neutral.length)];
}

function getRandomReply(): string {
  const replies = ['同意楼上', '我也这么觉得', '学习了', '有道理', '确实是这样', '感谢补充', '原来如此', '涨知识了'];
  return replies[Math.floor(Math.random() * replies.length)];
}
