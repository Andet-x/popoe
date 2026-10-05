import { bigint, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const counters = pgTable('counters', {
    id: text('id').primaryKey(),
    total: bigint('total', { mode: 'bigint' }).notNull().default(0n),
});

export const clickLimits = pgTable('click_limits', {
    visitorId: text('visitor_id').primaryKey(),
    clickTimes: timestamp('click_times', { withTimezone: true }).array().notNull(),
});
