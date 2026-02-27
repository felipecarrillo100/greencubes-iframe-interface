# 🟢 greencubes-iframe-interface

> **The Bridge to LuciadRIA 2025.0**  
> A premium, type-safe communication layer for seamless Iframe integration.

[![LuciadRIA 2025.0](https://img.shields.io/badge/LuciadRIA-2025.0-brightgreen.svg)](https://luciad.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)

Integrating LuciadRIA into your app shouldn't be a headache. **greencubes-iframe-interface** provides a robust, strictly-typed bridge that makes parent-to-iframe communication feel like a native function call.

---

## 🗺️ LuciadRIA Integration, Simplified

Integrating LuciadRIA into your application shouldn't be a hurdle. **greencubes-iframe-interface** acts as a robust, strictly-typed bridge, transforming complex parent-to-iframe communication into seamless, native-feeling function calls.


* **🛡️ End-to-End Type Safety**: Eliminate `any` from your vocabulary. Every message and payload is strictly validated at compile-time, catching errors before they hit the browser.
* **⚡ Reactive & Performant**: Optimized for asynchronous command execution and instantaneous event propagation, ensuring the map remains fluid and responsive.
* **🚀 Instant Bootstrap**: The "Handshake" logic is built-in. As soon as the iframe signals readiness, dispatch your initial configurations and layer sets immediately.
* **📂 Logical Visibility Groups**: Simplify UI complexity. Manage layers in logical groups that behave like radio buttons—toggle entire map contexts with a single, clean message.
* **🎯 Feature-Level Precision**: Built-in support for GeoJSON standards. Effortlessly handle clicking, selecting, and zooming to specific map features without manual coordinate math.
* **🏗️ Declarative Layer Management**: Ditch the imperative boilerplate. Add, reorder, and manage complex layer trees using a single, intuitive JSON configuration.

---

## 🚀 Installation

```bash
npm install greencubes-iframe-interface
```

---

## 🛠️ Quick Start 

Add a powerful map to your application in minutes.

```tsx
import React, { useEffect, useRef } from "react";
import { sendToIframe, listenFromIframes, MapModeType, ParentToIframeMsg, IframeToParentMsg } from "greencubes-iframe-interface";

const MyMapApp = () => {
    const mapRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // 🎧 Single listener at the top level
        const stop = listenFromIframes({ mainMap: mapRef.current }, (msg) => {
            switch (msg.type) {
                case IframeToParentMsg.onMapReady:
                    console.log("Map is ready in mode:", msg.data.mode);
                    if (mapRef.current) {
                        sendToIframe(mapRef.current, {
                            type: ParentToIframeMsg.SetInitialMapSetup,
                            // Assuming SiteSettings is imported/defined elsewhere
                            data: { settings: SiteSettings }
                        });
                    }
                    break;

                case IframeToParentMsg.ClickedItem:
                    console.info("Feature selected from layer", msg.data.layerId, ":", msg.data.feature.properties?.name);
                    break;
            }
        });

        return () => stop();
    }, []);

    // 🕹️ Helper for sending commands
    const groupChange = (options: { targetGroupId: string; mode?: MapModeType }) => {
        if (mapRef.current) {
            sendToIframe(mapRef.current, {
                type: ParentToIframeMsg.SetLayerGroup,
                data: options
            });
        }
    };

    const zoomToDefault = () => {
        if (mapRef.current) {
            sendToIframe(mapRef.current, {
                type: ParentToIframeMsg.ZoomToLayer,
                data: { animate: true }
            });
        }
    };

    return (
        <div className="map-container">
            <div className="toolbar">
                <button className="primary-btn" onClick={zoomToDefault}>
                    Zoom to Default
                </button>
                {/* Clean, reactive command firing */}
                <button onClick={() => groupChange({ targetGroupId: "g1", mode: "2D" })}>
                    2D Tactical View
                </button>
                <button onClick={() => groupChange({ targetGroupId: "g2", mode: "3D" })}>
                    3D Terrain View
                </button>
            </div>

            <iframe
                ref={mapRef}
                src="https://your-luciad-viewer.com"
                className="luciad-iframe"
                title="Tactical Map"
            />
        </div>
    );
};
```

---

## 📖 The Messaging API

> [!TIP]
> While raw strings are supported for message types, we **strongly recommend** using the provided `ParentToIframeMsg` and `IframeToParentMsg` enums for full type safety and IDE autocomplete.

## 🕹️ Parent → Iframe Commands

Sent via `sendToIframe(iframeEl, { type, data, frameId? })`. Preferred `type` via `ParentToIframeMsg`.

| Message `type` | `data` Payload Parameters | Notes |
| --- | --- | --- |
| **`SetInitialMapSetup`** | `{ settings: InitialMapSetup }` | The master init object. |
| **`SetLayerGroup`** | `{ targetGroupId: string, mode?: MapModeType }` | `mode` is optional. |
| **`SetLayerVisibility`** | `{ layerId: string, visible: boolean }` | Direct toggle for a specific node. |
| **`SetProjection`** | `{ mode: MapModeType }` | `mode` is `"2D" | "3D"`. |
| **`SelectFeature`** | `{ featureId: JSONFeatureId, layerId?: string }` | Focuses on a single ID. |
| **`SelectFeatures`** | `{ featureIds: JSONFeatureId[], layerId?: string }` | Takes an array of IDs. |
| **`RemoveLayer`** | `{ layerId?: string }` | If `layerId` is omitted, behavior depends on implementation. |
| **`ZoomToSelection`** | `{ featureIds: JSONFeatureId[], layerId?: string, animate?: boolean | MapNavigatorAnimationOptions }` | `animate` can be a simple `true/false` or `{ duration: number }`. |
| **`ZoomToLayer`** | `{ layerId?: string, animate?: boolean | MapNavigatorAnimationOptions }` | Fits view to layer bounds. |
| **`AddLayer`** | `{ options: AddLayerOptions }` | Full configuration for new data. |
| **`MoveLayer`** | `{ options: MoveLayerOptions }` | Reorder or move layers between groups. |

---

## 📥 Iframe → Parent Events

Received via `listenFromIframes(refs, (msg, frameId?) => ... )`. Preferred `type` via `IframeToParentMsg`.

| Message `type` | `data` Payload Parameters | Context |
| --- | --- | --- |
| **`onMapReady`** | `{ mode: MapModeType }` | Sent once the Luciad engine is initialized. |
| **`ClickedItem`** | `{ feature: JSONFeature, layerId: string }` | Contains GeoJSON geometry and properties. |
| **`SelectionChanged`** | `{ selectedItems: {[key:string]: JSONFeature[]} }` | Map of layerId to selected features. |
| **`ProjectionChanged`** | `{ mode: MapModeType }` | User switched 2D/3D via the map UI. |
| **`TargetGroupChanged`** | `{ targetGroupId: string, mode: MapModeType }` | User changed the active group. |
| **`LayerTreeChanged`** | `{ layerId: string, type: LayerTreeChangedEventType, layerTree: JSONLayerTree }` | `type` is `"NodeAdded" | "NodeRemoved" | "NodeMoved"`. |
| **`LayerTreeVisibilityChanged`** | `{ layerTree: JSONLayerTree }` | Update on the entire tree visibility state. |
| **`Error`** | `{ message: string }` | Standardized error string for debugging. |

---

### 🛡️ Critical Technical Details

* **`frameId`**: Every message (both directions) carries an optional `frameId?: string`. This is vital for **multi-map dashboards**, allowing your event handler to identify exactly which instance (e.g., "MainMap" vs. "SecondaryMap") sent the `ClickedItem` event.
* **Animation Overloads**: The `animate` property is a flexible union: `boolean | MapNavigatorAnimationOptions`. This allows for a simple `true`/`false` toggle or precise control via `{ duration: number }`.
* **Strict Type Mapping**: Leveraging TypeScript's **Discriminated Unions**, the `ParentToIframeMap` and `IframeToParentMap` ensure that your IDE will flag an error if you attempt to send a payload that doesn't match the specific `type` of the message.


## 💡 Advanced Features

### Multiple Iframe Orchestration
Managing multiple maps? Simply pass them all to the listener.
```typescript
listenFromIframes({ radar: ref1, satellite: ref2 }, (msg, frameId) => {
  console.log(`Update came from ${frameId}:`, msg.type);
});
```

### Pro-Tip: Debug Mode
Add `?debug=true` to your URL to unlock internal logging and gain deep visibility into the message flow.

---

## 📄 License
MIT © 2025
