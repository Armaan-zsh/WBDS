import { AsyncLocalStorage } from "node:async_hooks";
import process from "node:process";
import * as nextEnvVars from "./.open-next/env/next-env.mjs";
import { handler } from "./.open-next/server-functions/default/handler.mjs";

const cloudflareContextALS = new AsyncLocalStorage();

Object.defineProperty(globalThis, Symbol.for("__cloudflare-context__"), {
    get() {
        return cloudflareContextALS.getStore();
    },
});

export default {
    async fetch(request, env, ctx) {
        return cloudflareContextALS.run({ env, ctx, cf: request.cf }, async () => {
            const url = new URL(request.url);

            // Static assets optimization
            if (
                url.pathname.startsWith("/_next/static/") ||
                url.pathname.startsWith("/static/") ||
                url.pathname.endsWith(".png") ||
                url.pathname.endsWith(".ico") ||
                url.pathname.endsWith(".svg") ||
                url.pathname.endsWith(".jpg") ||
                url.pathname.endsWith(".mp3") ||
                url.pathname.endsWith(".json")
            ) {
                const response = await env.ASSETS?.fetch(request);
                if (response && response.status !== 404) {
                    return response;
                }
            }

            // Image optimization proxy
            if (url.pathname === "/_next/image") {
                const imageUrl = url.searchParams.get("url") ?? "";
                return imageUrl.startsWith("/")
                    ? env.ASSETS?.fetch(new URL(imageUrl, request.url))
                    : fetch(imageUrl, { cf: { cacheEverything: true } });
            }

            return handler(request, env, ctx);
        });
    },
};
