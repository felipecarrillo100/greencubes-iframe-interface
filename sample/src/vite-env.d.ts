/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Define your custom variables here
    readonly VITE_MAPBOX_KEY: string;
    readonly VITE_GOOGLE_KEY: string;
    readonly VITE_AZURE_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
