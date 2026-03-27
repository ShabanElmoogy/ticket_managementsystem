// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // Increase to 3 MB
          globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg}"],
          navigateFallback: "index.html",
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],
        manifest: {
          name: "Kanban Board",
          short_name: "Kanban",
          description: "A modern Kanban board PWA for ticket management.",
          theme_color: "#1976d2",
          background_color: "#ffffff",
          display: "standalone",
          scope: "./", // Changed to relative path
          start_url: "./", // Changed to relative path
          icons: [
            {
              src: "pwa-64x64.png", // Removed leading slash
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png", // Added recommended 192x192 size
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png", // Removed leading slash
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            // Add additional chunks as needed based on your dependencies
          },
        },
      },
    },
    server: isDev
      ? {
          https: {
            key: fs.readFileSync("./.cert/key.pem"),
            cert: fs.readFileSync("./.cert/cert.pem"),
          },
          host: "localhost",
          port: 5173,
          proxy: {
            '/api': {
              target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  };
});
