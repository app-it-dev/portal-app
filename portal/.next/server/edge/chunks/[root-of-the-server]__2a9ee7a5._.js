(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__2a9ee7a5._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/Documents/portal/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$portal$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/portal/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$portal$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/portal/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$portal$2f$node_modules$2f40$supabase$2f$auth$2d$helpers$2d$nextjs$2f$dist$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/portal/node_modules/@supabase/auth-helpers-nextjs/dist/index.js [middleware-edge] (ecmascript)");
;
;
async function middleware(req) {
    const url = req.nextUrl.clone();
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$portal$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // Only guard /portal/*
    if (!url.pathname.startsWith('/portal')) {
        return res;
    }
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$portal$2f$node_modules$2f40$supabase$2f$auth$2d$helpers$2d$nextjs$2f$dist$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://snenrahusjjyjinftwnq.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZW5yYWh1c2pqeWppbmZ0d25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMTc5OTMsImV4cCI6MjA2MjY5Mzk5M30.NtyItkyWielvhKQrGj1CEAnal21mU-VktfqHp0vUTNs"), {
        cookies: {
            get (name) {
                return req.cookies.get(name)?.value;
            },
            set (name, value, options) {
                res.cookies.set({
                    name,
                    value,
                    ...options
                });
            },
            remove (name, options) {
                res.cookies.set({
                    name,
                    value: '',
                    ...options
                });
            }
        }
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        url.pathname = '/login';
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$portal$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    // Check admin membership via RLS
    const { data: admins } = await supabase.from('admins').select('user_id, is_active').eq('user_id', session.user.id).eq('is_active', true).limit(1);
    if (!admins || admins.length === 0) {
        url.pathname = '/unauthorized';
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$portal$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].rewrite(url);
    }
    return res;
}
const config = {
    matcher: [
        '/portal/:path*'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__2a9ee7a5._.js.map