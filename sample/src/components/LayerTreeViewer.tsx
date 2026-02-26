import React, { useState } from "react";
import {
    JSONLayerTree,
    JSONLayerTreeNode,
    JSONLayerClass,
    JSONLayerGroup
} from "@library/JSONLayerTree";
import { sendToIframe } from "@library/index";

// --- Styled SVG Components ---
const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        width="16" height="16"
        style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }}
    >
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor" />
    </svg>
);

const VisibilityIcon = ({ visible }: { visible: boolean }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ cursor: 'pointer' }}>
        {visible ? (
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#4dabf7" />
        ) : (
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.74-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#868e96" />
        )}
    </svg>
);

const DeleteIcon = ({ enabled = true }: { enabled?: boolean }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ cursor: enabled ? 'pointer' : 'not-allowed' }}>
        <g fill="none" stroke={enabled ? "#ff6b6b" : "#495057"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
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

// --- Types ---
interface LayerTreeViewerProps {
    layerTree: JSONLayerTree;
    iframe?: React.RefObject<HTMLIFrameElement | null>;
}

interface TreeNodeProps {
    node: JSONLayerTreeNode;
    iframe?: React.RefObject<HTMLIFrameElement | null>;
    expandedIds: Set<string>;
    onToggleExpand: (id: string) => void;
}

// --- Main Component ---
export const LayerTreeViewer: React.FC<LayerTreeViewerProps> = ({ layerTree, iframe }) => {
    // We lift the expansion state here to control it globally
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Helper to find all group IDs in the tree
    const getAllGroupIds = (nodes: JSONLayerTreeNode[]): string[] => {
        let ids: string[] = [];
        nodes.forEach((node) => {
            if (node.className === JSONLayerClass.LayerGroup) {
                ids.push(node.id);
                if ((node as JSONLayerGroup).children) {
                    ids.push(...getAllGroupIds((node as JSONLayerGroup).children));
                }
            }
        });
        return ids;
    };

    const handleExpandAll = () => {
        const allIds = getAllGroupIds(layerTree.children);
        setExpandedIds(new Set(allIds));
    };

    const handleCollapseAll = () => {
        setExpandedIds(new Set());
    };

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toolbarButtonStyle: React.CSSProperties = {
        background: '#2c2e33',
        border: 'none',
        color: '#adb5bd',
        fontSize: '10px',
        padding: '4px 8px',
        borderRadius: '4px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontWeight: 600
    };

    return (
        <div style={{
            backgroundColor: '#1a1b1e',
            color: '#ced4da',
            borderRadius: '8px',
            padding: '12px',
            width: '300px',
            userSelect: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            height: '430px',
            overflowY: 'auto',
        }}>
            {/* Header Toolbar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid #373a40',
                paddingBottom: '8px'
            }}>
                <h4 style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#adb5bd',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>Layers</h4>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleExpandAll}
                        style={toolbarButtonStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#373a40'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c2e33'}
                    >
                        Expand
                    </button>
                    <button
                        onClick={handleCollapseAll}
                        style={toolbarButtonStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#373a40'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c2e33'}
                    >
                        Collapse
                    </button>
                </div>
            </div>

            {layerTree.children.map((node) => (
                <TreeNode
                    key={node.id}
                    node={node}
                    iframe={iframe}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                />
            ))}
        </div>
    );
};

// --- Sub-component ---
const TreeNode: React.FC<TreeNodeProps> = ({ node, iframe, expandedIds, onToggleExpand }) => {
    const isGroup = node.className === JSONLayerClass.LayerGroup;
    const isExpanded = expandedIds.has(node.id);

    const onDeleteLayer = (id: string) => {
        if (iframe?.current) {
            sendToIframe(iframe.current, {
                type: "RemoveLayer",
                data: { layerId: id },
            });
        }
    };

    const onZoomToLayer = (id: string) => {
        if (iframe?.current) {
            sendToIframe(iframe.current, {
                type: "ZoomToLayer",
                data: {
                    layerId: id,
                    animate: { duration: 500 }
                },
            });
        }
    }

    const onLayerVisibilityChange = (id: string, visible: boolean) => {
        if (iframe?.current) {
            sendToIframe(iframe.current, {
                type: "SetLayerVisibility",
                data: { layerId: id, visible },
            });
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
                onClick={() => isGroup && onToggleExpand(node.id)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: isGroup ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                    fontSize: '14px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c2e33'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title={node.className}
            >
                {/* Expander Spacer/Icon */}
                <div style={{ width: '20px', display: 'flex', alignItems: 'center' }}>
                    {isGroup && <ChevronIcon expanded={isExpanded} />}
                </div>

                {/* Label */}
                <span style={{
                    flex: 1,
                    fontWeight: isGroup ? 600 : 400,
                    color: node.visible ? '#fff' : '#5c5f66',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginRight: '8px'
                }}>
                    {node.label}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div onClick={(e) => { e.stopPropagation(); onDeleteLayer(node.id); }}
                        style={{ display: 'flex', alignItems: 'center', opacity: node.visible ? 1 : 0.6 }}>
                        <DeleteIcon enabled={true} />
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); onZoomToLayer(node.id); }}
                        style={{ display: 'flex', alignItems: 'center', opacity: node.visible ? 1 : 0.6 }}>
                        <ZoomIcon />
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); onLayerVisibilityChange(node.id, !node.visible); }}
                        style={{ display: 'flex', alignItems: 'center', opacity: node.visible ? 1 : 0.6 }}>
                        <VisibilityIcon visible={node.visible} />
                    </div>
                </div>
            </div>

            {/* Nested Children */}
            {isGroup && isExpanded && (
                <div style={{
                    marginLeft: '12px',
                    borderLeft: '1px solid #373a40',
                    paddingLeft: '4px'
                }}>
                    {(node as JSONLayerGroup).children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            iframe={iframe}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};