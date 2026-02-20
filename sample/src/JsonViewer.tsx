import React from "react";

export const JsonViewer: React.FC<{ data: any, title?: string }> = ({ data, title = "JSON Data Viewer" }) => {
    return (
        <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#2d2d2d', // Slightly different gray to distinguish from logs
            color: '#9cdcfe', // Light blue for property values
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '200px',
            overflow: 'auto',
            borderRadius: '4px',
            border: '1px solid #444'
        }}>
            <div style={{
                borderBottom: '1px solid #444',
                marginBottom: '8px',
                paddingBottom: '4px',
                color: '#ce9178', // Orange-ish for the title
                fontWeight: 'bold'
            }}>
                {title}
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
};
