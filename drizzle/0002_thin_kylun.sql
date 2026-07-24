CREATE TYPE "public"."shift_type" AS ENUM('opening', 'bd', 'closing');--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "shift_type" "shift_type";