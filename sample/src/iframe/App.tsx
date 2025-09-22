import * as React from "react";
import { LuciadMap } from "./components/luciadmap/LuciadMap";
import { FullscreenButton } from "./components/fullscreen/FullscreenButton";
import { Attribution } from "./components/attribution/Attribution";
import { useRef, useState } from "react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type {Feature} from "@luciad/ria/model/feature/Feature.js";
import {LayerTreeNodeChangeEvent} from "@luciad/ria/view/LayerTree";
import {consoleOnDebugMode, sendToParent} from "../../../src";
import './App.scss';
import {Shape} from "@luciad/ria/shape/Shape.js";

const theme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const App: React.FC = () => {
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const onShowTime = (o: {status: boolean, errorMessage?:string, targetLayerId?: string}) => {
        if (o.status) {
            setLoading(false);
            setError(null);
            // fade in the content
            requestAnimationFrame(() => {
                if (contentRef.current) {
                    contentRef.current.style.opacity = "1";
                }
            });
            sendToParent({
                type: "Ready",
                data: {targetLayerId: o.targetLayerId}
            });
            consoleOnDebugMode("Showtime triggered!");
        } else {
            setLoading(false);
            const message  = o.errorMessage ? o.errorMessage : "Failed to load the data. Verify the data url";
            setError(message);
            sendToParent({
                type: "Error",
                data: {message}
            });
            consoleOnDebugMode(`Error triggered! ${message}`);
        }
    };

    const handleFullscreen = () => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    const onGeometryClicked = (feature: Feature)=> {
        // Detect if running inside an iframe
        if (feature.shape) {
            sendToParent({
                type: "ClickedItem",
                data: { feature: {
                        id: feature.id,
                        properties: feature.properties,
                        shape: {...feature.shape, type: feature.shape?.type} as Shape,
                    } as Feature},
            });
            consoleOnDebugMode(`Click triggered! ${feature.id}`);
        }
    }

    const  layerTreeChange =  (o: {layerTreeNodeChange: LayerTreeNodeChangeEvent,  type: "NodeAdded" | "NodeRemoved" | "NodeMoved"  }) => {
        // Detect if running inside an iframe
        sendToParent({
            type: "LayerTreeChange",
            data: { layerId: o.layerTreeNodeChange.node.id, type: o.type },
        });
        consoleOnDebugMode(`Layer Change! ${o.layerTreeNodeChange.node} ${o.type}`);
    }

    const onGeometrySelected = (features: Feature[])=> {
        // Detect if running inside an iframe
        sendToParent({
            type: "SelectedItems",
            data: {
                features: features.map(f => ({
                    id: f.id,
                    properties: f.properties,
                    shape: {...f.shape, type: f.shape?.type},
                })) as Feature[],
            },
        });
        consoleOnDebugMode(`Selected triggered! [${features.map(f => f.id).join(", ")}]`);
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="App">
                {/* Loading or error overlay */}
                {loading && (
                    <div className="LoadingOverlay">
                        <span className="LoadingText">
                            {error ? error : "Loading"}
                        </span>
                    </div>
                )}

                {/* Main app content that fades in */}
                <div className="AppContent" ref={contentRef} style={{ opacity: 0 }}>
                    <LuciadMap onShowTime={onShowTime} geometrySelected={onGeometrySelected} geometryClicked={onGeometryClicked}
                               layerTreeChange={layerTreeChange}
                    />
                    <FullscreenButton onClick={handleFullscreen} />
                    <Attribution text="Green Cubes" url="https://www.google.com" />
                </div>
                {(!loading && error) && (
                    <div className="Errorverlay">
                        <span>
                            {error}
                        </span>
                    </div>
                )}
            </div>
        </ThemeProvider>
    );
}

export default App;
