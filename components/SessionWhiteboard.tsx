"use client";

import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues with canvas
const WhiteboardCanvas = dynamic(() => import("./WhiteboardCanvas"), { ssr: false });

interface Props {
    sessionId: string;
    username: string;
    isActive: boolean;
}

export default function SessionWhiteboard({ sessionId, username, isActive }: Props) {
    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <WhiteboardCanvas roomId={sessionId} username={username} isActive={isActive} />
        </div>
    );
}
