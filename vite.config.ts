import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {TanStackRouterVite} from "@tanstack/router-vite-plugin";
import {VitePWA} from "vite-plugin-pwa";

// Vite config tuned for aggressive caching:
//   • Tailwind v4 via official Vite plugin
//   • TanStack file-based routing (auto-generates routeTree.gen.ts)
//   • Workbox-powered Service Worker pre-caches the shell
//   • code-splitting per route + manual chunking for hot deps
//   • all hashed assets get long-term immutable headers in Caddy

export default defineConfig({
  plugins: [
    // TanStack Router plugin must come BEFORE @vitejs/plugin-react so its
    // JSX transforms run after route generation.
    TanStackRouterVite({autoCodeSplitting: true}),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // we register manually in main.tsx for control
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "Walbi Exchange",
        short_name: "Walbi",
        description: "AI-first crypto exchange",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        start_url: "/",
        icons: [
          {src: "/pwa-192.png", sizes: "192x192", type: "image/png"},
          {src: "/pwa-512.png", sizes: "512x512", type: "image/png"},
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // hashed immutable assets — cache forever
            urlPattern: /\/assets\/.*\.(?:js|css|woff2|png|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: {maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365},
            },
          },
          {
            // CDN avatars and other content
            urlPattern: /^https:\/\/content\.walbi\.com\//i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "walbi-cdn",
              expiration: {maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30},
            },
          },
          {
            // GET REST (non-mutating) — SWR with 60s freshness
            urlPattern: /^https:\/\/gw\.walbi\.com\/api\/.*\/list\/v\d+/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "walbi-api-lists",
              expiration: {maxEntries: 100, maxAgeSeconds: 60},
            },
          },
        ],
      },
      devOptions: {enabled: false},
    }),
  ],
  build: {
    target: "es2022",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Group hot vendor deps into stable chunks so each route's bundle
        // stays under ~80 KB and shared deps cache across page loads.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || /\/react\//.test(id)) return "react";
          if (id.includes("@tanstack/react-router")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("@heroui-pro")) return "heroui";
          if (id.includes("@heroui/")) return "heroui";
          if (id.includes("react-aria-components")) return "aria";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@iconify")) return "icons";
          return undefined;
        },
      },
    },
    // React + framer-motion + react-aria is naturally chunky; cap higher
    chunkSizeWarningLimit: 200,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
