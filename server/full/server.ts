import fastifyCompress from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { sFactory } from './serverFactory.ts';
import { listeningMessage } from "../message.ts";
import { config } from "../config/config.ts";
import { fromFileUrl } from "jsr:@std/path";

const startServer = async (configPath: string) => {
    const parsedDoc = await config(configPath);
    const serverFactory = await sFactory(configPath);
    const distPath = fromFileUrl(new URL('../../dist', import.meta.url));
    const app = Fastify({ logger: false, serverFactory: serverFactory });

    await app.register(fastifyCookie, {
        secret: Deno.env.get('COOKIE_SECRET') || 'yes',
        parseOptions: {}
    });
    await app.register(fastifyCompress, {
        encodings: ['br', 'gzip', 'deflate']
    });

    if (parsedDoc.seo.enabled && !parsedDoc.seo.both || !parsedDoc.seo.enabled) {
        await app.register(fastifyStatic, {
            root: distPath,
            etag: false,
            lastModified: false
        });
    } 
    else {
        await app.register(fastifyStatic, {
            root: `${Deno.cwd()}/dist/noseo`,
        });
        await app.register(fastifyStatic, {
            root: `${Deno.cwd()}/dist/seo`,
            constraints: { host: new URL(Deno.env.get('DOMAIN') || parsedDoc.seo.domain).host },
            decorateReply: false
        })
    }

    await app.register(fastifyMiddie);
    await app.register(fastifyHttpProxy, {
        upstream: 'https://rawcdn.githack.com/ruby-network/ruby-assets/main/',
        prefix: '/gms/',
        http2: false
    });

    const port = parseInt(Deno.env.get('PORT') as string) || parsedDoc.server.port || 8000;

    app.listen({ port: port, host: '0.0.0.0' }).then(() => {
        listeningMessage(port, "fastify");
    });
}

export { startServer }
