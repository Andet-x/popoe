import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/netlify-db';
import * as schema from '../../db/schema.js';
import { randomUUID } from 'node:crypto';
import type { Context } from '@netlify/functions';

export default async (request: Request, context: Context) => {
    const headers = {
        'Cache-Control': 'no-store',
        'Netlify-CDN-Cache-Control': 'no-store',
    };

    if (request.method !== 'GET' && request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, {
            status: 405,
            headers: { ...headers, Allow: 'GET, POST' },
        });
    }

    if (request.method === 'POST') {
        const origin = request.headers.get('origin');
        if ((origin && origin !== new URL(request.url).origin)
            || request.headers.get('sec-fetch-site') === 'cross-site') {
            return Response.json({ error: 'Forbidden' }, { status: 403, headers });
        }
    }

    try {
        const db = drizzle({ schema });
        const { counters } = schema;
        let visitorId = context.cookies.get('click-visitor');
        if (!visitorId || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(visitorId)) {
            visitorId = randomUUID();
            context.cookies.set({
                name: 'click-visitor',
                value: visitorId,
                path: '/',
                httpOnly: true,
                secure: new URL(request.url).protocol === 'https:',
                sameSite: 'Lax',
                maxAge: 31536000,
            });
        }

        const rows = request.method === 'POST'
            ? (await db.execute<{ total: string }>(sql`
                WITH accepted_click AS (
                    INSERT INTO ${schema.clickLimits} (visitor_id, click_times)
                    VALUES (${visitorId}, ARRAY[statement_timestamp()])
                    ON CONFLICT (visitor_id) DO UPDATE
                    SET click_times = ARRAY(
                        SELECT click_time FROM unnest(click_limits.click_times) AS click_time
                        WHERE click_time > statement_timestamp() - interval '2 minutes'
                    ) || statement_timestamp()
                    WHERE (
                        SELECT count(*) FROM unnest(click_limits.click_times) AS click_time
                        WHERE click_time > statement_timestamp() - interval '2 minutes'
                    ) < 50
                    RETURNING visitor_id
                )
                INSERT INTO ${counters} (id, total)
                SELECT 'global', 1 FROM accepted_click WHERE true
                ON CONFLICT (id) DO UPDATE SET total = counters.total + 1
                RETURNING total::text
            `)).rows
            : await db.select({ total: counters.total })
                .from(counters)
                .where(eq(counters.id, 'global'));

        if (request.method === 'POST' && rows.length === 0) {
            const retry = await db.execute<{ retry_after: number }>(sql`
                SELECT greatest(1, ceil(extract(epoch FROM (
                    (SELECT min(click_time) FROM unnest(click_times) AS click_time
                     WHERE click_time > statement_timestamp() - interval '2 minutes')
                    + interval '2 minutes' - statement_timestamp()
                ))))::integer AS retry_after
                FROM ${schema.clickLimits} WHERE visitor_id = ${visitorId}
            `);
            const retryAfter = retry.rows[0]?.retry_after ?? 120;
            return Response.json({ error: 'Click limit reached', retryAfter }, {
                status: 429,
                headers: { ...headers, 'Retry-After': String(retryAfter) },
            });
        }

        return Response.json({ total: String(rows[0]?.total ?? 0n) }, { headers });
    } catch {
        return Response.json({ error: 'Counter unavailable' }, { status: 503, headers });
    }
};
