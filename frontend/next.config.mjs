/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    images: {
        domains: ['ae-pic-a1.aliexpress-media.com'],
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            const baileysOptionals = [
                "jimp",
                "sharp",
                "canvas",
                "encoding",
                "bufferutil",
                "utf-8-validate",
            ];

            const nodeBuiltins = [
                "fs",
                "path",
                "crypto",
                "assert",
                "os",
                "stream",
                "url",
                "events",
                "util",
                "zlib",
                "child_process",
                "async_hooks",
                "http",
                "https",
                "net",
                "tls",
                "buffer",
                "dns",
                "dgram",
                "string_decoder",
                "querystring",
                "punycode",
                "timers",
                "tty",
                "v8",
                "vm",
                "worker_threads",
            ];

            const baileysRuntimeDeps = [
                "link-preview-js",
                "audio-decode",
            ];

            // Handle sub-path imports of node builtins (e.g. stream/promises)
            const nodeBuiltinPrefix = (ctx, callback) => {
                const req = ctx.request;
                if (nodeBuiltins.some((n) => req.startsWith(n + "/"))) {
                    return callback(null, `commonjs ${req}`);
                }
                return callback();
            };

            if (Array.isArray(config.externals)) {
                config.externals.push(
                    ...baileysOptionals,
                    ...nodeBuiltins,
                    ...baileysRuntimeDeps,
                    nodeBuiltinPrefix,
                );
            } else if (typeof config.externals === "function") {
                const original = config.externals;
                const allExternals = [
                    ...baileysOptionals,
                    ...nodeBuiltins,
                    ...baileysRuntimeDeps,
                ];
                config.externals = (ctx, callback) => {
                    const req = ctx.request;
                    if (allExternals.includes(req)) {
                        return callback(null, `commonjs ${req}`);
                    }
                    if (nodeBuiltins.some((n) => req.startsWith(n + "/"))) {
                        return callback(null, `commonjs ${req}`);
                    }
                    return original(ctx, callback);
                };
            }
        }

        return config;
    },
};

export default nextConfig;
