import React, { useState } from "react";
import {
    JSONLayerTree,
    JSONLayerTreeNode,
    JSONLayerClass,
    JSONLayerGroup
} from "../../../src/JSONLayerTree";

// --- Styled SVG Components for a clean look ---
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

// const SearchIcon = () => (
//     <svg
//         viewBox="0 0 24 24"
//         width="18"
//         height="18"
//         style={{ cursor: "pointer" }}
//     >
//             <path
//                 d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
//                 fill="#fab005" /* Warm yellow/orange to contrast with the blue visibility eye */
//             />
//     </svg>
// );

const DeleteIcon = ({ enabled = true }: { enabled?: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        style={{ cursor: enabled ? 'pointer' : 'not-allowed' }}
    >
        <g
            fill="none"
            stroke={enabled ? "#ff6b6b" : "#495057"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Bin Body */}
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />

            {/* Vertical lines on the bin */}
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </g>
    </svg>
);

const ZoomIcon = ({ enabled = true }: { enabled?: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        style={{ cursor: enabled ? "pointer" : "not-allowed" }}
    >
        <g fill="none" stroke={enabled ? "#fab005" : "#495057"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Top Left Arrow */}
            <path d="M10 4H4v6M4 4l6 6" />
            {/* Top Right Arrow */}
            <path d="M14 4h6v6M20 4l-6 6" />
            {/* Bottom Left Arrow */}
            <path d="M10 20H4v-6M4 20l6-6" />
            {/* Bottom Right Arrow */}
            <path d="M14 20h6v-6M20 20l-6-6" />
        </g>
    </svg>
);

interface LayerTreeViewerProps {
    layerTree: JSONLayerTree;
    onLayerVisibilityChange?: (id: string, visible: boolean) => void;
    onLayerFit?: (id: string) => void;
    onDeleteLayer?: (id: string) => void;
}

interface TreeNodeProps {
    node: JSONLayerTreeNode
    onLayerVisibilityChange?: (id: string, visible: boolean) => void;
    onLayerFit?: (id: string) => void;
    onDeleteLayer?: (id: string) => void;
}

export const LayerTreeViewer: React.FC<LayerTreeViewerProps> = ({ layerTree, onLayerVisibilityChange, onLayerFit, onDeleteLayer }) => {
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
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '1px' }}>Layers</h4>
            {layerTree.children.map((node) => (
                <TreeNode key={node.id} node={node}
                          onLayerVisibilityChange={onLayerVisibilityChange}
                          onLayerFit={onLayerFit}
                          onDeleteLayer={onDeleteLayer}
                />
            ))}
        </div>
    );
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, onLayerVisibilityChange, onLayerFit, onDeleteLayer }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isGroup = node.className === JSONLayerClass.LayerGroup;

    const handleFitToLayer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof onLayerFit === "function") onLayerFit(node.id);
    };

    const handleDeleteLayer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof onDeleteLayer === "function") onDeleteLayer(node.id);
    };

    const handleToggleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof onLayerVisibilityChange === "function") onLayerVisibilityChange(node.id, !node.visible);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
                onClick={() => isGroup && setIsExpanded(!isExpanded)}
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
                    color: node.visible ? '#fff' : '#5c5f66'
                }}>
                    {node.label}
                </span>

                {/* Visibility Toggle Placeholder */}
                <div onClick={handleDeleteLayer} style={{ display: 'flex', alignItems: 'center', opacity: node.visible ? 1 : 0.6 }}>
                    <DeleteIcon enabled={true}  />
                </div>
                <div onClick={handleFitToLayer} style={{ display: 'flex', alignItems: 'center', opacity: node.visible ? 1 : 0.6 }}>
                    <ZoomIcon  />
                </div>
                <div onClick={handleToggleVisibility} style={{ display: 'flex', alignItems: 'center', opacity: node.visible ? 1 : 0.6 }}>
                    <VisibilityIcon visible={node.visible} />
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
                        <TreeNode key={child.id} node={child}
                                  onLayerVisibilityChange={onLayerVisibilityChange}
                                  onLayerFit={onLayerFit}
                                  onDeleteLayer={onDeleteLayer}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
