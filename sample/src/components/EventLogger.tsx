import React, {useEffect, useRef} from "react";

export const EventLogger: React.FC<{ logs: string[] }> = ({ logs }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#1e1e1e',
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: '12px',
            height: '200px',
            overflowY: 'scroll',
            borderRadius: '4px',
            border: '1px solid #333'
        }} ref={scrollRef}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: '5px', paddingBottom: '2px', color: '#888' }}>
                Event Log (Latest at bottom)
            </div>
            {logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '2px' }}>
                    <span style={{ color: '#555' }}>[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
            ))}
        </div>
    );
};
