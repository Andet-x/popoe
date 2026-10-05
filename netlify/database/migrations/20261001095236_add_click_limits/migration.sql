CREATE TABLE "click_limits" (
	"visitor_id" text PRIMARY KEY,
	"click_times" timestamp with time zone[] NOT NULL
);
