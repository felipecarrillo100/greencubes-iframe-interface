// sample/src/main.tsx
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { sendToIframe, listenFromIframes, IframeToParentMessage } from "../../src";

function MainApp() {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const layer = useRef(null as string | undefined | null);

    useEffect(() => {
        const stop = listenFromIframes(
            { demo1: iframeRef.current },
            (msg: IframeToParentMessage, sourceFrameId?: string) => {
                console.log("Parent received:", msg, "from", sourceFrameId);
                switch (msg.type) {
                    case "Ready":
                            layer.current = msg.data.targetLayerId;
                            console.log(msg.data.targetLayerId);
                        break;
                    case "ClickedItem":
                        console.log(msg.data.feature);
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

    const handleRemove = () => {
        if (iframeRef.current && layer.current) {
            sendToIframe(iframeRef.current, {
                type: "RemoveLayer",
                data: {layerId: layer.current}
            });
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Main (Parent) App</h1>
            <button onClick={handleClick}>Send ZoomToLayer → Iframe</button>
            <button onClick={handleRemove}>Send RemoveLayer → Iframe</button>
            <iframe
                id="1234"
                ref={iframeRef}
                src="/index.html?geojson=https://demo.luciad.com/GreenCubes/datasets/geojson/jungle.json&reference=EPSG:3857"
                style={{ width: "100%", height: 480, border: "1px solid black" }}
            />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<MainApp />);
