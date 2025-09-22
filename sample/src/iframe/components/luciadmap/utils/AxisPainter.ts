import {FeaturePainter, type PaintState} from "@luciad/ria/view/feature/FeaturePainter.js";
import type {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {Shape} from "@luciad/ria/shape/Shape.js";
import {Layer} from "@luciad/ria/view/Layer.js";
import {Map} from "@luciad/ria/view/Map.js";
import type {ShapeStyle} from "@luciad/ria/view/style/ShapeStyle.js";
import type {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas.js";
import {Polyline} from "@luciad/ria/shape/Polyline.js";
import {createBounds, createPoint, createPolyline} from "@luciad/ria/shape/ShapeFactory.js";
import {Bounds} from "@luciad/ria/shape/Bounds.js";
import {PointLabelPosition} from "@luciad/ria/view/style/PointLabelPosition.js";

const XStyle:ShapeStyle = {
    stroke: {
        color: "#ff0000",
        width: 3,
    }
}
const YStyle:ShapeStyle = {
    stroke: {
        color: "#00ff00",
        width: 3,
    }
}
const ZStyle:ShapeStyle = {
    stroke: {
        color: "#0000ff",
        width: 3,
    }
}

const TickSize10m = 2;
const TickSize1m = 0.5;

export class AxisPainter extends FeaturePainter {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, _layer: Layer, _map: Map, _paintState: PaintState) {
        let style: ShapeStyle;

        if (shape instanceof Polyline) {
            const axis = feature.properties.axis;
            let tickFromTo: (i: number, ts: number) => [number[], number[]];
            const interval = 10; // mark every 10 units

            switch (axis) {
                case "x":
                    style = XStyle;
                    tickFromTo = (i:number, tickSize:number) => [[i, 0, -tickSize], [i, 0, tickSize]];
                    break;
                case "y":
                    style = YStyle;
                    tickFromTo = (i:number, tickSize:number) => [[0, i, -tickSize], [0, i, tickSize]];
                    break;
                case "z":
                    style = ZStyle;
                    tickFromTo = (i:number, tickSize:number) => [[-tickSize, 0, i], [tickSize, 0, i]];
                    break;
                default:
                    return;
            }
            geoCanvas.drawShape(shape, style);

            // Draw tick marks and labels
            for (let i = -100; i <= 100; i += interval) {
                const [from, to] = tickFromTo(i, TickSize10m);
                const p1 = createPoint(shape.reference, from);
                const p2 = createPoint(shape.reference, to);
                const tickShape = createPolyline(shape.reference, [p1, p2]);

                geoCanvas.drawShape(tickShape, {
                    stroke: {
                        color: "rgba(255,255,255,0.50)",
                        width: 2
                    }
                });
            }
            // Draw tick marks and labels
            for (let i = -9; i <= 9; i += 1) {
                const [from, to] = tickFromTo(i, TickSize1m);
                const p1 = createPoint(shape.reference, from);
                const p2 = createPoint(shape.reference, to);
                const tickShape = createPolyline(shape.reference, [p1, p2]);

                geoCanvas.drawShape(tickShape, {
                    stroke: {
                        color: "rgba(255,255,255,0.25)",
                        width: 2
                    }
                });
            }
        }

        if (shape instanceof Bounds) {
            const plane = createBounds(shape.reference, [-100, 200, -100, 200, 0, 0]);
            geoCanvas.drawShape(plane, {
                fill: {
                    color: "rgba(0,0,0,0.2)",
                    width: 2
                },
                stroke: {
                    color: "rgba(255,255,255,0.25)",
                    width: 2
                }
            });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, _layer: Layer, _map: Map, _paintState: PaintState) {
        const html = `<div style="color: white; font-weight: bold; font-family: Arial, sans-serif; font-size: 18.5px;">${feature.properties.axis}</div>`;
        if (shape instanceof Polyline) {
            const point = shape.getPoint(1);
            labelCanvas.drawLabel(html, point, {positions: [PointLabelPosition.NORTH_EAST]});
        }
    }
}
