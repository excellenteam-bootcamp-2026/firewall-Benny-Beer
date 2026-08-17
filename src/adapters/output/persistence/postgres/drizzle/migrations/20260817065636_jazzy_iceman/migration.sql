CREATE TYPE "rule_mode" AS ENUM('blacklist', 'whitelist');--> statement-breakpoint
CREATE TYPE "rule_type" AS ENUM('ip', 'domain', 'port');--> statement-breakpoint
CREATE TABLE "domain_rules" (
	"id" integer PRIMARY KEY,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_rules" (
	"id" integer PRIMARY KEY,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "port_rules" (
	"id" integer PRIMARY KEY,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_index" (
	"id" serial PRIMARY KEY,
	"type" "rule_type" NOT NULL,
	"mode" "rule_mode" NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rule_index_type_mode_active_idx" ON "rule_index" ("type","mode","active");--> statement-breakpoint
ALTER TABLE "domain_rules" ADD CONSTRAINT "domain_rules_id_rule_index_id_fkey" FOREIGN KEY ("id") REFERENCES "rule_index"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ip_rules" ADD CONSTRAINT "ip_rules_id_rule_index_id_fkey" FOREIGN KEY ("id") REFERENCES "rule_index"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "port_rules" ADD CONSTRAINT "port_rules_id_rule_index_id_fkey" FOREIGN KEY ("id") REFERENCES "rule_index"("id") ON DELETE CASCADE;