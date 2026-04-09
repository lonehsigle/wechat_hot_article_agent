import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const dbPath = join(process.cwd(), 'data', 'content-monitor.db');
const dbDir = join(process.cwd(), 'data');

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let initialized = false;

function getDb(): ReturnType<typeof drizzle> {
  if (!sqlite) {
    sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    db = drizzle(sqlite, { schema });
  }
  return db!;
}

export { getDb as db };

export function initDatabase() {
  if (initialized) return;
  initialized = true;
  
  const database = getDb();
  if (!sqlite) return;
  
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS monitor_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      platforms TEXT,
      keywords TEXT,
      creators TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES monitor_categories(id),
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      date TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      url TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES monitor_categories(id),
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER REFERENCES reports(id),
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER REFERENCES reports(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      reason TEXT NOT NULL,
      potential TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wechat_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      app_id TEXT DEFAULT '',
      app_secret TEXT DEFAULT '',
      author_name TEXT DEFAULT '',
      is_default INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS llm_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      model TEXT NOT NULL,
      base_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cache_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT NOT NULL UNIQUE,
      cache_data TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS published_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      images TEXT,
      wechat_account_id INTEGER REFERENCES wechat_accounts(id),
      topic_id INTEGER,
      publish_status TEXT DEFAULT 'draft',
      publish_time INTEGER,
      wechat_media_id TEXT,
      wechat_article_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER REFERENCES published_articles(id),
      record_time INTEGER NOT NULL,
      read_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      read_growth INTEGER DEFAULT 0,
      like_growth INTEGER DEFAULT 0,
      comment_growth INTEGER DEFAULT 0,
      share_growth INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS article_stats_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER REFERENCES published_articles(id),
      date TEXT NOT NULL,
      total_read INTEGER DEFAULT 0,
      total_like INTEGER DEFAULT 0,
      total_comment INTEGER DEFAULT 0,
      total_share INTEGER DEFAULT 0,
      total_collect INTEGER DEFAULT 0,
      daily_read_growth INTEGER DEFAULT 0,
      daily_like_growth INTEGER DEFAULT 0,
      daily_comment_growth INTEGER DEFAULT 0,
      daily_share_growth INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS writing_techniques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      stage TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      examples TEXT,
      formulas TEXT,
      checklists TEXT,
      priority INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS technique_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS benchmark_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      account_id TEXT NOT NULL,
      account_name TEXT NOT NULL,
      avatar TEXT,
      description TEXT,
      follower_count INTEGER DEFAULT 0,
      note TEXT,
      tags TEXT,
      is_low_follower_viral INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS viral_titles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      benchmark_account_id INTEGER REFERENCES benchmark_accounts(id),
      title TEXT NOT NULL,
      article_url TEXT,
      publish_date TEXT,
      read_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      title_model TEXT,
      pain_point_level TEXT,
      keywords TEXT,
      analysis TEXT,
      is_collected INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS material_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      key_points TEXT,
      quotes TEXT,
      data_points TEXT,
      tags TEXT,
      topic_id INTEGER,
      is_used INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS writing_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title_strategy TEXT,
      opening_style TEXT,
      article_framework TEXT,
      content_progression TEXT,
      ending_design TEXT,
      language_style TEXT,
      emotional_hooks TEXT,
      article_type TEXT,
      template TEXT,
      example_titles TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS layout_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      header_style TEXT DEFAULT 'bold',
      paragraph_spacing TEXT DEFAULT 'medium',
      list_style TEXT DEFAULT 'number',
      highlight_style TEXT DEFAULT 'emoji',
      emoji_usage TEXT DEFAULT 'moderate',
      quote_style TEXT DEFAULT 'block',
      image_position TEXT DEFAULT 'center',
      callout_style TEXT DEFAULT 'box',
      color_scheme TEXT DEFAULT 'default',
      font_style TEXT DEFAULT 'sans-serif',
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analysis_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      total_articles INTEGER DEFAULT 0,
      analyzed_articles INTEGER DEFAULT 0,
      error_message TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analysis_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES analysis_tasks(id),
      title TEXT NOT NULL,
      author TEXT,
      url TEXT,
      summary TEXT,
      read_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      publish_date TEXT,
      content TEXT,
      keywords TEXT,
      analyzed_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insight_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES analysis_tasks(id),
      top_likes_articles TEXT,
      top_engagement_articles TEXT,
      word_cloud TEXT,
      insights TEXT,
      topic_suggestions TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generated_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES analysis_tasks(id),
      report_id INTEGER REFERENCES insight_reports(id),
      topic_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      images TEXT,
      style TEXT,
      word_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wechat_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      cookie TEXT,
      nickname TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'pending',
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wechat_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      biz TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      alias TEXT,
      avatar TEXT,
      description TEXT,
      last_article_time INTEGER,
      total_articles INTEGER DEFAULT 0,
      monitor_enabled INTEGER DEFAULT 1,
      monitor_interval INTEGER DEFAULT 300,
      last_monitor_at INTEGER,
      status TEXT DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collected_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER REFERENCES wechat_subscriptions(id),
      msg_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      author TEXT,
      digest TEXT,
      content TEXT,
      content_html TEXT,
      cover_image TEXT,
      local_images TEXT,
      source_url TEXT NOT NULL,
      publish_time INTEGER,
      read_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      recommend_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      deleted_at INTEGER,
      snapshot_path TEXT,
      markdown_path TEXT,
      pdf_path TEXT,
      tags TEXT,
      note TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collect_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER REFERENCES wechat_subscriptions(id),
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      total_articles INTEGER DEFAULT 0,
      collected_articles INTEGER DEFAULT 0,
      failed_articles INTEGER DEFAULT 0,
      error_message TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monitor_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT,
      data TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hot_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT,
      hot_value INTEGER DEFAULT 0,
      rank INTEGER DEFAULT 0,
      category TEXT,
      tags TEXT,
      trend_direction TEXT DEFAULT 'stable',
      predicted_growth REAL DEFAULT 0,
      is_black_horse INTEGER DEFAULT 0,
      fetched_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hot_topic_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER REFERENCES hot_topics(id),
      hot_value INTEGER DEFAULT 0,
      rank INTEGER DEFAULT 0,
      recorded_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_rewrites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_article_ids TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      style TEXT,
      word_count INTEGER DEFAULT 0,
      ai_score REAL,
      human_score REAL,
      status TEXT DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS optimization_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER REFERENCES published_articles(id),
      gap_type TEXT NOT NULL,
      gap_description TEXT,
      source_strength TEXT,
      rewrite_weakness TEXT,
      suggestion TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      performance_ratio REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      reviewed_at INTEGER,
      reviewer_note TEXT,
      applied_to_prompt INTEGER DEFAULT 0,
      applied_at INTEGER,
      effectiveness_score REAL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category_id);
    CREATE INDEX IF NOT EXISTS idx_contents_fetched ON contents(fetched_at);
    CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category_id);
    CREATE INDEX IF NOT EXISTS idx_insights_report ON insights(report_id);
    CREATE INDEX IF NOT EXISTS idx_topics_report ON topics(report_id);
    CREATE INDEX IF NOT EXISTS idx_cache_key ON cache_records(cache_key);
    CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_records(expires_at);
    CREATE INDEX IF NOT EXISTS idx_articles_account ON published_articles(wechat_account_id);
    CREATE INDEX IF NOT EXISTS idx_stats_article ON article_stats(article_id);
    CREATE INDEX IF NOT EXISTS idx_stats_daily_article ON article_stats_daily(article_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_tasks_status ON analysis_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_analysis_articles_task ON analysis_articles(task_id);
    CREATE INDEX IF NOT EXISTS idx_insight_reports_task ON insight_reports(task_id);
    CREATE INDEX IF NOT EXISTS idx_generated_articles_task ON generated_articles(task_id);
    CREATE INDEX IF NOT EXISTS idx_wechat_auth_token ON wechat_auth(token);
    CREATE INDEX IF NOT EXISTS idx_wechat_subscriptions_biz ON wechat_subscriptions(biz);
    CREATE INDEX IF NOT EXISTS idx_collected_articles_subscription ON collected_articles(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_collected_articles_msgid ON collected_articles(msg_id);
    CREATE INDEX IF NOT EXISTS idx_collected_articles_publish ON collected_articles(publish_time);
    CREATE INDEX IF NOT EXISTS idx_collect_tasks_subscription ON collect_tasks(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_collect_tasks_status ON collect_tasks(status);

    CREATE TABLE IF NOT EXISTS wechat_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id TEXT UNIQUE,
      title TEXT NOT NULL,
      author TEXT,
      digest TEXT,
      content TEXT,
      content_html TEXT,
      cover_image TEXT,
      source_url TEXT,
      need_open_comment INTEGER DEFAULT 0,
      only_fans_can_comment INTEGER DEFAULT 0,
      article_id TEXT,
      status TEXT DEFAULT 'draft',
      create_time INTEGER,
      update_time INTEGER,
      fetched_at INTEGER,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      post_id TEXT NOT NULL,
      title TEXT,
      content TEXT,
      author_id TEXT,
      author_name TEXT,
      author_avatar TEXT,
      cover_image TEXT,
      images TEXT,
      video_url TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      publish_time INTEGER,
      fetched_at INTEGER,
      tags TEXT,
      category TEXT,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES platform_posts(id),
      platform TEXT NOT NULL,
      comment_id TEXT NOT NULL,
      parent_id TEXT,
      root_id TEXT,
      user_id TEXT,
      user_name TEXT,
      user_avatar TEXT,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      is_author INTEGER DEFAULT 0,
      publish_time INTEGER,
      sentiment TEXT,
      keywords TEXT,
      fetched_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      description TEXT,
      follower_count INTEGER DEFAULT 0,
      following_count INTEGER DEFAULT 0,
      post_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      verify_type TEXT,
      monitor_enabled INTEGER DEFAULT 0,
      last_fetch_at INTEGER,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comment_word_cloud (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES platform_posts(id),
      platform TEXT NOT NULL,
      total_comments INTEGER DEFAULT 0,
      positive_count INTEGER DEFAULT 0,
      negative_count INTEGER DEFAULT 0,
      neutral_count INTEGER DEFAULT 0,
      top_keywords TEXT,
      top_emojis TEXT,
      sentiment_score REAL DEFAULT 0,
      generated_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crawl_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      type TEXT NOT NULL,
      keyword TEXT,
      post_id TEXT,
      creator_id TEXT,
      status TEXT DEFAULT 'pending',
      total_items INTEGER DEFAULT 0,
      crawled_items INTEGER DEFAULT 0,
      failed_items INTEGER DEFAULT 0,
      error_message TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_platform_posts_platform ON platform_posts(platform);
    CREATE INDEX IF NOT EXISTS idx_platform_posts_postid ON platform_posts(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_platform ON post_comments(platform);
    CREATE INDEX IF NOT EXISTS idx_creators_platform ON creators(platform);
    CREATE INDEX IF NOT EXISTS idx_creators_creatorid ON creators(creator_id);
    CREATE INDEX IF NOT EXISTS idx_comment_word_cloud_post ON comment_word_cloud(post_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_tasks_status ON crawl_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_crawl_tasks_platform ON crawl_tasks(platform);
    CREATE INDEX IF NOT EXISTS idx_wechat_drafts_mediaid ON wechat_drafts(media_id);
    CREATE INDEX IF NOT EXISTS idx_wechat_drafts_status ON wechat_drafts(status);
    CREATE INDEX IF NOT EXISTS idx_hot_topics_platform ON hot_topics(platform);
    CREATE INDEX IF NOT EXISTS idx_hot_topics_fetched ON hot_topics(fetched_at);
    CREATE INDEX IF NOT EXISTS idx_hot_topics_blackhorse ON hot_topics(is_black_horse);
    CREATE INDEX IF NOT EXISTS idx_hot_topic_history_topic ON hot_topic_history(topic_id);
    CREATE INDEX IF NOT EXISTS idx_article_rewrites_status ON article_rewrites(status);
    CREATE INDEX IF NOT EXISTS idx_monitor_logs_type ON monitor_logs(type);
    CREATE INDEX IF NOT EXISTS idx_monitor_logs_created ON monitor_logs(created_at);
  `);

  console.log('Database initialized successfully');
  
  migrateDatabase();
}

function migrateDatabase() {
  if (!sqlite) return;
  
  try {
    const layoutStylesTableInfo = sqlite.prepare('PRAGMA table_info(layout_styles)').all() as Array<{ name: string }>;
    if (layoutStylesTableInfo.length === 0) {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS layout_styles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          header_style TEXT DEFAULT 'bold',
          paragraph_spacing TEXT DEFAULT 'medium',
          list_style TEXT DEFAULT 'number',
          highlight_style TEXT DEFAULT 'emoji',
          emoji_usage TEXT DEFAULT 'moderate',
          quote_style TEXT DEFAULT 'block',
          image_position TEXT DEFAULT 'center',
          callout_style TEXT DEFAULT 'box',
          color_scheme TEXT DEFAULT 'default',
          font_style TEXT DEFAULT 'sans-serif',
          is_active INTEGER DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      console.log('Created layout_styles table');
    }
    
    const tableInfo = sqlite.prepare('PRAGMA table_info(collected_articles)').all() as Array<{ name: string }>;
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('recommend_count')) {
      sqlite.exec('ALTER TABLE collected_articles ADD COLUMN recommend_count INTEGER DEFAULT 0');
      console.log('Added recommend_count column');
    }
    
    if (!columns.includes('share_count')) {
      sqlite.exec('ALTER TABLE collected_articles ADD COLUMN share_count INTEGER DEFAULT 0');
      console.log('Added share_count column');
    }
    
    if (!columns.includes('engagement_rate')) {
      sqlite.exec('ALTER TABLE collected_articles ADD COLUMN engagement_rate REAL DEFAULT 0');
      console.log('Added engagement_rate column');
    }
    
    if (columns.includes('look_count')) {
      sqlite.exec(`
        UPDATE collected_articles 
        SET engagement_rate = ROUND((like_count + comment_count + look_count) * 100.0 / NULLIF(read_count, 0), 2)
        WHERE read_count > 0
      `);
      console.log('Migrated engagement_rate from look_count formula');
    }
    
    const wordCloudTableInfo = sqlite.prepare('PRAGMA table_info(word_cloud_cache)').all() as Array<{ name: string }>;
    if (wordCloudTableInfo.length === 0) {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS word_cloud_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_key TEXT NOT NULL UNIQUE,
          basic_word_cloud TEXT,
          ai_word_cloud TEXT,
          article_count INTEGER DEFAULT 0,
          article_hash TEXT,
          ai_processed_at INTEGER,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      console.log('Created word_cloud_cache table');
    }
    
    const contentsTableInfo = sqlite.prepare('PRAGMA table_info(contents)').all() as Array<{ name: string }>;
    const contentsColumns = contentsTableInfo.map(col => col.name);
    
    if (!contentsColumns.includes('read_count')) {
      sqlite.exec('ALTER TABLE contents ADD COLUMN read_count INTEGER DEFAULT 0');
      console.log('Added read_count column to contents');
    }
    
    if (!contentsColumns.includes('look_count')) {
      sqlite.exec('ALTER TABLE contents ADD COLUMN look_count INTEGER DEFAULT 0');
      console.log('Added look_count column to contents');
    }
    
    if (!contentsColumns.includes('digest')) {
      sqlite.exec('ALTER TABLE contents ADD COLUMN digest TEXT');
      console.log('Added digest column to contents');
    }
    
    if (!contentsColumns.includes('content')) {
      sqlite.exec('ALTER TABLE contents ADD COLUMN content TEXT');
      console.log('Added content column to contents');
    }
    
    const publishedArticlesTableInfo = sqlite.prepare('PRAGMA table_info(published_articles)').all() as Array<{ name: string }>;
    const publishedArticlesColumns = publishedArticlesTableInfo.map(col => col.name);
    
    if (!publishedArticlesColumns.includes('source_content_id')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN source_content_id INTEGER');
      console.log('Added source_content_id column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('source_title')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN source_title TEXT');
      console.log('Added source_title column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('source_read_count')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN source_read_count INTEGER DEFAULT 0');
      console.log('Added source_read_count column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('source_like_count')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN source_like_count INTEGER DEFAULT 0');
      console.log('Added source_like_count column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('source_digest')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN source_digest TEXT');
      console.log('Added source_digest column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('article_url')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN article_url TEXT');
      console.log('Added article_url column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('read_count')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN read_count INTEGER DEFAULT 0');
      console.log('Added read_count column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('like_count')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN like_count INTEGER DEFAULT 0');
      console.log('Added like_count column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('look_count')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN look_count INTEGER DEFAULT 0');
      console.log('Added look_count column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('share_count')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN share_count INTEGER DEFAULT 0');
      console.log('Added share_count column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('comment_count')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN comment_count INTEGER DEFAULT 0');
      console.log('Added comment_count column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('analysis_status')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN analysis_status TEXT DEFAULT "pending"');
      console.log('Added analysis_status column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('analysis_result')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN analysis_result TEXT');
      console.log('Added analysis_result column to published_articles');
    }
    
    if (!publishedArticlesColumns.includes('analyzed_at')) {
      sqlite.exec('ALTER TABLE published_articles ADD COLUMN analyzed_at INTEGER');
      console.log('Added analyzed_at column to published_articles');
    }
    
    const optimizationSuggestionsTableInfo = sqlite.prepare('PRAGMA table_info(optimization_suggestions)').all() as Array<{ name: string }>;
    if (optimizationSuggestionsTableInfo.length === 0) {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS optimization_suggestions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          article_id INTEGER REFERENCES published_articles(id),
          gap_type TEXT NOT NULL,
          gap_description TEXT,
          source_strength TEXT,
          rewrite_weakness TEXT,
          suggestion TEXT NOT NULL,
          priority TEXT DEFAULT 'medium',
          performance_ratio REAL DEFAULT 0,
          status TEXT DEFAULT 'pending',
          reviewed_at INTEGER,
          reviewer_note TEXT,
          applied_to_prompt INTEGER DEFAULT 0,
          applied_at INTEGER,
          effectiveness_score REAL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      console.log('Created optimization_suggestions table');
    }
    
    const wechatAccountsTableInfo = sqlite.prepare('PRAGMA table_info(wechat_accounts)').all() as Array<{ name: string }>;
    const wechatAccountsColumns = wechatAccountsTableInfo.map(col => col.name);
    
    if (!wechatAccountsColumns.includes('target_audience')) {
      sqlite.exec('ALTER TABLE wechat_accounts ADD COLUMN target_audience TEXT');
      console.log('Added target_audience column to wechat_accounts');
    }
    
    if (!wechatAccountsColumns.includes('reader_persona')) {
      sqlite.exec('ALTER TABLE wechat_accounts ADD COLUMN reader_persona TEXT');
      console.log('Added reader_persona column to wechat_accounts');
    }
    
    if (!wechatAccountsColumns.includes('content_style')) {
      sqlite.exec('ALTER TABLE wechat_accounts ADD COLUMN content_style TEXT');
      console.log('Added content_style column to wechat_accounts');
    }
    
    if (!wechatAccountsColumns.includes('main_topics')) {
      sqlite.exec('ALTER TABLE wechat_accounts ADD COLUMN main_topics TEXT');
      console.log('Added main_topics column to wechat_accounts');
    }
    
    if (!wechatAccountsColumns.includes('tone_preference')) {
      sqlite.exec('ALTER TABLE wechat_accounts ADD COLUMN tone_preference TEXT');
      console.log('Added tone_preference column to wechat_accounts');
    }
    
    insertDefaultStyles();
    
    console.log('Database migration completed');
  } catch (error) {
    console.log('Migration check completed (some migrations may have already been applied)');
  }
}

function insertDefaultStyles() {
  if (!sqlite) return;
  
  try {
    const writingStylesCount = sqlite.prepare('SELECT COUNT(*) as count FROM writing_styles').get() as { count: number };
  if (writingStylesCount.count === 0) {
    const now = Date.now();
    const defaultWritingStyles = [
      {
        name: '情感心理',
        title_strategy: '以情绪共鸣为核心，使用"你"字开头，直击内心痛点',
        opening_style: '场景引入+情绪共鸣，用具体场景唤起读者情感记忆',
        article_framework: '场景引入→情绪共鸣→深度分析→实用建议→温暖结尾',
        content_progression: '层层递进，从表象到本质，从问题到解决方案',
        ending_design: '温暖治愈，给予希望和行动指引',
        language_style: '温柔细腻，富有同理心，多用第二人称',
        emotional_hooks: ['孤独感', '焦虑', '自我怀疑', '人际关系', '成长困惑'],
        article_type: 'opinion',
        example_titles: '["你不必总是那么坚强", "那些说不出口的情绪，身体都记得", "为什么越努力越焦虑？"]'
      },
      {
        name: '美食旅行',
        title_strategy: '感官体验+地域特色，突出"寻味""探索"等动词',
        opening_style: '感官描写开场，用味觉/嗅觉/视觉细节吸引读者',
        article_framework: '感官开场→文化背景→深度体验→实用攻略→情感升华',
        content_progression: '从表象到文化，从体验到感悟，层层深入',
        ending_design: '味蕾记忆，将美食与情感、记忆连接',
        language_style: '生动形象，富有画面感，多用感官词汇',
        emotional_hooks: ['怀旧', '探索欲', '生活品质', '文化认同'],
        article_type: 'story',
        example_titles: '["寻味之旅：探索城市里的美食秘境", "一碗面里的乡愁", "舌尖上的城市记忆"]'
      },
      {
        name: '职场发展',
        title_strategy: '痛点+解决方案，使用数字和具体场景增强可信度',
        opening_style: '职场场景切入，引发共鸣，提出核心问题',
        article_framework: '场景问题→原因分析→方法论→案例佐证→行动建议',
        content_progression: '问题导向，逻辑清晰，从认知到行动',
        ending_design: '行动号召，给出清晰的下一步指引',
        language_style: '专业理性，逻辑清晰，适当使用专业术语',
        emotional_hooks: ['职业焦虑', '成长渴望', '价值认同', '能力提升'],
        article_type: 'tutorial',
        example_titles: '["职场进阶：从执行者到管理者的5个关键转变", "如何优雅地拒绝不合理的工作要求？", "35岁危机，其实是机会"]'
      },
      {
        name: '科技数码',
        title_strategy: '新技术+应用场景，突出"颠覆""改变"等关键词',
        opening_style: '科技趋势引入，用数据和现象吸引注意力',
        article_framework: '趋势引入→技术解析→应用场景→影响分析→未来展望',
        content_progression: '从技术到应用，从当下到未来，层层展开',
        ending_design: '开放思考，引发读者对未来可能性的想象',
        language_style: '专业但不晦涩，善用类比和案例',
        emotional_hooks: ['好奇心', '效率追求', '未来焦虑', '科技焦虑'],
        article_type: 'tutorial',
        example_titles: '["AI正在改变你的工作方式，你准备好了吗？", "2024年最值得关注的5个科技趋势", "为什么你的手机越来越卡？"]'
      },
      {
        name: '健康养生',
        title_strategy: '健康问题+科学方法，强调"科学""有效"等关键词',
        opening_style: '健康痛点引入，用数据和案例引发关注',
        article_framework: '问题引入→科学原理→方法详解→注意事项→行动建议',
        content_progression: '从问题到原理，从方法到实践，科学严谨',
        ending_design: '健康提醒，强调长期坚持的重要性',
        language_style: '科学严谨，通俗易懂，避免过度专业术语',
        emotional_hooks: ['健康焦虑', '长寿渴望', '生活质量', '家庭责任'],
        article_type: 'tutorial',
        example_titles: '["睡眠质量差的真正原因，可能不是你想的那样", "每天走一万步真的健康吗？", "这些习惯正在悄悄毁掉你的健康"]'
      },
      {
        name: '财经投资',
        title_strategy: '财富话题+风险提示，使用数据和趋势分析',
        opening_style: '市场现象引入，用数据和案例吸引注意力',
        article_framework: '现象引入→趋势分析→投资逻辑→风险提示→策略建议',
        content_progression: '从现象到本质，从分析到策略，逻辑严密',
        ending_design: '风险提醒，强调理性投资的重要性',
        language_style: '专业理性，数据驱动，避免情绪化表达',
        emotional_hooks: ['财富焦虑', '投资机会', '风险意识', '财务自由'],
        article_type: 'tutorial',
        example_titles: '["2024年投资方向：这3个领域值得关注", "普通人如何构建被动收入？", "通胀时代，如何守护你的财富？"]'
      }
    ];
    
    for (const style of defaultWritingStyles) {
      sqlite.exec(`
        INSERT INTO writing_styles (name, title_strategy, opening_style, article_framework, content_progression, ending_design, language_style, emotional_hooks, article_type, example_titles, is_active, created_at, updated_at)
        VALUES ('${style.name}', '${style.title_strategy}', '${style.opening_style}', '${style.article_framework}', '${style.content_progression}', '${style.ending_design}', '${style.language_style}', '${JSON.stringify(style.emotional_hooks)}', '${style.article_type}', '${style.example_titles}', 1, ${now}, ${now})
      `);
    }
    console.log('Inserted default writing styles');
  }
  
  const layoutStylesCount = sqlite.prepare('SELECT COUNT(*) as count FROM layout_styles').get() as { count: number };
  if (layoutStylesCount.count === 0) {
    const now = Date.now();
    const defaultLayoutStyles = [
      {
        name: '简约商务',
        description: '适合职场、财经类文章，简洁大方',
        header_style: 'bold',
        paragraph_spacing: 'medium',
        list_style: 'number',
        highlight_style: 'bold',
        emoji_usage: 'minimal',
        quote_style: 'block',
        image_position: 'center',
        callout_style: 'box',
        color_scheme: 'blue',
        font_style: 'sans-serif'
      },
      {
        name: '温暖治愈',
        description: '适合情感心理类文章，温柔细腻',
        header_style: 'gradient',
        paragraph_spacing: 'large',
        list_style: 'bullet',
        highlight_style: 'emoji',
        emoji_usage: 'moderate',
        quote_style: 'card',
        image_position: 'center',
        callout_style: 'rounded',
        color_scheme: 'purple',
        font_style: 'serif'
      },
      {
        name: '活力美食',
        description: '适合美食旅行类文章，生动活泼',
        header_style: 'color',
        paragraph_spacing: 'medium',
        list_style: 'bullet',
        highlight_style: 'emoji',
        emoji_usage: 'rich',
        quote_style: 'highlight',
        image_position: 'full',
        callout_style: 'card',
        color_scheme: 'orange',
        font_style: 'sans-serif'
      },
      {
        name: '科技未来',
        description: '适合科技数码类文章，现代感强',
        header_style: 'gradient',
        paragraph_spacing: 'medium',
        list_style: 'number',
        highlight_style: 'code',
        emoji_usage: 'minimal',
        quote_style: 'block',
        image_position: 'center',
        callout_style: 'tech',
        color_scheme: 'dark',
        font_style: 'mono'
      },
      {
        name: '健康清新',
        description: '适合健康养生类文章，清新自然',
        header_style: 'soft',
        paragraph_spacing: 'large',
        list_style: 'bullet',
        highlight_style: 'emoji',
        emoji_usage: 'moderate',
        quote_style: 'card',
        image_position: 'center',
        callout_style: 'rounded',
        color_scheme: 'green',
        font_style: 'sans-serif'
      }
    ];
    
    for (const style of defaultLayoutStyles) {
      sqlite.exec(`
        INSERT INTO layout_styles (name, description, header_style, paragraph_spacing, list_style, highlight_style, emoji_usage, quote_style, image_position, callout_style, color_scheme, font_style, is_active, created_at, updated_at)
        VALUES ('${style.name}', '${style.description}', '${style.header_style}', '${style.paragraph_spacing}', '${style.list_style}', '${style.highlight_style}', '${style.emoji_usage}', '${style.quote_style}', '${style.image_position}', '${style.callout_style}', '${style.color_scheme}', '${style.font_style}', 1, ${now}, ${now})
      `);
    }
    console.log('Inserted default layout styles');
  }
  } catch (error) {
    console.error('Failed to insert default styles:', error);
  }
}
