import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { sendToIframe, listenFromIframes, BuilderLayerType, ParentToIframeMsg, IframeToParentMsg } from "@library/index";
import type {
    IframeToParentMessage,
    MapModeType,
    InitialMapSetup,
    JSONFeatureId,
    JSONLayerTree,

} from "@library/index";

import { TestData2 } from "./sampledata/TestData2";
import { EventLogger } from "./components/EventLogger";
import { JsonViewer } from "./components/JsonViewer";
import { LayerTreeViewer } from "./components/LayerTreeViewer";
import "./main.css"

const SiteSettings: InitialMapSetup = {
    children: TestData2.children,
    mode: "2D",
    targetGroupId: "group_2",
    targetFeatureLayerID: "MY-BOUNDS",
    boundsFeatureLayerID: "MY-BOUNDS",
}

const MainApp: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [currentMapMode, setCurrentMapMode] = useState("2D");
    const [logs, setLogs] = useState<string[]>([]);
    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const [layerTree, setLayerTree] = useState<JSONLayerTree>({ children: [] });

    useEffect(() => {
        const stop = listenFromIframes(
            { demo1: iframeRef.current },
            (msg: IframeToParentMessage, sourceFrameId?: string) => {
                console.log("Parent received:", msg, "from", sourceFrameId);
                switch (msg.type) {
                    case IframeToParentMsg.onMapReady:
                        addLog("Map is ready" + JSON.stringify(msg, null, 2));
                        iframeRef.current && sendToIframe(iframeRef.current, {
                            type: ParentToIframeMsg.SetInitialMapSetup,
                            data: {
                                settings: SiteSettings
                            },
                        });
                        break;
                    case IframeToParentMsg.LayerTreeChanged:
                    case IframeToParentMsg.LayerTreeVisibilityChanged:
                        console.log("LayerTree changed", msg);
                        setLayerTree(msg.data.layerTree)
                        break;
                    case IframeToParentMsg.TargetGroupChanged:
                        addLog("Target Group changed" + JSON.stringify(msg, null, 2));
                        break
                    case IframeToParentMsg.ProjectionChanged:
                        addLog("Projection changed" + JSON.stringify(msg, null, 2));
                        setCurrentMapMode(msg.data.mode);
                        break;
                    case IframeToParentMsg.ClickedItem:
                        addLog(`Feature-Clicked: ${msg.data.layerId} / ${msg.data.feature.id} ${JSON.stringify(msg.data.feature.properties)}`);
                        if (iframeRef.current) {
                            sendToIframe(iframeRef.current, { type: ParentToIframeMsg.ZoomToSelection, data: { animate: true, featureIds: [msg.data.feature.id as JSONFeatureId] } })
                        }
                        break;
                    case IframeToParentMsg.SelectionChanged:
                        addLog(`Selection-Changed`);
                        break;
                }
            }
        );
        return () => stop();
    }, []);


    const handleProjection = (projection: "2D" | "3D") => {
        if (iframeRef.current) {
            sendToIframe(iframeRef.current, {
                type: ParentToIframeMsg.SetProjection,
                data: { mode: projection },
            });
        }
    }

    const handleGroupChange = (options: { targetGroupId: string; mode?: MapModeType }) => {
        if (iframeRef.current) {
            sendToIframe(iframeRef.current, {
                type: ParentToIframeMsg.SetLayerGroup,
                data: options
            });
        }
    }


    const handleAddTestLayer = (position: any, refId?: string) => {
        if (iframeRef.current) {
            sendToIframe(iframeRef.current, {
                type: ParentToIframeMsg.AddLayer,
                data: {
                    options: {
                        layerConfig: {
                            type: BuilderLayerType.WMS,
                            modelOptions: {
                                getMapRoot: "https://sampleservices.luciad.com/wms",
                                layers: ["states"],
                                transparent: true,
                                format: "image/png"
                            },
                            layerOptions: {
                                label: `Dynamic WMS States + ${Math.random().toString(36).substring(2, 5)}`,
                                visible: true
                            }
                        },
                        position,
                        referenceLayerId: refId
                    }
                }
            });
        }
    }

    const handleAddTestGroup = () => {
        if (iframeRef.current) {
            sendToIframe(iframeRef.current, {
                type: ParentToIframeMsg.AddLayer,
                data: {
                    options: {
                        layerConfig: {
                            type: BuilderLayerType.GROUP,
                            layerOptions: {
                                id: "test-group-" + Math.random().toString(36).substr(2, 5),
                                label: "Dynamic Group",
                                visible: true
                            },
                            children: []
                        },
                        position: "top"
                    }
                }
            });
        }
    }

    return (
        <div style={{ padding: 10 }}>
            <h2>Main (Parent) App {currentMapMode}</h2>
            <button onClick={() => handleProjection("2D")}>Send Map to 2D → Iframe</button>
            <button onClick={() => handleProjection("3D")}>Send Map to 3D → Iframe</button>
            <iframe
                id="1234"
                ref={iframeRef}
                src="http://localhost:5174/?geojson=./data/test.json&reference=EPSG:3857"
                style={{ width: "100%", height: 480, border: "1px solid black" }}
            />
            <div className="group-selection-holder">
                <button onClick={() => handleGroupChange({ targetGroupId: "group_1", mode: "3D" })}>Group 1 → Iframe</button>
                <button onClick={() => handleGroupChange({ targetGroupId: "group_2", mode: "2D" })}>Group 2 → Iframe</button>
                <button onClick={() => handleGroupChange({ targetGroupId: "group_3", mode: "2D" })}>Group 3 → Iframe</button>
                <button onClick={() => handleGroupChange({ targetGroupId: "group_4", mode: "3D" })}>Group 4 → Iframe</button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button onClick={() => handleAddTestLayer("top")}>Add WMS Top</button>
                <button onClick={() => handleAddTestLayer("bottom")}>Add WMS Bottom</button>
                <button onClick={() => handleAddTestLayer("above", "USA-STATES")}>Add WMS Above USA</button>
                <button onClick={() => handleAddTestLayer("below", "USA-STATES")}>Add WMS Below USA</button>
                <button onClick={() => handleAddTestLayer("parent", "group_1")}>Add WMS to Group 1</button>
                <button onClick={() => handleAddTestLayer("parent-bottom", "group_1")}>Add WMS to Group 1 (Bottom)</button>
                <button onClick={handleAddTestGroup}>Add New Group</button>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ width: "70%" }}>
                    <JsonViewer data={SiteSettings} />
                    <EventLogger logs={logs} />
                </div>
                <div style={{ width: "30%" }}>
                    <LayerTreeViewer layerTree={layerTree} iframe={iframeRef} />
                </div>
            </div>

        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<MainApp />);
