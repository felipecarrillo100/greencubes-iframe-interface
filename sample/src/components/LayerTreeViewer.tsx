import React, { useState, useMemo, createContext, useContext } from "react";
import {
    JSONLayerTree,
    JSONLayerTreeNode,
    JSONLayerClass,
    JSONLayerGroup
} from "@library/JSONLayerTree";
import { sendToIframe } from "@library/index";

// --- Context for Performance and Cleanliness ---
interface LayerTreeContextProps {
    iframe?: React.RefObject<HTMLIFrameElement | null>;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    reverse: boolean;
}

const LayerTreeContext = createContext<LayerTreeContextProps | undefined>(undefined);

// --- SVG Icons (Optimized) ---
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg viewBox="0 0 24 24" width="14" height="14" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }}>
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor" />
    </svg>
);

const VisibilityIcon = ({ visible }: { visible: boolean }) => (
    <svg viewBox="0 0 24 24" width="16" height="16" style={{ cursor: 'pointer' }}>
        {visible ? (
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#4dabf7" />
        ) : (
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.74-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#868e96" />
        )}
    </svg>
);

const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" style={{ cursor: 'pointer' }}>
        <g fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </g>
    </svg>
);

const ZoomIcon = ({ enabled = true }: { enabled?: boolean }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ cursor: enabled ? "pointer" : "not-allowed" }}>
        <g fill="none" stroke={enabled ? "#fab005" : "#495057"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 4H4v6M4 4l6 6" /><path d="M14 4h6v6M20 4l-6 6" />
            <path d="M10 20H4v-6M4 20l6-6" /><path d="M14 20h6v-6M20 20l-6-6" />
        </g>
    </svg>
);

// --- Utilities ---
const getAllGroupIds = (nodes: JSONLayerTreeNode[]): string[] => {
    let ids: string[] = [];
    nodes.forEach((node) => {
        if (node.className === JSONLayerClass.LayerGroup) {
            ids.push(node.id);
            const group = node as JSONLayerGroup;
            if (group.children) ids.push(...getAllGroupIds(group.children));
        }
    });
    return ids;
};

// --- Actions Hook ---
const useLayerActions = (iframe?: React.RefObject<HTMLIFrameElement | null>) => {
    return useMemo(() => ({
        onDeleteLayer: (id: string) => iframe?.current && sendToIframe(iframe.current, { type: "RemoveLayer", data: { layerId: id } }),
        onZoomToLayer: (id: string) => iframe?.current && sendToIframe(iframe.current, { type: "ZoomToLayer", data: { layerId: id, animate: { duration: 500 } } }),
        onLayerVisibilityChange: (id: string, visible: boolean) => iframe?.current && sendToIframe(iframe.current, { type: "SetLayerVisibility", data: { layerId: id, visible } })
    }), [iframe]);
};

// --- Types ---
interface LayerTreeViewerProps {
    layerTree: JSONLayerTree;
    iframe?: React.RefObject<HTMLIFrameElement | null>;
    reverse?: boolean;
}

interface LayerTreeContextProps {
    iframe?: React.RefObject<HTMLIFrameElement | null>;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    reverse: boolean;
}

// --- Main Component ---
export const LayerTreeViewer: React.FC<LayerTreeViewerProps> = ({ layerTree, iframe, reverse = false }) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const contextValue = useMemo(() => ({
        iframe,
        expandedIds,
        toggleExpand: (id: string) => setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        }),
        reverse
    }), [iframe, expandedIds, reverse]);

    const rootNodes = useMemo(() => reverse ? [...layerTree.children] : [...layerTree.children].reverse(), [layerTree.children, reverse]);

    return (
        <LayerTreeContext.Provider value={contextValue}>
            <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#1a1b1e', // Dark theme consistent with screenshot
                color: '#ced4da',
                fontFamily: 'monospace',
                fontSize: '12px',
                height: '412px', // Matches the height of JsonViewer + margin + EventLog approx.
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '4px',
                border: '1px solid #444',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #444',
                    marginBottom: '8px',
                    paddingBottom: '4px',
                    color: '#ce9178',
                    fontWeight: 'bold',
                    flexShrink: 0
                }}>
                    <span>LAYERS</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setExpandedIds(new Set(getAllGroupIds(layerTree.children)))} style={btnStyle}>EXPAND</button>
                        <button onClick={() => setExpandedIds(new Set())} style={btnStyle}>COLLAPSE</button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    {rootNodes.map(node => <TreeNode key={node.id} node={node} />)}
                </div>
            </div>
        </LayerTreeContext.Provider>
    );
};

const btnStyle: React.CSSProperties = {
    background: '#333', border: '1px solid #555', color: '#ccc', fontSize: '9px', padding: '2px 5px', borderRadius: '2px', cursor: 'pointer'
};

const TreeNode: React.FC<{ node: JSONLayerTreeNode }> = ({ node }) => {
    const context = useContext(LayerTreeContext);
    if (!context) return null;
    const { expandedIds, toggleExpand, iframe, reverse } = context;
    const { onDeleteLayer, onZoomToLayer, onLayerVisibilityChange } = useLayerActions(iframe);

    const isGroup = node.className === JSONLayerClass.LayerGroup;
    const isExpanded = expandedIds.has(node.id);
    const childNodes = useMemo(() => isGroup ? (reverse ? [...(node as JSONLayerGroup).children] : [...(node as JSONLayerGroup).children].reverse()) : [], [node, isGroup, reverse]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
                display: 'flex', alignItems: 'center', padding: '3px 0',
                opacity: node.visible ? 1 : 0.5,
                cursor: isGroup ? 'pointer' : 'default'
            }} onClick={() => isGroup && toggleExpand(node.id)}>
                <div style={{ width: '16px', display: 'flex', alignItems: 'center', color: '#888' }}>
                    {isGroup && <ChevronIcon expanded={isExpanded} />}
                </div>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '5px' }}>
                    {node.label}
                </span>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <div onClick={(e) => { e.stopPropagation(); onDeleteLayer(node.id); }}><DeleteIcon /></div>
                    <div onClick={(e) => { e.stopPropagation(); onZoomToLayer(node.id); }}><ZoomIcon /></div>
                    <div onClick={(e) => { e.stopPropagation(); onLayerVisibilityChange(node.id, !node.visible); }}><VisibilityIcon visible={node.visible} /></div>
                </div>
            </div>
            {isGroup && isExpanded && (
                <div style={{ marginLeft: '12px', borderLeft: '1px solid #333', paddingLeft: '4px' }}>
                    {childNodes.map(child => <TreeNode key={child.id} node={child} />)}
                </div>
            )}
        </div>
    );
};