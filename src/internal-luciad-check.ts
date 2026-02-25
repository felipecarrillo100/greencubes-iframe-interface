/**
 * This file is for INTERNAL VALIDATION ONLY.
 * It ensures that the serializable interfaces in interfaces.ts
 * are compatible with the real LuciadRIA types.
 *
 * It will throw a compiler error if LuciadRIA breaks compatibility.
 */

import type { WMTSTileSetModelCreateOptions } from "@luciad/ria/model/tileset/WMTSTileSetModel";
import type { WFSFeatureStoreCreateOptions } from "@luciad/ria/model/store/WFSFeatureStore";
import type { WMSTileSetModelConstructorOptions } from "@luciad/ria/model/tileset/WMSTileSetModel";
import type { FusionTileSetModelCreateOptions } from "@luciad/ria/model/tileset/FusionTileSetModel";
import type { RasterTileSetLayerConstructorOptions } from "@luciad/ria/view/tileset/RasterTileSetLayer";
import type { FeatureLayerConstructorOptions } from "@luciad/ria/view/feature/FeatureLayer";
import type { TileSet3DLayerConstructorOptions } from "@luciad/ria/view/tileset/TileSet3DLayer";
import type { LayerConstructorOptions } from "@luciad/ria/view/LayerTreeNode";
import type { AzureMapsTileSetModelCreateOptions } from "@luciad/ria/model/tileset/AzureMapsTileSetModel";

import type * as Thin from "./interfaces";

// Type logic to verify compatibility
type Verify<T extends U, U> = T;

// Validate Model Options
export type CheckWMTS = Verify<Thin.WMTSModelOptions, Partial<Omit<WMTSTileSetModelCreateOptions, "preferredRequestEncoding">> & { url: string; layer: string; preferredRequestEncoding?: any }>;
export type CheckWFS = Verify<Thin.WFSModelOptions, Partial<WFSFeatureStoreCreateOptions> & { url: string; featureTypeName: string }>;
export type CheckWMS = Verify<Thin.WMSTileSetModelOptions, Partial<Omit<WMSTileSetModelConstructorOptions, "version">> & { getMapRoot: string; layers: string[]; version?: any }>;
export type CheckFusion = Verify<Thin.FusionTileSetModelOption, Partial<FusionTileSetModelCreateOptions>>;
export type CheckAzure = Verify<Thin.AzureMapsModelOptions, Partial<AzureMapsTileSetModelCreateOptions>>;

// Validate Layer Options
export type CheckLayerGroup = Verify<Thin.LayerGroupOptions, Partial<LayerConstructorOptions>>;
export type CheckRaster = Verify<Thin.RasterLayerOptions, Partial<RasterTileSetLayerConstructorOptions>>;
export type CheckFeature = Verify<Thin.FeatureLayerOptions, Partial<FeatureLayerConstructorOptions>>;
export type Check3D = Verify<Thin.TileSet3DLayerOptions, Partial<TileSet3DLayerConstructorOptions>>;

console.log("Luciad Compatibility Check Passed");
