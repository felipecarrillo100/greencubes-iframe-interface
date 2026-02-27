// src/index.ts
import { JSONFeature, JSONFeatureId } from "./JSONFeature";
import {InitialMapSetup, MapModeType, AddLayerOptions, MoveLayerOptions} from "./interfaces";
import { JSONLayerTree } from "./JSONLayerTree";

export * from "./interfaces";
export * from "./JSONFeature";
export * from "./JSONLayerTree";

/**
 * Serializable version of Luciad MapNavigatorAnimationOptions
 */
export interface MapNavigatorAnimationOptions {
    /** Duration in milliseconds */
    duration?: number;
}


/**
 * Base message type for communication between parent and iframe.
 *
 * @template T The message type.
 * @template D The shape of the data payload.
 */
export interface BaseMessage<T, D> {
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

export type LayerTreeChangedEventType = "NodeAdded" | "NodeRemoved" | "NodeMoved";

/**
 * Message types that can be sent from an iframe to the parent window.
 */
export enum IframeToParentMsg {
    ProjectionChanged = "ProjectionChanged",
    TargetGroupChanged = "TargetGroupChanged",
    LayerTreeChanged = "LayerTreeChanged",
    LayerTreeVisibilityChanged = "LayerTreeVisibilityChanged",
    ClickedItem = "ClickedItem",
    SelectionChanged = "SelectionChanged",
    onMapReady = "onMapReady",
    Error = "Error",
}

/**
 * Messages that can be sent from an iframe to the parent window.
 */
export type IframeToParentMessage =
    | BaseMessage<IframeToParentMsg.ProjectionChanged, { mode: MapModeType }>
    | BaseMessage<IframeToParentMsg.TargetGroupChanged, { targetGroupId: string, mode: MapModeType }>
    | BaseMessage<IframeToParentMsg.LayerTreeChanged, { layerId: string; type: LayerTreeChangedEventType, layerTree: JSONLayerTree }>
    | BaseMessage<IframeToParentMsg.LayerTreeVisibilityChanged, { layerTree: JSONLayerTree }>
    | BaseMessage<IframeToParentMsg.ClickedItem, { feature: JSONFeature, layerId: string }>
    | BaseMessage<IframeToParentMsg.SelectionChanged, { selectedItems: {[key:string]: JSONFeature[]}}>
    | BaseMessage<IframeToParentMsg.onMapReady, { mode: MapModeType }>
    | BaseMessage<IframeToParentMsg.Error, { message: string }>;

// ==============================
// Messages sent from Parent → Iframe
// ==============================

/**
 * Message types that can be sent from the parent window to an iframe.
 */
export enum ParentToIframeMsg {
    SetInitialMapSetup = "SetInitialMapSetup",
    SetLayerGroup = "SetLayerGroup",
    SetLayerVisibility = "SetLayerVisibility",
    SetProjection = "SetProjection",
    SelectFeature = "SelectFeature",
    SelectFeatures = "SelectFeatures",
    RemoveLayer = "RemoveLayer",
    ZoomToSelection = "ZoomToSelection",
    ZoomToLayer = "ZoomToLayer",
    AddLayer = "AddLayer",
    MoveLayer = "MoveLayer",
}

/**
 * Messages that can be sent from the parent window to an iframe.
 */
export type ParentToIframeMessage =
    | BaseMessage<ParentToIframeMsg.SetInitialMapSetup, { settings: InitialMapSetup }>
    | BaseMessage<ParentToIframeMsg.SetLayerGroup, { targetGroupId: string, mode?: MapModeType }>
    | BaseMessage<ParentToIframeMsg.SetLayerVisibility, { layerId: string, visible: boolean }>
    | BaseMessage<ParentToIframeMsg.SetProjection, { mode: MapModeType }>
    | BaseMessage<ParentToIframeMsg.SelectFeature, { featureId: JSONFeatureId, layerId?: string }>
    | BaseMessage<ParentToIframeMsg.SelectFeatures, { featureIds: JSONFeatureId[], layerId?: string }>
    | BaseMessage<ParentToIframeMsg.RemoveLayer, { layerId?: string }>
    | BaseMessage<ParentToIframeMsg.ZoomToSelection, { featureIds: JSONFeatureId[]; animate?: boolean | MapNavigatorAnimationOptions, layerId?: string }>
    | BaseMessage<ParentToIframeMsg.ZoomToLayer, { layerId?: string; animate?: boolean | MapNavigatorAnimationOptions }>
    | BaseMessage<ParentToIframeMsg.MoveLayer, { options: MoveLayerOptions}>
    | BaseMessage<ParentToIframeMsg.AddLayer, { options: AddLayerOptions }>;

// ==============================
// Type maps for strict autocomplete
// ==============================

/** Map of Iframe → Parent message types to their data payloads */
type IframeToParentMap = { [M in IframeToParentMessage as M["type"] & (string | number | symbol)]: M["data"] };

/** Map of Parent → Iframe message types to their data payloads */
type ParentToIframeMap = { [M in ParentToIframeMessage as M["type"] & (string | number | symbol)]: M["data"] };

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
 * Logs a message to the console if `? debug = true` is present in the URL.
 *
 * @param message Message string to log.
 */
export function consoleOnDebugMode(message: string) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "true") {
        console.log(message);
    }
}
