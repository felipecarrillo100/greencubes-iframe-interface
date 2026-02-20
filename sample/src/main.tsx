// sample/src/main.tsx
import React, {useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom/client";
import {sendToIframe, listenFromIframes, IframeToParentMessage, MapModeType} from "../../src";
// import {TestData} from "./iframe/components/luciadmap/factories/TestData";
import "./main.css"
import {TestData2} from "./iframe/components/luciadmap/sampledata/TestData2";
import {EventLogger} from "./EventLogger";
import {JsonViewer} from "./JsonViewer";
import {InitialMapSetup} from "./iframe/components/luciadmap/factories/LayerBuilderInterfaces";

const SiteSettings:InitialMapSetup = {
    children: TestData2.children,
    mode: "2D",
    targetGroupId: "group_2",
    targetFeatureLayerID: "USA-STATES",
    boundsFeatureLayerID: "USA-STATES",
}

const MainApp: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [currentMapMode, setCurrentMapMode] = useState("2D");
    const [logs, setLogs] = useState<string[]>([]);
    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const layer = useRef(null as string | undefined | null);

    useEffect(() => {
        const stop = listenFromIframes(
            { demo1: iframeRef.current },
            (msg: IframeToParentMessage, sourceFrameId?: string) => {
                console.log("Parent received:", msg, "from", sourceFrameId);
                switch (msg.type) {
                    case "MapReady":
                        addLog("Map is ready" + JSON.stringify(msg, null,2));
                        iframeRef.current && sendToIframe(iframeRef.current, {
                                type: "SetInitialMapSetup",
                                data: {
                                    settings: SiteSettings
                                },
                            });
                        break;
                    case "TargetGroupChanged":
                        addLog("Target Group changed" + JSON.stringify(msg,null,2));
                        break
                    case "ProjectionChanged":
                        addLog("Projection changed" + JSON.stringify(msg,null,2));
                        setCurrentMapMode(msg.data.mode);
                        break;
                    case "ClickedItem":
                        addLog(`Feature-Clicked: ${msg.data.feature.id} ${JSON.stringify(msg.data.feature.properties)}`);
                        if (iframeRef.current){
                            sendToIframe(iframeRef.current, {type: "ZoomToSelection", data: {animate: true, featureIds: [msg.data.feature.id]}})
                        }
                        break;
                    case "SelectedItems":
                        console.log(msg.data.features);
                        break;
                }
            }
        );
        return () => stop();
    }, []);

    const handleClick = () => {
        if (iframeRef.current) {
            sendToIframe(iframeRef.current, {
                type: "ZoomToLayer",
                data: { animate: false},
            });
        }
    };

    const handleProjection = (projection: "2D" | "3D") => {
        if (iframeRef.current) {
            sendToIframe(iframeRef.current, {
                type: "SetProjection",
                data: { mode: projection},
            });
        }
    }

    const handleGroupChange = (options: {targetGroupId: string; mode?: MapModeType}) => {
        if (iframeRef.current) {
            sendToIframe(iframeRef.current, {
                type: "SetLayerGroup",
                data: options
            });
        }
    }

    const handleRemove = () => {
        if (iframeRef.current && layer.current) {
            sendToIframe(iframeRef.current, {
                type: "RemoveLayer",
                data: {layerId: layer.current}
            });
        }
    };

    return (
        <div style={{ padding: 10 }}>
            <h2>Main (Parent) App {currentMapMode}</h2>
            <button onClick={handleClick}>Send ZoomToLayer → Iframe</button>
            <button onClick={handleRemove}>Send RemoveLayer → Iframe</button>
            <button onClick={()=>handleProjection("2D")}>Send Map to 2D → Iframe</button>
            <button onClick={()=>handleProjection("3D")}>Send Map to 3D → Iframe</button>
            <iframe
                id="1234"
                ref={iframeRef}
                // src="/index.html?geojson=https://demo.luciad.com/GreenCubes/datasets/geojson/jungle.json&reference=EPSG:3857"
                src="/index.html?geojson=./data/test.json&reference=EPSG:3857"
               // src="/index.html?reference=EPSG:3857"
                style={{ width: "100%", height: 480, border: "1px solid black" }}
            />
            <div className="group-selection-holder">
                <button onClick={()=>handleGroupChange({targetGroupId: "group_1", mode: "2D"})}>Group 1 → Iframe</button>
                <button onClick={()=>handleGroupChange({targetGroupId: "group_2", mode: "3D"})}>Group 2 → Iframe</button>
                <button onClick={()=>handleGroupChange({targetGroupId: "group_3", mode: "2D"})}>Group 3 → Iframe</button>
                <button onClick={()=>handleGroupChange({targetGroupId: "group_4", mode: "3D"})}>Group 4 → Iframe</button>
            </div>
            <JsonViewer data={SiteSettings}/>
            <EventLogger logs={logs} />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<MainApp />);
