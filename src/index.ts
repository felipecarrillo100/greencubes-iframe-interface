// Shared contract between iframe and parent
// Import your common Feature type if you already have one
import type { Feature, FeatureId } from "@luciad/ria/model/feature/Feature.js";
import {MapNavigatorAnimationOptions} from "@luciad/ria/view/MapNavigator";

// ==============================
// Base message type
// ==============================

/**
 * Generic message format for communication between parent and iframe.
 *
 * @template T Message type string
 * @template D Message data payload type
 */
export interface BaseMessage<T extends string, D> {
    /** Type discriminator */
    type: T;

    /** Data payload */
    data: D;

    /** Optional identifier when multiple iframes are used */
    frameId?: string;
}

// ==============================
// Iframe → Parent messages
// ==============================

/**
 * Messages that can be sent from iframe → parent window.
 */
export type IframeToParentMessage =
    | BaseMessage<"LayerTreeChange", { layerId: string; type: "NodeAdded" | "NodeRemoved" | "NodeMoved" }>
    | BaseMessage<"ClickedItem", { feature: Feature }>
    | BaseMessage<"SelectedItems", { features: Feature[] }>
    | BaseMessage<"Ready", {targetLayerId?: string}>
    | BaseMessage<"Error", { message: string }>;

// ==============================
// Parent → Iframe messages
// ==============================

/**
 * Messages that can be sent from parent → iframe.
 */
export type ParentToIframeMessage =
    | BaseMessage<"HighlightFeature", { featureId: FeatureId }>
    | BaseMessage<"SelectFeatures", { featureIds: FeatureId[] }>
    | BaseMessage<"RemoveLayer", { layerId?: string}>
    | BaseMessage<"ZoomToSelection", { featureIds: FeatureId[]; animate?: boolean | MapNavigatorAnimationOptions | undefined }>
    | BaseMessage<"ZoomToLayer", { layerId?: string; animate?: boolean | MapNavigatorAnimationOptions | undefined }>;

// ==============================
// Union type (all directions)
// ==============================

/**
 * Union of all iframe ↔ parent messages.
 */
export type IframeMessage = IframeToParentMessage | ParentToIframeMessage;

/**
 * Helper to extract the `data` payload type by message `type`.
 */
export type ExtractData<M extends IframeMessage["type"]> =
    Extract<IframeMessage, { type: M }>["data"];

// ==============================
// Parent side helpers
// ==============================

/**
 * Send a message to a specific iframe element.
 *
 * @param iframeEl Target iframe element
 * @param msg Message to send
 * @param origin Origin restriction (default: "*")
 */
export function sendToIframe<M extends ParentToIframeMessage["type"]>(
    iframeEl: HTMLIFrameElement,
    msg: {
        type: M;
        data: Extract<ParentToIframeMessage, { type: M }>["data"];
        frameId?: string;
    },
    origin: string = "*"
) {
    if (!iframeEl.contentWindow) {
        console.warn("sendToIframe: iframe has no contentWindow");
        return;
    }
    iframeEl.contentWindow.postMessage(msg, origin);
}

/**
 * Listen for messages from one or multiple iframes.
 *
 * @param iframeRefs Map of `{ frameId → iframeEl }`
 * @param handler Callback invoked with typed message and detected `frameId`
 * @returns Cleanup function to remove the event listener
 */
export function listenFromIframes(
    iframeRefs: Record<string, HTMLIFrameElement | null>,
    handler: (msg: IframeToParentMessage, sourceFrameId?: string) => void
) {
    function listener(ev: MessageEvent<IframeToParentMessage>) {
        const msg = ev.data;
        if (!msg || typeof msg.type !== "string") return;

        // Try to detect which iframe sent this
        let detectedFrameId: string | undefined;
        for (const [frameId, iframeEl] of Object.entries(iframeRefs)) {
            if (iframeEl && iframeEl.contentWindow === ev.source) {
                detectedFrameId = frameId;
                break;
            }
        }
        if (msg.frameId && !detectedFrameId) {
            detectedFrameId = msg.frameId;
        }

        handler(msg, detectedFrameId);
    }

    window.addEventListener("message", listener);

    return () => window.removeEventListener("message", listener);
}

// ==============================
// Iframe side helpers
// ==============================

/**
 * Send a message from iframe → parent.
 *
 * @param msg Message to send
 * @param origin Origin restriction (default: "*")
 */
export function sendToParent<M extends IframeToParentMessage["type"]>(
    msg: {
        type: M;
        data: Extract<IframeToParentMessage, { type: M }>["data"];
        frameId?: string;
    },
    origin: string = "*"
) {
    if (window.self === window.top) {
        console.warn("sendToParent: not inside iframe");
        return;
    }
    window.parent?.postMessage(msg, origin);
}

/**
 * Listen for messages sent from parent → iframe.
 *
 * @param handler Callback invoked with typed message
 * @returns Cleanup function to remove the event listener
 */
export function listenFromParent(
    handler: (msg: ParentToIframeMessage) => void
) {
    function listener(ev: MessageEvent<ParentToIframeMessage>) {
        const msg = ev.data;
        if (!msg || typeof msg.type !== "string") return;
        handler(msg);
    }

    window.addEventListener("message", listener);

    return () => window.removeEventListener("message", listener);
}

/**
 * Log a message to console if `?debug=true` is present in URL.
 *
 * @param message Message to log
 */
export function consoleOnDebugMode(message: string) {
    const params = new URLSearchParams(window.location.search);
    const debug = params.get("debug") || null;
    if (debug === "true") {
        console.log(message);
    }
}
