import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// 1. Import the compression plugin
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
    // SET BASE TO RELATIVE
    base: './',

    // Include extra asset types like GLB
    assetsInclude: ["**/*.glb"],

    plugins: [
        // Enable React support
        react({
            jsxRuntime: "automatic",
        }),
        // Gzip compression for files > 100KB
        viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            threshold: 102400, // 100KB
            deleteOriginFile: false,
        }),
        // Brotli compression for files > 100KB
        viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 102400, // 100KB
            deleteOriginFile: false,
        }),
    ],

    server: {
        port: 5174,
        open: true,
    },

    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, "index.html"),
            },
            output: {
                // This splits the code into logical chunks
                manualChunks: (id) => {
                    if (id.includes('@luciad') || id.includes('ria-toolbox')) {
                        return 'vendor-luciad';
                    }
                    if (id.includes('node_modules')) {
                        return 'vendor-core';
                    }
                },
                // [name] refers to the chunk name (e.g., vendor-luciad)
                // [hash] is the unique content-based string for cache busting
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            },
        },
    },

    publicDir: path.resolve(__dirname, "public"),
    resolve: {
        alias: {
            '@library': path.resolve(__dirname, '../src'),
        },
    },
});
