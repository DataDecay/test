import { Hono } from 'jsr:@hono/hono';
import { serveStatic } from 'jsr:@hono/hono/deno';
import { compress } from 'jsr:@hono/hono/compress';
import { listeningMessage } from '../message.ts';
import { config } from '../config/config.ts';
import { fromFileUrl } from 'jsr:@std/path';

const startServer = async (configPath: string) => {
    const parsedDoc = await config(configPath);
    const app = new Hono();

    app.use(compress({
        encoding: 'gzip',
    }));

    if (parsedDoc.seo.enabled && !parsedDoc.seo.both || !parsedDoc.seo.enabled) {
        app.use('/*', serveStatic({ root: fromFileUrl(new URL('../../dist', import.meta.url)) }));
    }

    if (parsedDoc.seo.enabled && parsedDoc.seo.both) {
        app.use('/*', (ctx, next) => {
            if (new URL(ctx.req.url).host === new URL(Deno.env.get('DOMAIN') || parsedDoc.seo.domain).host) {
                return serveStatic({ root: `${Deno.cwd()}/dist/seo` })(ctx, next);
            }
            else {
                return serveStatic({ root: `${Deno.cwd()}/dist/noseo` })(ctx, next);
            }
        });
    }

    Deno.serve({
        hostname: '0.0.0.0',
        port: parseInt(Deno.env.get('PORT') as string) || parsedDoc.server.port || 8000,
        onListen() {
            listeningMessage(parseInt(Deno.env.get('PORT') as string) || parsedDoc.server.port || 8000, 'hono');
        },
    }, app.fetch);
}

export { startServer }
