CREATE TABLE "analysis_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer,
	"title" text NOT NULL,
	"author" text,
	"url" text,
	"summary" text,
	"read_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"engagement_rate" real DEFAULT 0,
	"publish_date" text,
	"content" text,
	"keywords" text,
	"analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"status" text DEFAULT 'pending',
	"total_articles" integer DEFAULT 0,
	"analyzed_articles" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "article_rewrites" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_article_ids" text,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"style" text,
	"word_count" integer DEFAULT 0,
	"ai_score" real,
	"human_score" real,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer,
	"record_time" timestamp DEFAULT now() NOT NULL,
	"read_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"collect_count" integer DEFAULT 0,
	"read_growth" integer DEFAULT 0,
	"like_growth" integer DEFAULT 0,
	"comment_growth" integer DEFAULT 0,
	"share_growth" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "article_stats_daily" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer,
	"date" text NOT NULL,
	"total_read" integer DEFAULT 0,
	"total_like" integer DEFAULT 0,
	"total_comment" integer DEFAULT 0,
	"total_share" integer DEFAULT 0,
	"total_collect" integer DEFAULT 0,
	"daily_read_growth" integer DEFAULT 0,
	"daily_like_growth" integer DEFAULT 0,
	"daily_comment_growth" integer DEFAULT 0,
	"daily_share_growth" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "benchmark_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"account_id" text NOT NULL,
	"account_name" text NOT NULL,
	"avatar" text,
	"description" text,
	"follower_count" integer DEFAULT 0,
	"note" text,
	"tags" text,
	"is_low_follower_viral" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cache_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_key" text NOT NULL,
	"cache_data" text NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "cache_records_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "collect_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"total_articles" integer DEFAULT 0,
	"collected_articles" integer DEFAULT 0,
	"failed_articles" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collected_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer,
	"msg_id" text NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"digest" text,
	"content" text,
	"content_html" text,
	"cover_image" text,
	"local_images" text,
	"source_url" text NOT NULL,
	"publish_time" timestamp,
	"read_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"recommend_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"engagement_rate" real DEFAULT 0,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"snapshot_path" text,
	"markdown_path" text,
	"pdf_path" text,
	"tags" text,
	"note" text,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collected_articles_msg_id_unique" UNIQUE("msg_id")
);
--> statement-breakpoint
CREATE TABLE "comment_word_cloud" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer,
	"platform" text NOT NULL,
	"total_comments" integer DEFAULT 0,
	"positive_count" integer DEFAULT 0,
	"negative_count" integer DEFAULT 0,
	"neutral_count" integer DEFAULT 0,
	"top_keywords" text,
	"top_emojis" text,
	"sentiment_score" real DEFAULT 0,
	"generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"platform" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"date" text NOT NULL,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"read_count" integer DEFAULT 0,
	"look_count" integer DEFAULT 0,
	"digest" text,
	"content" text,
	"url" text NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"type" text NOT NULL,
	"keyword" text,
	"post_id" text,
	"creator_id" text,
	"status" text DEFAULT 'pending',
	"total_items" integer DEFAULT 0,
	"crawled_items" integer DEFAULT 0,
	"failed_items" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"creator_id" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"description" text,
	"follower_count" integer DEFAULT 0,
	"following_count" integer DEFAULT 0,
	"post_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"verify_type" text,
	"monitor_enabled" boolean DEFAULT false,
	"last_fetch_at" timestamp,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer,
	"report_id" integer,
	"topic_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"images" text,
	"style" text,
	"word_count" integer DEFAULT 0,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hot_topic_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer,
	"hot_value" integer DEFAULT 0,
	"rank" integer DEFAULT 0,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hot_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"hot_value" integer DEFAULT 0,
	"rank" integer DEFAULT 0,
	"category" text,
	"tags" text,
	"trend_direction" text DEFAULT 'stable',
	"predicted_growth" real DEFAULT 0,
	"is_black_horse" boolean DEFAULT false,
	"fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer,
	"top_likes_articles" text,
	"top_engagement_articles" text,
	"word_cloud" text,
	"insights" text,
	"topic_suggestions" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layout_styles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"header_style" text DEFAULT 'bold',
	"paragraph_spacing" text DEFAULT 'medium',
	"list_style" text DEFAULT 'number',
	"highlight_style" text DEFAULT 'emoji',
	"emoji_usage" text DEFAULT 'moderate',
	"quote_style" text DEFAULT 'block',
	"image_position" text DEFAULT 'center',
	"callout_style" text DEFAULT 'box',
	"color_scheme" text DEFAULT 'default',
	"font_style" text DEFAULT 'sans-serif',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"api_key" text NOT NULL,
	"model" text NOT NULL,
	"base_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"key_points" text,
	"quotes" text,
	"data_points" text,
	"tags" text,
	"topic_id" integer,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitor_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"platforms" text,
	"keywords" text,
	"creators" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitor_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"message" text,
	"data" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "optimization_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer,
	"gap_type" text NOT NULL,
	"gap_description" text,
	"source_strength" text,
	"rewrite_weakness" text,
	"suggestion" text NOT NULL,
	"priority" text DEFAULT 'medium',
	"performance_ratio" real DEFAULT 0,
	"status" text DEFAULT 'pending',
	"reviewed_at" timestamp,
	"reviewer_note" text,
	"applied_to_prompt" boolean DEFAULT false,
	"applied_at" timestamp,
	"effectiveness_score" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"post_id" text NOT NULL,
	"title" text,
	"content" text,
	"author_id" text,
	"author_name" text,
	"author_avatar" text,
	"cover_image" text,
	"images" text,
	"video_url" text,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"collect_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"publish_time" timestamp,
	"fetched_at" timestamp,
	"tags" text,
	"category" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer,
	"platform" text NOT NULL,
	"comment_id" text NOT NULL,
	"parent_id" text,
	"root_id" text,
	"user_id" text,
	"user_name" text,
	"user_avatar" text,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"is_author" boolean DEFAULT false,
	"publish_time" timestamp,
	"sentiment" text,
	"keywords" text,
	"fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"template" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_configs_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "published_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '',
	"cover_image" text DEFAULT '',
	"images" text,
	"wechat_account_id" integer,
	"topic_id" integer,
	"publish_status" text DEFAULT 'draft',
	"publish_time" timestamp,
	"wechat_media_id" text,
	"wechat_article_url" text,
	"source_content_id" integer,
	"source_title" text,
	"source_read_count" integer DEFAULT 0,
	"source_like_count" integer DEFAULT 0,
	"source_digest" text,
	"article_url" text,
	"read_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"look_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"analysis_status" text DEFAULT 'pending',
	"analysis_result" text,
	"analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"date" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technique_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "technique_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reason" text NOT NULL,
	"potential" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"avatar" text,
	"role" text DEFAULT 'user',
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "viral_titles" (
	"id" serial PRIMARY KEY NOT NULL,
	"benchmark_account_id" integer,
	"title" text NOT NULL,
	"article_url" text,
	"publish_date" text,
	"read_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"title_model" text,
	"pain_point_level" text,
	"keywords" text,
	"analysis" text,
	"is_collected" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wechat_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"app_id" text DEFAULT '',
	"app_secret" text DEFAULT '',
	"author_name" text DEFAULT '',
	"is_default" boolean DEFAULT false,
	"target_audience" text,
	"reader_persona" text,
	"content_style" text,
	"main_topics" text,
	"tone_preference" text,
	"access_token" text,
	"token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wechat_auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"cookie" text,
	"nickname" text,
	"avatar" text,
	"status" text DEFAULT 'pending',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wechat_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" text,
	"title" text NOT NULL,
	"author" text,
	"digest" text,
	"content" text,
	"content_html" text,
	"cover_image" text,
	"source_url" text,
	"need_open_comment" boolean DEFAULT false,
	"only_fans_can_comment" boolean DEFAULT false,
	"article_id" text,
	"status" text DEFAULT 'draft',
	"create_time" timestamp,
	"update_time" timestamp,
	"fetched_at" timestamp,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wechat_drafts_media_id_unique" UNIQUE("media_id")
);
--> statement-breakpoint
CREATE TABLE "wechat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_key" text NOT NULL,
	"token" text NOT NULL,
	"cookies" text NOT NULL,
	"nickname" text,
	"avatar" text,
	"status" text DEFAULT 'active',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wechat_sessions_auth_key_unique" UNIQUE("auth_key")
);
--> statement-breakpoint
CREATE TABLE "wechat_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"biz" text NOT NULL,
	"name" text NOT NULL,
	"alias" text,
	"avatar" text,
	"description" text,
	"last_article_time" timestamp,
	"total_articles" integer DEFAULT 0,
	"monitor_enabled" boolean DEFAULT true,
	"monitor_interval" integer DEFAULT 300,
	"last_monitor_at" timestamp,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wechat_subscriptions_biz_unique" UNIQUE("biz")
);
--> statement-breakpoint
CREATE TABLE "word_cloud_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_key" text NOT NULL,
	"basic_word_cloud" text,
	"ai_word_cloud" text,
	"article_count" integer DEFAULT 0,
	"article_hash" text,
	"ai_processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_cloud_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "writing_styles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title_strategy" text,
	"opening_style" text,
	"article_framework" text,
	"content_progression" text,
	"ending_design" text,
	"language_style" text,
	"emotional_hooks" text,
	"article_type" text,
	"template" text,
	"example_titles" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_techniques" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"stage" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"examples" text,
	"formulas" text,
	"checklists" text,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_articles" ADD CONSTRAINT "analysis_articles_task_id_analysis_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."analysis_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_stats" ADD CONSTRAINT "article_stats_article_id_published_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."published_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_stats_daily" ADD CONSTRAINT "article_stats_daily_article_id_published_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."published_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collect_tasks" ADD CONSTRAINT "collect_tasks_subscription_id_wechat_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."wechat_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collected_articles" ADD CONSTRAINT "collected_articles_subscription_id_wechat_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."wechat_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_word_cloud" ADD CONSTRAINT "comment_word_cloud_post_id_platform_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."platform_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_category_id_monitor_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."monitor_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_articles" ADD CONSTRAINT "generated_articles_task_id_analysis_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."analysis_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_articles" ADD CONSTRAINT "generated_articles_report_id_insight_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."insight_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hot_topic_history" ADD CONSTRAINT "hot_topic_history_topic_id_hot_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."hot_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_reports" ADD CONSTRAINT "insight_reports_task_id_analysis_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."analysis_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_suggestions" ADD CONSTRAINT "optimization_suggestions_article_id_published_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."published_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_platform_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."platform_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_articles" ADD CONSTRAINT "published_articles_wechat_account_id_wechat_accounts_id_fk" FOREIGN KEY ("wechat_account_id") REFERENCES "public"."wechat_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_monitor_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."monitor_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viral_titles" ADD CONSTRAINT "viral_titles_benchmark_account_id_benchmark_accounts_id_fk" FOREIGN KEY ("benchmark_account_id") REFERENCES "public"."benchmark_accounts"("id") ON DELETE no action ON UPDATE no action;