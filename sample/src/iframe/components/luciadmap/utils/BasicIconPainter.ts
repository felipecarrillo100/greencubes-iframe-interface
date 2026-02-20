import {FeaturePainter, type PaintState} from "@luciad/ria/view/feature/FeaturePainter.js";
import type {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {Shape} from "@luciad/ria/shape/Shape.js";
import {Layer} from "@luciad/ria/view/Layer.js";
import {Map} from "@luciad/ria/view/Map.js";
import {PointLabelPosition} from "@luciad/ria/view/style/PointLabelPosition.js";
import {Point} from "@luciad/ria/shape/Point.js";
import type {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas.js";
import type {ShapeStyle} from "@luciad/ria/view/style/ShapeStyle.js";
import type {UrlIconStyle} from "@luciad/ria/view/style/IconStyle.js";
import {DrapeTarget} from "@luciad/ria/view/style/DrapeTarget";

const labelStyleCss = `"
  display: inline-block;
  font-family: 'Courier New', monospace;
  font-weight: bold;                  /* bold but not ultra-heavy */
  font-size: 24px;                     /* adjust as needed */
  color: white;                        /* white interior */
  -webkit-text-stroke: 0.8px black;    /* thin black outline */
  text-stroke: 0.1px black;            /* for other browsers that support it */
  white-space: nowrap;                  /* prevent breaking lines */
  // pointer-events: none;                 /* ignore pointer */
"`;

const DefaultStyle: ShapeStyle = {
    fill: { color: "rgba(255, 179, 186, 0.25)" }, // soft pink, semi-transparent
    stroke: { color: "rgba(255, 105, 97, 1)", width: 2 }, // warm red outline
};

const HoveredStyle: ShapeStyle = {
    fill: { color: "rgba(255, 223, 186, 0.25)" }, // soft orange
    stroke: { color: "rgba(255, 149, 0, 1)", width: 2 }, // medium orange outline
    zOrder: 0
};

const HoveredSelectedStyle: ShapeStyle = {
    fill: { color: "rgba(255, 255, 153, 0.25)" }, // bright yellow, semi-transparent
    stroke: { color: "rgba(255, 193, 7, 1)", width: 3 }, // amber outline, slightly thicker
    zOrder: 0
};

const SelectedStyle: ShapeStyle = {
    fill: { color: "rgba(186, 225, 255, 0.25)" }, // soft cyan
    stroke: { color: "rgba(30, 144, 255, 1)", width: 3 }, // Dodger Blue outline
    zOrder: 0
};

interface ShapeIndexPainterContructorOptions {
    url?: string;
    width?: number;
    height?: number;
    zOrder?: number;
}

export class BasicIconPainter extends FeaturePainter {
    private url: string;
    private width: number;
    private height: number;
    private zOrder: number;
    constructor(options?:ShapeIndexPainterContructorOptions) {
        super();
        this.url = options?.url ? options.url : "./map_marker.png";
        this.width = options?.width ? options.width : 28;
        this.height = options?.height ? options.height : 28;
        this.zOrder = options?.zOrder ? options.zOrder : 1000;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paintBody(geoCanvas: GeoCanvas, _feature: Feature, shape: Shape, _layer: Layer, _map: Map, paintState: PaintState) {
        if (shape instanceof Point) {
            // Define base icon style
            const iconStyle: UrlIconStyle = {
                url: this.url,
                width: this.width,
                height: this.height,
                zOrder: this.zOrder,
                drapeTarget: DrapeTarget.NOT_DRAPED
            };

            // Apply modulation color based on state
            if (paintState.selected && paintState.hovered) {
                iconStyle.modulationColor = "rgb(0,255,0)"; // selected only
            } else if (paintState.selected) {
                iconStyle.modulationColor = "rgb(33,197,33)"; // hovered only
            } else if (paintState.hovered) {
                iconStyle.modulationColor = "rgb(50,131,50)"; // selected only
            }

            geoCanvas.drawIcon(shape, iconStyle);
        } else {
            // Define shape style based on state
            let style: ShapeStyle;

            if (paintState.selected && !paintState.hovered) {
                style = SelectedStyle;
            } else if (paintState.selected && paintState.hovered) {
                style = HoveredSelectedStyle;
            } else if (paintState.hovered) {
                style = HoveredStyle;
            } else {
                style = DefaultStyle;
            }

            geoCanvas.drawShape(shape, style);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, _layer: Layer, _map: Map, _paintState: PaintState) {
        const html = `<div style=${labelStyleCss}>${feature.properties.Name}</div>`;


        if (shape instanceof Point) {
            labelCanvas.drawLabel(html, shape, {
                pin: {width: 2, color: "#ffffff", haloColor: "#ffffff"},
                offset: [15, 5],
                positions: [PointLabelPosition.NORTH_WEST, PointLabelPosition.NORTH_EAST, PointLabelPosition.SOUTH_WEST, PointLabelPosition.SOUTH_EAST]
            });
        } else {
            labelCanvas.drawLabelInPath(html, shape, {});
        }
    }
}
