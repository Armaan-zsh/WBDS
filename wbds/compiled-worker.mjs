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

            if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/static/")) {
                return env.ASSETS?.fetch(request);
            }

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
