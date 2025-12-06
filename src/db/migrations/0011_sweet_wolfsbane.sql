CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"product_type" text NOT NULL,
	"config" text,
	"popular" boolean DEFAULT false NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_price" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"payment_type" text NOT NULL,
	"interval" text,
	"trial_period_days" integer,
	"allow_promotion_code" boolean DEFAULT false NOT NULL,
	"original_amount" integer,
	"discount_rate" integer,
	"disabled" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_price_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
ALTER TABLE "product_price" ADD CONSTRAINT "product_price_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_type_idx" ON "product" USING btree ("product_type");--> statement-breakpoint
CREATE INDEX "product_disabled_idx" ON "product" USING btree ("disabled");--> statement-breakpoint
CREATE INDEX "product_sort_order_idx" ON "product" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "product_price_product_id_idx" ON "product_price" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_price_stripe_price_id_idx" ON "product_price" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "product_price_disabled_idx" ON "product_price" USING btree ("disabled");