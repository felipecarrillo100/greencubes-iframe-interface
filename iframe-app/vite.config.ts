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
        port: 5174, // different port from sample
        open: true,
    },

    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, "index.html"),
            },
        },
    },

    // Optional: treat files in /public as static assets automatically
    publicDir: path.resolve(__dirname, "public"),
});
