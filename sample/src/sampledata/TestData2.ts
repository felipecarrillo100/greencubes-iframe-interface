import { BuilderLayerType, LayerConfig, LayerTreeConfig, PainterAvailable } from "../../../src";

const children: LayerConfig[] = [
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Mapbox Basemap", shared: true },
        "children": [
            {
                "type": BuilderLayerType.MAPBOX, // TMS usually maps to WMTS in RIA for many configs
                "modelOptions": {},
                "layerOptions": { "label": "Mapbox Basemap" }
            },
            {
                "type": BuilderLayerType.ELEVATION,
                "modelOptions": {
                    url: "https://sampleservices.luciad.com/lts",
                    coverageId: "world_elevation_6714a770-860b-4878-90c9-ab386a4bae0f",
                },
                "layerOptions": { "label": "Elevation Layer" },
            },
        ]
    },
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Google Basemap", id: "group_1" },
        "children": [
            {
                "type": BuilderLayerType.OGC3DTiles,
                "modelOptions": {
                    "url": "https://sampleservices.luciad.com/ogc/3dtiles/outback/tileset.json"
                },
                "layerOptions": { "label": "Outback 3DTiles", id: "Belgian-Factory" }
            },
            {
                "type": BuilderLayerType.OGC3DTiles, // Using 3DTiles type for Mesh
                "modelOptions": {
                    "url": "https://sampledata.luciad.com/data/ogc3dtiles/LucerneAirborneMesh/tileset.json"
                },
                "layerOptions": { "label": "Lucerne Mesh", id: "Lucerna" }
            }
        ]
    },
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Azure Basemap", id: "group_2" },
        "children": [
            {
                "type": BuilderLayerType.GEOJSON,
                "modelOptions": {
                    "url": "./data/test.json",
                },
                "layerOptions": {
                    "label": "Custom Boundaries (Top)",
                    "selectable": true,
                    "hoverable": true,
                    painterName: PainterAvailable.Experience,
                    id: "USA-STATES",
                }
            },
            {
                "type": BuilderLayerType.WFS,
                "modelOptions": {
                    "url": "https://sampleservices.luciad.com/wfs",
                    "featureTypeName": "ns4:t_states__c__1213"
                },
                "layerOptions": {
                    "label": "States",
                    "selectable": true, "hoverable": true,
                },
            },
            {
                "type": BuilderLayerType.WMS,
                "modelOptions": {
                    "getMapRoot": "https://sampleservices.luciad.com/wms",
                    "layers": ["rivers"],
                    "transparent": true,
                },
                "layerOptions": { "label": "Rivers (WMS)" }
            }
        ]
    },
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Google Basemap", id: "group_3" },
        "children": [
            {
                "type": BuilderLayerType.GOOGLE, // TMS usually maps to WMTS in RIA for many configs
                "modelOptions": {
                    "mapType": "satellite",
                },
                "layerOptions": { "label": "Basemap" }
            },
        ]
    },
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Azure Basemap", id: "group_4" },
        "children": [
            {
                "type": BuilderLayerType.AZURE, // TMS usually maps to WMTS in RIA for many configs
                "modelOptions": {
                    "tileSetId": "microsoft.imagery",
                },
                "layerOptions": { "label": "Basemap" }
            },
        ]
    }
]

export const TestData2: LayerTreeConfig = {
    children,
};
