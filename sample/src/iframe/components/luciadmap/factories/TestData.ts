import {BuilderLayerType, LayerConfig, LayerTreeConfig} from "./LayerBuilderInterfaces";

const children: LayerConfig[] = [
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Los Angeles Imagery", id:"group_1" },
        "children": [
            {
                "type": BuilderLayerType.WMTS, // TMS usually maps to WMTS in RIA for many configs
                "modelOptions": {
                    "url": "https://sampleservices.luciad.com/wmts",
                    "layer": "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"
                },
                "layerOptions": { "label": "Satellite Background" }
            },
        ]
    },
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Mapbox Basemap", id:"group_2" },
        "children": [
            {
                "type": BuilderLayerType.MAPBOX, // TMS usually maps to WMTS in RIA for many configs
                "modelOptions": {},
                "layerOptions": { "label": "Mapbox Basemap" }
            },
        ]
    },
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Google Basemap", id:"group_3" },
        "children": [
            {
                "type": BuilderLayerType.GOOGLE, // TMS usually maps to WMTS in RIA for many configs
                "modelOptions": {
                    "mapType": "satellite",
                },
                "layerOptions": { "label": "Basemap" }
            },
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
                "layerOptions": { "label": "Lucerne Mesh", id: "Lucerna"}
            }
        ]
    },
    {
        "type": BuilderLayerType.GROUP,
        "layerOptions": { "label": "Azure Basemap", id:"group_4" },
        "children": [
            {
                "type": BuilderLayerType.AZURE, // TMS usually maps to WMTS in RIA for many configs
                "modelOptions": {
                    "tileSetId": "microsoft.imagery",
                },
                "layerOptions": { "label": "Basemap" }
            },
            {
                "type": BuilderLayerType.GEOJSON,
                "modelOptions": {
                   // "url": "https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson",
                    "url": "./data/test.json",
                },
                "layerOptions": {
                    "label": "Custom Boundaries (Top)",
                    "selectable": true,
                    "hoverable": true
                }
            },
            {
                "type": BuilderLayerType.WFS,
                "modelOptions": {
                    "url": "https://sampleservices.luciad.com/wfs",
                    "featureTypeName": "ns4:t_states__c__1213"
                },
                "layerOptions": { "label": "Hospitals (WFS)" }
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
    }
]

export const TestData: LayerTreeConfig = {
    children,
};
