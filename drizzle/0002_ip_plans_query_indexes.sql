CREATE TABLE "ip_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"industry_analysis" text,
	"account_name" text,
	"account_avatar" text,
	"account_bio" text,
	"account_style" text,
	"persona_name" text,
	"persona_traits" text,
	"persona_story" text,
	"persona_voice" text,
	"execution_plan" text,
	"content_calendar" text,
	"milestones" text,
	"monetization_path" text,
	"revenue_model" text,
	"pricing_strategy" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "article_stats_article_record_idx" ON "article_stats" USING btree ("article_id","record_time");--> statement-breakpoint
CREATE INDEX "collected_articles_subscription_publish_idx" ON "collected_articles" USING btree ("subscription_id","publish_time");--> statement-breakpoint
CREATE INDEX "collected_articles_publish_time_idx" ON "collected_articles" USING btree ("publish_time");--> statement-breakpoint
CREATE INDEX "hot_topic_history_topic_recorded_idx" ON "hot_topic_history" USING btree ("topic_id","recorded_at");--> statement-breakpoint
CREATE INDEX "hot_topics_hot_value_idx" ON "hot_topics" USING btree ("hot_value");--> statement-breakpoint
CREATE INDEX "hot_topics_predicted_growth_idx" ON "hot_topics" USING btree ("predicted_growth");--> statement-breakpoint
CREATE INDEX "material_library_topic_created_idx" ON "material_library" USING btree ("topic_id","created_at");--> statement-breakpoint
CREATE INDEX "material_library_type_created_idx" ON "material_library" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "platform_posts_platform_fetched_idx" ON "platform_posts" USING btree ("platform","fetched_at");--> statement-breakpoint
CREATE INDEX "post_comments_post_like_idx" ON "post_comments" USING btree ("post_id","like_count");--> statement-breakpoint
CREATE INDEX "published_articles_created_at_idx" ON "published_articles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "viral_titles_account_publish_idx" ON "viral_titles" USING btree ("benchmark_account_id","publish_date");--> statement-breakpoint
CREATE INDEX "wechat_drafts_update_time_idx" ON "wechat_drafts" USING btree ("update_time");