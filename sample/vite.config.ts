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

    resolve: {
        alias: {
            // Points "@lib" to your library root/src
            "@lib": path.resolve(__dirname, "../src"),
        },
    },

    server: {
        port: 5173, // you can change this if needed
        // Open sample.html automatically in browser
        open: "/sample.html",
    },

    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            // Multiple HTML entry points
            input: {
                main: path.resolve(__dirname, "sample.html"),
                iframe: path.resolve(__dirname, "index.html"),
            },
        },
    },

    // Optional: treat files in /public as static assets automatically
    publicDir: path.resolve(__dirname, "public"),
});
