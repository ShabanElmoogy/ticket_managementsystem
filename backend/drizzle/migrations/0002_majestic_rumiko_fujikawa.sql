CREATE TABLE "customer_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "customer_applications" ADD CONSTRAINT "customer_applications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;