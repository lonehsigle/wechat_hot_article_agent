import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const monitorCategories = sqliteTable('monitor_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  platforms: text('platforms', { mode: 'json' }).$type<string[]>(),
  keywords: text('keywords', { mode: 'json' }).$type<string[]>(),
  creators: text('creators', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const contents = sqliteTable('contents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => monitorCategories.id),
  platform: text('platform').notNull(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  date: text('date').notNull(),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  readCount: integer('read_count').default(0),
  lookCount: integer('look_count').default(0),
  digest: text('digest'),
  content: text('content'),
  url: text('url').notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const reports = sqliteTable('reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => monitorCategories.id),
  date: text('date').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const insights = sqliteTable('insights', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportId: integer('report_id').references(() => reports.id),
  type: text('type').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const topics = sqliteTable('topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportId: integer('report_id').references(() => reports.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  reason: text('reason').notNull(),
  potential: text('potential').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const wechatAccounts = sqliteTable('wechat_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  appId: text('app_id').default(''),
  appSecret: text('app_secret').default(''),
  authorName: text('author_name').default(''),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const llmConfigs = sqliteTable('llm_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider').notNull(),
  apiKey: text('api_key').notNull(),
  model: text('model').notNull(),
  baseUrl: text('base_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const cacheRecords = sqliteTable('cache_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cacheKey: text('cache_key').notNull().unique(),
  cacheData: text('cache_data', { mode: 'json' }).notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const publishedArticles = sqliteTable('published_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').default(''),
  coverImage: text('cover_image').default(''),
  images: text('images', { mode: 'json' }).$type<string[]>(),
  wechatAccountId: integer('wechat_account_id').references(() => wechatAccounts.id),
  topicId: integer('topic_id'),
  publishStatus: text('publish_status').default('draft'),
  publishTime: integer('publish_time', { mode: 'timestamp' }),
  wechatMediaId: text('wechat_media_id'),
  wechatArticleUrl: text('wechat_article_url'),
  sourceContentId: integer('source_content_id'),
  sourceTitle: text('source_title'),
  sourceReadCount: integer('source_read_count').default(0),
  sourceLikeCount: integer('source_like_count').default(0),
  sourceDigest: text('source_digest'),
  articleUrl: text('article_url'),
  readCount: integer('read_count').default(0),
  likeCount: integer('like_count').default(0),
  lookCount: integer('look_count').default(0),
  shareCount: integer('share_count').default(0),
  commentCount: integer('comment_count').default(0),
  analysisStatus: text('analysis_status').default('pending'),
  analysisResult: text('analysis_result'),
  analyzedAt: integer('analyzed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const articleStats = sqliteTable('article_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  articleId: integer('article_id').references(() => publishedArticles.id),
  recordTime: integer('record_time', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  readCount: integer('read_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  collectCount: integer('collect_count').default(0),
  readGrowth: integer('read_growth').default(0),
  likeGrowth: integer('like_growth').default(0),
  commentGrowth: integer('comment_growth').default(0),
  shareGrowth: integer('share_growth').default(0),
});

export const articleStatsDaily = sqliteTable('article_stats_daily', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  articleId: integer('article_id').references(() => publishedArticles.id),
  date: text('date').notNull(),
  totalRead: integer('total_read').default(0),
  totalLike: integer('total_like').default(0),
  totalComment: integer('total_comment').default(0),
  totalShare: integer('total_share').default(0),
  totalCollect: integer('total_collect').default(0),
  dailyReadGrowth: integer('daily_read_growth').default(0),
  dailyLikeGrowth: integer('daily_like_growth').default(0),
  dailyCommentGrowth: integer('daily_comment_growth').default(0),
  dailyShareGrowth: integer('daily_share_growth').default(0),
});

export const writingTechniques = sqliteTable('writing_techniques', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(),
  stage: text('stage').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  examples: text('examples'),
  formulas: text('formulas'),
  checklists: text('checklists', { mode: 'json' }).$type<string[]>(),
  priority: integer('priority').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const techniqueCategories = sqliteTable('technique_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const benchmarkAccounts = sqliteTable('benchmark_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  avatar: text('avatar'),
  description: text('description'),
  followerCount: integer('follower_count').default(0),
  note: text('note'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  isLowFollowerViral: integer('is_low_follower_viral', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const viralTitles = sqliteTable('viral_titles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  benchmarkAccountId: integer('benchmark_account_id').references(() => benchmarkAccounts.id),
  title: text('title').notNull(),
  articleUrl: text('article_url'),
  publishDate: text('publish_date'),
  readCount: integer('read_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  titleModel: text('title_model'),
  painPointLevel: text('pain_point_level'),
  keywords: text('keywords', { mode: 'json' }).$type<string[]>(),
  analysis: text('analysis'),
  isCollected: integer('is_collected', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const materialLibrary = sqliteTable('material_library', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  source: text('source').notNull(),
  sourceUrl: text('source_url'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  keyPoints: text('key_points', { mode: 'json' }).$type<string[]>(),
  quotes: text('quotes', { mode: 'json' }).$type<string[]>(),
  dataPoints: text('data_points', { mode: 'json' }).$type<string[]>(),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  topicId: integer('topic_id'),
  isUsed: integer('is_used', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const writingStyles = sqliteTable('writing_styles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  titleStrategy: text('title_strategy'),
  openingStyle: text('opening_style'),
  articleFramework: text('article_framework'),
  contentProgression: text('content_progression'),
  endingDesign: text('ending_design'),
  languageStyle: text('language_style'),
  emotionalHooks: text('emotional_hooks', { mode: 'json' }).$type<string[]>(),
  articleType: text('article_type'),
  template: text('template'),
  exampleTitles: text('example_titles', { mode: 'json' }).$type<string[]>(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const analysisTasks = sqliteTable('analysis_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  keyword: text('keyword').notNull(),
  status: text('status').default('pending'),
  totalArticles: integer('total_articles').default(0),
  analyzedArticles: integer('analyzed_articles').default(0),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const monitorLogs = sqliteTable('monitor_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  message: text('message'),
  data: text('data', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const hotTopics = sqliteTable('hot_topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  hotValue: integer('hot_value').default(0),
  rank: integer('rank').default(0),
  category: text('category'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  trendDirection: text('trend_direction').default('stable'),
  predictedGrowth: real('predicted_growth').default(0),
  isBlackHorse: integer('is_black_horse', { mode: 'boolean' }).default(false),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const hotTopicHistory = sqliteTable('hot_topic_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id').references(() => hotTopics.id),
  hotValue: integer('hot_value').default(0),
  rank: integer('rank').default(0),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const articleRewrites = sqliteTable('article_rewrites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceArticleIds: text('source_article_ids', { mode: 'json' }).$type<number[]>(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  style: text('style'),
  wordCount: integer('word_count').default(0),
  aiScore: real('ai_score'),
  humanScore: real('human_score'),
  status: text('status').default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const analysisArticles = sqliteTable('analysis_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').references(() => analysisTasks.id),
  title: text('title').notNull(),
  author: text('author'),
  url: text('url'),
  summary: text('summary'),
  readCount: integer('read_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  engagementRate: real('engagement_rate').default(0),
  publishDate: text('publish_date'),
  content: text('content'),
  keywords: text('keywords', { mode: 'json' }).$type<string[]>(),
  analyzedAt: integer('analyzed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const insightReports = sqliteTable('insight_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').references(() => analysisTasks.id),
  topLikesArticles: text('top_likes_articles', { mode: 'json' }).$type<Array<{title: string; author: string; likes: number; url: string}>>(),
  topEngagementArticles: text('top_engagement_articles', { mode: 'json' }).$type<Array<{title: string; author: string; rate: number; url: string}>>(),
  wordCloud: text('word_cloud', { mode: 'json' }).$type<Array<{word: string; count: number}>>(),
  insights: text('insights', { mode: 'json' }).$type<string[]>(),
  topicSuggestions: text('topic_suggestions', { mode: 'json' }).$type<Array<{title: string; reason: string; potential: string}>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const generatedArticles = sqliteTable('generated_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').references(() => analysisTasks.id),
  reportId: integer('report_id').references(() => insightReports.id),
  topicId: integer('topic_id'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  images: text('images', { mode: 'json' }).$type<string[]>(),
  style: text('style'),
  wordCount: integer('word_count').default(0),
  status: text('status').default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const wechatAuth = sqliteTable('wechat_auth', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull(),
  cookie: text('cookie'),
  nickname: text('nickname'),
  avatar: text('avatar'),
  status: text('status').default('pending'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const wechatSubscriptions = sqliteTable('wechat_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  biz: text('biz').notNull().unique(),
  name: text('name').notNull(),
  alias: text('alias'),
  avatar: text('avatar'),
  description: text('description'),
  lastArticleTime: integer('last_article_time', { mode: 'timestamp' }),
  totalArticles: integer('total_articles').default(0),
  monitorEnabled: integer('monitor_enabled', { mode: 'boolean' }).default(true),
  monitorInterval: integer('monitor_interval').default(300),
  lastMonitorAt: integer('last_monitor_at', { mode: 'timestamp' }),
  status: text('status').default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const collectedArticles = sqliteTable('collected_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subscriptionId: integer('subscription_id').references(() => wechatSubscriptions.id),
  msgId: text('msg_id').notNull().unique(),
  title: text('title').notNull(),
  author: text('author'),
  digest: text('digest'),
  content: text('content'),
  contentHtml: text('content_html'),
  coverImage: text('cover_image'),
  localImages: text('local_images', { mode: 'json' }).$type<string[]>(),
  sourceUrl: text('source_url').notNull(),
  publishTime: integer('publish_time', { mode: 'timestamp' }),
  readCount: integer('read_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  recommendCount: integer('recommend_count').default(0),
  shareCount: integer('share_count').default(0),
  engagementRate: real('engagement_rate').default(0),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  snapshotPath: text('snapshot_path'),
  markdownPath: text('markdown_path'),
  pdfPath: text('pdf_path'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  note: text('note'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const collectTasks = sqliteTable('collect_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subscriptionId: integer('subscription_id').references(() => wechatSubscriptions.id),
  type: text('type').notNull(),
  status: text('status').default('pending'),
  totalArticles: integer('total_articles').default(0),
  collectedArticles: integer('collected_articles').default(0),
  failedArticles: integer('failed_articles').default(0),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const wechatDrafts = sqliteTable('wechat_drafts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mediaId: text('media_id').unique(),
  title: text('title').notNull(),
  author: text('author'),
  digest: text('digest'),
  content: text('content'),
  contentHtml: text('content_html'),
  coverImage: text('cover_image'),
  sourceUrl: text('source_url'),
  needOpenComment: integer('need_open_comment', { mode: 'boolean' }).default(false),
  onlyFansCanComment: integer('only_fans_can_comment', { mode: 'boolean' }).default(false),
  articleId: text('article_id'),
  status: text('status').default('draft'),
  createTime: integer('create_time', { mode: 'timestamp' }),
  updateTime: integer('update_time', { mode: 'timestamp' }),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const platformPosts = sqliteTable('platform_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  postId: text('post_id').notNull(),
  title: text('title'),
  content: text('content'),
  authorId: text('author_id'),
  authorName: text('author_name'),
  authorAvatar: text('author_avatar'),
  coverImage: text('cover_image'),
  images: text('images', { mode: 'json' }).$type<string[]>(),
  videoUrl: text('video_url'),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  collectCount: integer('collect_count').default(0),
  viewCount: integer('view_count').default(0),
  publishTime: integer('publish_time', { mode: 'timestamp' }),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  category: text('category'),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const postComments = sqliteTable('post_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').references(() => platformPosts.id),
  platform: text('platform').notNull(),
  commentId: text('comment_id').notNull(),
  parentId: text('parent_id'),
  rootId: text('root_id'),
  userId: text('user_id'),
  userName: text('user_name'),
  userAvatar: text('user_avatar'),
  content: text('content').notNull(),
  likeCount: integer('like_count').default(0),
  replyCount: integer('reply_count').default(0),
  isAuthor: integer('is_author', { mode: 'boolean' }).default(false),
  publishTime: integer('publish_time', { mode: 'timestamp' }),
  sentiment: text('sentiment'),
  keywords: text('keywords', { mode: 'json' }).$type<string[]>(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const creators = sqliteTable('creators', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  creatorId: text('creator_id').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  description: text('description'),
  followerCount: integer('follower_count').default(0),
  followingCount: integer('following_count').default(0),
  postCount: integer('post_count').default(0),
  likeCount: integer('like_count').default(0),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  verifyType: text('verify_type'),
  monitorEnabled: integer('monitor_enabled', { mode: 'boolean' }).default(false),
  lastFetchAt: integer('last_fetch_at', { mode: 'timestamp' }),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const commentWordCloud = sqliteTable('comment_word_cloud', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').references(() => platformPosts.id),
  platform: text('platform').notNull(),
  totalComments: integer('total_comments').default(0),
  positiveCount: integer('positive_count').default(0),
  negativeCount: integer('negative_count').default(0),
  neutralCount: integer('neutral_count').default(0),
  topKeywords: text('top_keywords', { mode: 'json' }).$type<Array<{ word: string; count: number }>>(),
  topEmojis: text('top_emojis', { mode: 'json' }).$type<Array<{ emoji: string; count: number }>>(),
  sentimentScore: real('sentiment_score').default(0),
  generatedAt: integer('generated_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const crawlTasks = sqliteTable('crawl_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  type: text('type').notNull(),
  keyword: text('keyword'),
  postId: text('post_id'),
  creatorId: text('creator_id'),
  status: text('status').default('pending'),
  totalItems: integer('total_items').default(0),
  crawledItems: integer('crawled_items').default(0),
  failedItems: integer('failed_items').default(0),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const wordCloudCache = sqliteTable('word_cloud_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cacheKey: text('cache_key').notNull().unique(),
  basicWordCloud: text('basic_word_cloud', { mode: 'json' }).$type<Array<{ word: string; count: number }>>(),
  aiWordCloud: text('ai_word_cloud', { mode: 'json' }).$type<Array<{ word: string; count: number; category: string; sentiment: string }>>(),
  articleCount: integer('article_count').default(0),
  articleHash: text('article_hash'),
  aiProcessedAt: integer('ai_processed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const promptConfigs = sqliteTable('prompt_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  template: text('template').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const wechatSessions = sqliteTable('wechat_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authKey: text('auth_key').notNull().unique(),
  token: text('token').notNull(),
  cookies: text('cookies').notNull(),
  nickname: text('nickname'),
  avatar: text('avatar'),
  status: text('status').default('active'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const layoutStyles = sqliteTable('layout_styles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  headerStyle: text('header_style').default('bold'),
  paragraphSpacing: text('paragraph_spacing').default('medium'),
  listStyle: text('list_style').default('number'),
  highlightStyle: text('highlight_style').default('emoji'),
  emojiUsage: text('emoji_usage').default('moderate'),
  quoteStyle: text('quote_style').default('block'),
  imagePosition: text('image_position').default('center'),
  calloutStyle: text('callout_style').default('box'),
  colorScheme: text('color_scheme').default('default'),
  fontStyle: text('font_style').default('sans-serif'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const optimizationSuggestions = sqliteTable('optimization_suggestions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  articleId: integer('article_id').references(() => publishedArticles.id),
  gapType: text('gap_type').notNull(),
  gapDescription: text('gap_description'),
  sourceStrength: text('source_strength'),
  rewriteWeakness: text('rewrite_weakness'),
  suggestion: text('suggestion').notNull(),
  priority: text('priority').default('medium'),
  performanceRatio: real('performance_ratio').default(0),
  status: text('status').default('pending'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewerNote: text('reviewer_note'),
  appliedToPrompt: integer('applied_to_prompt', { mode: 'boolean' }).default(false),
  appliedAt: integer('applied_at', { mode: 'timestamp' }),
  effectivenessScore: real('effectiveness_score'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
