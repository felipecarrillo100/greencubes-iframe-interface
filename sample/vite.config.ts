import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    // Include extra asset types like GLB
    assetsInclude: ["**/*.glb"],

    plugins: [
        // Enable React support
        react({
            jsxRuntime: "automatic", // React 18+ / 19 compatible
        }),
    ],

    server: {
        port: 5173,
        open: "/sample.html",
        fs: {
            allow: ["..", "."],
        },
    },

    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, "sample.html"),
            },
        },
    },

    // Optional: treat files in /public as static assets automatically
    publicDir: path.resolve(__dirname, "public"),
    resolve: {
        alias: {
            // This maps the @library prefix to the actual absolute path
            '@library': path.resolve(__dirname, '../src'),
        },
    },
});
