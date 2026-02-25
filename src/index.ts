// src/index.ts
import type { MapNavigatorAnimationOptions } from "@luciad/ria/view/MapNavigator";
import { JSONFeature, JSONFeatureId } from "./JSONFeature";
import { InitialMapSetup, MapModeType } from "./interfaces";

export * from "./interfaces";
export * from "./JSONFeature";

/**
 * Base message type for communication between parent and iframe.
 *
 * @template T The message type string.
 * @template D The shape of the data payload.
 */
export interface BaseMessage<T extends string, D> {
    /** Discriminator for the type of message */
    type: T;
    /** Data payload of the message */
    data: D;
    /** Optional frame identifier for multiple iframes */
    frameId?: string;
}

// ==============================
// Messages sent from Iframe → Parent
// ==============================

/**
 * Messages that can be sent from an iframe to the parent window.
 */
export type IframeToParentMessage =
    | BaseMessage<"ProjectionChanged", { mode: MapModeType }>
    | BaseMessage<"TargetGroupChanged", { targetGroupId: string, mode: MapModeType }>
    | BaseMessage<"LayerTreeChange", { layerId: string; type: "NodeAdded" | "NodeRemoved" | "NodeMoved" }>
    | BaseMessage<"ClickedItem", { feature: JSONFeature }>
    | BaseMessage<"SelectedItems", { features: JSONFeature[] }>
    | BaseMessage<"MapReady", { mode: MapModeType }>
    | BaseMessage<"Error", { message: string }>;

// ==============================
// Messages sent from Parent → Iframe
// ==============================

/**
 * Messages that can be sent from the parent window to an iframe.
 */
export type ParentToIframeMessage =
    | BaseMessage<"SetInitialMapSetup", { settings: InitialMapSetup }>
    | BaseMessage<"SetLayerGroup", { targetGroupId: string, mode?: MapModeType }>
    | BaseMessage<"SetProjection", { mode: MapModeType }>
    | BaseMessage<"HighlightFeature", { featureId: JSONFeatureId }>
    | BaseMessage<"SelectFeatures", { featureIds: JSONFeatureId[] }>
    | BaseMessage<"RemoveLayer", { layerId?: string }>
    | BaseMessage<"ZoomToSelection", { featureIds: JSONFeatureId[]; animate?: boolean | MapNavigatorAnimationOptions }>
    | BaseMessage<"ZoomToLayer", { layerId?: string; animate?: boolean | MapNavigatorAnimationOptions }>;

// ==============================
// Type maps for strict autocomplete
// ==============================

/** Map of Iframe → Parent message types to their data payloads */
type IframeToParentMap = { [M in IframeToParentMessage as M["type"]]: M["data"] };

/** Map of Parent → Iframe message types to their data payloads */
type ParentToIframeMap = { [M in ParentToIframeMessage as M["type"]]: M["data"] };

// ==============================
// Senders with strict types & autocomplete
// ==============================

/**
 * Sends a message from the parent to a specific iframe.
 *
 * @template T Type of the message.
 * @param iframeEl Target iframe element.
 * @param msg Message object containing type, data, and optional frameId.
 * @param origin Optional origin restriction (default "*").
 */
export function sendToIframe<T extends keyof ParentToIframeMap>(
    iframeEl: HTMLIFrameElement,
    msg: { type: T; data: ParentToIframeMap[T]; frameId?: string },
    origin: string = "*"
) {
    if (!iframeEl.contentWindow) {
        console.warn("sendToIframe: iframe has no contentWindow");
        return;
    }
    iframeEl.contentWindow.postMessage(msg, origin);
}

/**
 * Sends a message from an iframe to its parent window.
 *
 * @template T Type of the message.
 * @param msg Message object containing type, data, and optional frameId.
 * @param origin Optional origin restriction (default "*").
 */
export function sendToParent<T extends keyof IframeToParentMap>(
    msg: { type: T; data: IframeToParentMap[T]; frameId?: string },
    origin: string = "*"
) {
    if (window.self === window.top) {
        console.warn("sendToParent: not inside an iframe");
        return;
    }
    window.parent.postMessage(msg, origin);
}

// ==============================
// Listeners for messages
// ==============================

/**
 * Listens for messages sent from one or multiple iframes.
 *
 * @param iframeRefs Map of frameId → iframe element.
 * @param handler Callback invoked with typed message and detected frameId.
 * @returns A function to remove the listener.
 */
export function listenFromIframes(
    iframeRefs: Record<string, HTMLIFrameElement | null>,
    handler: (msg: IframeToParentMessage, frameId?: string) => void
) {
    const listener = (ev: MessageEvent<IframeToParentMessage>) => {
        const msg = ev.data;
        if (!msg || typeof msg.type !== "string") return;

        let detectedFrameId: string | undefined;
        for (const [id, iframe] of Object.entries(iframeRefs)) {
            if (iframe?.contentWindow === ev.source) {
                detectedFrameId = id;
                break;
            }
        }
        if (!detectedFrameId && msg.frameId) detectedFrameId = msg.frameId;

        handler(msg, detectedFrameId);
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
}

/**
 * Listens for messages sent from parent → iframe.
 *
 * @param handler Callback invoked with typed message.
 * @returns A function to remove the listener.
 */
export function listenFromParent(handler: (msg: ParentToIframeMessage) => void) {
    const listener = (ev: MessageEvent<ParentToIframeMessage>) => {
        const msg = ev.data;
        if (!msg || typeof msg.type !== "string") return;
        handler(msg);
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
}

// ==============================
// Debug helper
// ==============================

/**
 * Logs a message to the console if `?debug=true` is present in the URL.
 *
 * @param message Message string to log.
 */
export function consoleOnDebugMode(message: string) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "true") {
        console.log(message);
    }
}
