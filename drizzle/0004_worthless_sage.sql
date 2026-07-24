ALTER TABLE "shifts" ALTER COLUMN "shift_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."shift_type";--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('opening', 'bd', 'closing');--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "shift_type" SET DATA TYPE "public"."shift_type" USING "shift_type"::"public"."shift_type";