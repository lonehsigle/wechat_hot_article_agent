ALTER TABLE "published_articles" ADD COLUMN IF NOT EXISTS "wechat_publish_id" text;
--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN IF NOT EXISTS "wechat_msg_data_id" text;
--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN IF NOT EXISTS "publish_error" text;
--> statement-breakpoint
ALTER TABLE "published_articles" ADD COLUMN IF NOT EXISTS "publish_detail" text;
--> statement-breakpoint
ALTER TABLE "article_stats_daily" ADD COLUMN IF NOT EXISTS "source_breakdown" text;
--> statement-breakpoint
ALTER TABLE "article_stats_daily" ADD COLUMN IF NOT EXISTS "raw_summary" text;
--> statement-breakpoint
ALTER TABLE "article_stats_daily" ADD COLUMN IF NOT EXISTS "sync_status" text DEFAULT 'synced';
--> statement-breakpoint
ALTER TABLE "article_stats_daily" ADD COLUMN IF NOT EXISTS "sync_message" text;
--> statement-breakpoint
ALTER TABLE "material_library" ADD COLUMN IF NOT EXISTS "source_score" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "material_library" ADD COLUMN IF NOT EXISTS "source_type" text DEFAULT 'llm';
--> statement-breakpoint
ALTER TABLE "material_library" ADD COLUMN IF NOT EXISTS "verification_status" text DEFAULT 'needs_review';
--> statement-breakpoint
ALTER TABLE "material_library" ADD COLUMN IF NOT EXISTS "source_summary" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"triggered_by" text DEFAULT 'manual',
	"input_summary" text,
	"status" text DEFAULT 'running' NOT NULL,
	"output_summary" text,
	"error_message" text,
	"audit_warnings" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"duration_ms" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
