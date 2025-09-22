# iframeMessages

A TypeScript library for **type-safe communication** between a parent window and one or one ore more iframes containing a basic LuciadRIA application.  
Supports strict type-checking, autocomplete, and payload validation for all message types.
---

## Features

- Typed messages from **iframe → parent** and **parent → iframe**
- Autocomplete and type safety for `type` and `data`
- Utility functions for sending and listening to messages
- Optional `frameId` support for multiple iframes
- Debug logging via URL query parameter `?debug=true`

---

## Installation

Assuming your project uses npm or yarn:

```bash
npm install @your-org/iframe-messages
# or
yarn add @your-org/iframe-messages
```

---

## Types

### Base message

```ts
interface BaseMessage<T extends string, D> {
  type: T;
  data: D;
  frameId?: string;
}
```

### Iframe → Parent messages

```ts
type IframeToParentMessage =
  | BaseMessage<"LayerTreeChange", { layerId: string; type: "NodeAdded" | "NodeRemoved" | "NodeMoved" }>
  | BaseMessage<"ClickedItem", { feature: Feature }>
  | BaseMessage<"SelectedItems", { features: Feature[] }>
  | BaseMessage<"Ready", { targetLayerId?: string }>
  | BaseMessage<"Error", { message: string }>;
```

### Parent → Iframe messages

```ts
type ParentToIframeMessage =
  | BaseMessage<"HighlightFeature", { featureId: FeatureId }>
  | BaseMessage<"SelectFeatures", { featureIds: FeatureId[] }>
  | BaseMessage<"RemoveLayer", { layerId?: string }>
  | BaseMessage<"ZoomToSelection", { featureIds: FeatureId[]; animate?: boolean | MapNavigatorAnimationOptions }>
  | BaseMessage<"ZoomToLayer", { layerId?: string; animate?: boolean | MapNavigatorAnimationOptions }>;
```

---

## Usage

### Sending messages

**Parent → Iframe**

```ts
sendToIframe(iframeElement, {
  type: "ZoomToLayer",
  data: { layerId: "roads", animate: false }
});
```

**Iframe → Parent**

```ts
sendToParent({
  type: "SelectedItems",
  data: { features: selectedFeatures }
});
```

---

### Listening for messages

**Parent listening from iframes**

```ts
listenFromIframes({ mainFrame: iframeRef.current }, (msg, frameId) => {
  if (msg.type === "SelectedItems") {
    console.log("Selected features from iframe:", msg.data.features);
  }
});
```

**Iframe listening from parent**

```ts
listenFromParent((msg) => {
  if (msg.type === "HighlightFeature") {
    highlightFeature(msg.data.featureId);
  }
});
```

---

### Debug Logging

Enable debug logs by adding `?debug=true` to the URL:

```ts
consoleOnDebugMode("This will appear only if debug=true in URL");
```

---

## Notes

- All message types are strictly typed; using an invalid `type` or incorrect `data` will result in a TypeScript compile-time error.
- `frameId` is optional but recommended if multiple iframes are communicating with the parent.

---

## License
MIT © 2025
