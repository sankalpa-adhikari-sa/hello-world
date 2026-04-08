CREATE TYPE "public"."fund_project_level" AS ENUM('highschool', 'undergrad', 'grad');--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "student_school_name" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "student_department" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "student_major" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "student_graduation_year" integer;--> statement-breakpoint
ALTER TABLE "fund_a_project" ADD COLUMN "project_level" "fund_project_level" DEFAULT 'undergrad' NOT NULL;--> statement-breakpoint
ALTER TABLE "fund_a_project" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "fund_a_project" ADD COLUMN "cover_image_alt" text;