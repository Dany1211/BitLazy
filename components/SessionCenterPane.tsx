"use client";

import { useState } from "react";
import SessionChat from "./SessionChat";
import SessionWhiteboard from "./SessionWhiteboard";
import { MessageSquare, PenLine } from "lucide-react";

interface Props {
    sessionId: string;
    userId: string;
    username: string;
}

type Tab = "chat" | "whiteboard";

export default function SessionCenterPane({ sessionId, userId, username }: Props) {
    const [tab, setTab] = useState<Tab>("chat");

    return (
        <div className="flex-1 flex flex-col relative bg-white z-10 shadow-xl overflow-hidden">

            {/* ── Tab Bar ── */}
            <div className="flex items-center gap-1 px-4 border-b border-slate-100 bg-white shrink-0 h-12">
                <TabBtn
                    active={tab === "chat"}
                    onClick={() => setTab("chat")}
                    icon={<MessageSquare size={14} />}
                    label="Chat"
                />
                <TabBtn
                    active={tab === "whiteboard"}
                    onClick={() => setTab("whiteboard")}
                    icon={<PenLine size={14} />}
                    label="Whiteboard"
                />
            </div>

            {/* ── Panel ── */}
            <div className="flex-1 overflow-hidden relative">
                {/* Chat — always mounted, hidden when whiteboard is active */}
                <div
                    style={{
                        position: "absolute", inset: 0,
                        opacity: tab === "chat" ? 1 : 0,
                        pointerEvents: tab === "chat" ? "auto" : "none",
                        transition: "opacity 0.2s ease",
                    }}
                >
                    <SessionChat sessionId={sessionId} userId={userId} />
                </div>

                {/* Whiteboard — always mounted, hidden when chat is active */}
                <div
                    style={{
                        position: "absolute", inset: 0,
                        opacity: tab === "whiteboard" ? 1 : 0,
                        pointerEvents: tab === "whiteboard" ? "auto" : "none",
                        transition: "opacity 0.2s ease",
                    }}
                >
                    <SessionWhiteboard sessionId={sessionId} username={username} isActive={tab === "whiteboard"} />
                </div>
            </div>
        </div>
    );
}

function TabBtn({
    active, onClick, icon, label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                letterSpacing: "0.02em",
                transition: "all 0.15s",
                background: active ? "#0F172A" : "transparent",
                color: active ? "#34d399" : "#94a3b8",
                boxShadow: active ? "0 2px 8px rgba(15,23,42,0.18)" : "none",
            }}
        >
            {icon}
            {label}
        </button>
    );
}
