import { WebGLMap } from "@luciad/ria/view/WebGLMap.js";
import { LayerAttribution, TileSetAttributionProvider } from "@luciad/ria/view/tileset/TileSetAttributionProvider.js";
import { ReactNode, useEffect, useState } from "react";
import "./Attribution.css";

interface Props {
    map: WebGLMap | null;
    staticAttributions?: ReactNode;
}

export const Attribution = ({ map, staticAttributions }: Props) => {
    const [layerAttributions, setLayerAttributions] = useState<LayerAttribution[]>([]);

    useEffect(() => {
        if (!map) {
            setLayerAttributions([]);
            return;
        }

        const attributionProvider = new TileSetAttributionProvider(map);

        // Initial sync
        setLayerAttributions(attributionProvider.getLayerAttributions());

        // Automatically detects when layers are hidden or added
        const listener = attributionProvider.on("LayerAttributionsChanged", (newAttributions) => {
            setLayerAttributions(newAttributions);
        });

        return () => {
            listener.remove();
        };
    }, [map]);

    // --- DEDUPLICATION LOGIC ---
    // Flatten strings from all layers and remove duplicates
    const uniqueNames = Array.from(new Set(
        layerAttributions.flatMap(attr => attr.attributionStrings)
    ));

    // Flatten logos from all layers and remove duplicates
    const uniqueLogos = Array.from(new Set(
        layerAttributions.flatMap(attr => attr.attributionLogos as string[])
    ));

    // Don't render if there is absolutely nothing to show
    if (uniqueNames.length === 0 && !staticAttributions && uniqueLogos.length === 0) {
        return null;
    }

    return (
        <div className="attribution">
            <div className="attribution-strings">
                {uniqueNames.map((name, index) => (
                    <div key={`name-${index}`} className="attribution-row">
                        {name}
                    </div>
                ))}
                {staticAttributions && <div className="attribution-row">{staticAttributions}</div>}
            </div>

            <div className="attribution-logos">
                {uniqueLogos.map((logo, index) => (
                    <img
                        className="attributionLogo"
                        alt="Provider"
                        key={`logo-${index}`}
                        src={logo}
                    />
                ))}
            </div>
        </div>
    );
};
