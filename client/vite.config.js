import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // Cache the app shell + current lesson's question set so a quiz can
        // be taken fully offline. Attempts made offline are queued in
        // IndexedDB by services/offlineQueue.js and flushed on reconnect,
        // not by Workbox background sync, since the queue also needs to
        // trigger the Elo rating update, which is app logic, not a fetch
        // replay.
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/questions\/next.*/,
            handler: "NetworkFirst",
            options: { cacheName: "question-cache", networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/topics.*/,
            handler: "NetworkFirst",
            options: { cacheName: "topics-cache" },
          },
        ],
      },
      manifest: {
        name: "Vidyut",
        short_name: "Vidyut",
        description: "Adaptive learning for every classroom, online or off.",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        display: "standalone",
        icons: [],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
