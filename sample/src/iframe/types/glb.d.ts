// src/types/glb.d.ts
declare module "*.glb" {
    const value: string; // The GLB file will resolve to a string representing the URL
    export default value;
}
