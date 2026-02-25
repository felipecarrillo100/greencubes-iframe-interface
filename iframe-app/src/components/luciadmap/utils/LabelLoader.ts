import {MemoryStore} from "@luciad/ria/model/store/MemoryStore.js";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel.js";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {createPoint} from "@luciad/ria/shape/ShapeFactory.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {BasicIconPainter} from "./BasicIconPainter";

const defaultProjection = "LUCIAD:XYZ";
const reference = getReference(defaultProjection);

export async function loadLabels(
    url: string,
    inputOptions?: RequestInit | null
): Promise<FeatureLayer> {
    const options = inputOptions ? inputOptions : {};
    try {
        const defaultOptions: RequestInit = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers || {}), // merge headers safely
            },
            ...options,
        };

        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const store = new MemoryStore({ reference, data: transformDataToFeatures(data) });

        const model = new FeatureModel(store, { reference });
        const painter = new BasicIconPainter();
        return new FeatureLayer(model, {
            label: "Labels",
            selectable: true,
            hoverable: true,
            visible: true,
            painter,
        });
    } catch (err) {
        console.error("Error loading labels:", err);
        throw err;
    }
}

function transformDataToFeatures(data: any[]) {
    return data.map(
        (item, index) =>
            new Feature(
                createPoint(reference, [item.X, item.Y, 0]),
                { diameter: item.Diameter },
                index
            )
    );
}
