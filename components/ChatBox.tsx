"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import GraphView from "./GraphView";
import WhiteboardCanvas from "./WhiteboardCanvas";
import { Message } from "./MessageList";
import {
    FileText,
    FileSearch,
    MessageSquareX,
    HelpCircle,
    TrendingUp,
    MessageSquare,
    Share2,
    Palette,
    Send,
} from "lucide-react";

interface ChatBoxProps {
    username: string;
    roomId: string;
}

const CATEGORIES = [
    { id: "claim", label: "Claim", icon: FileText, color: "var(--claim)" },
    { id: "evidence", label: "Evidence", icon: FileSearch, color: "var(--evidence)" },
    { id: "counterargument", label: "Counter", icon: MessageSquareX, color: "var(--counter)" },
    { id: "question", label: "Question", icon: HelpCircle, color: "var(--question)" },
    { id: "synthesis", label: "Synthesis", icon: TrendingUp, color: "var(--synthesis)" },
];

type ViewMode = "chat" | "graph" | "whiteboard";

const VIEWS: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: "chat", icon: <MessageSquare size={14} />, label: "Chat" },
    { id: "graph", icon: <Share2 size={14} />, label: "Graph" },
    { id: "whiteboard", icon: <Palette size={14} />, label: "Whiteboard" },
];

function getInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBox({ username, roomId }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [activeCategory, setActiveCategory] = useState("claim");
    const [viewMode, setViewMode] = useState<ViewMode>("chat");
    const bottomRef = useRef<HTMLDivElement>(null);

    /* ── Auto-scroll ── */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ── Fetch initial messages ── */
    useEffect(() => {
        supabase
            .from("messages_test")
            .select("*")
            .eq("room_id", roomId)
            .order("created_at", { ascending: true })
            .then(({ data, error }) => {
                if (error) { console.error(error); return; }
                setMessages(data ?? []);
            });
    }, []);

    /* ── Real-time subscription ── */
    useEffect(() => {
        const ch = supabase
            .channel(`messages-realtime-${roomId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages_test", filter: `room_id=eq.${roomId}` },
                (payload) => {
                    const msg = payload.new as Message;
                    setMessages((prev) =>
                        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
                    );
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);

    /* ── Send handler ── */
    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;
        setSending(true);
        setInput("");

        try {
            const { data, error } = await supabase
                .from("messages_test")
                .insert({
                    username,
                    content: trimmed,
                    column_type: activeCategory,
                    room_id: roomId,
                    x_pos: Math.random() * 500 + 80,
                    y_pos: Math.random() * 300 + 80,
                })
                .select();

            if (error || !data?.length) {
                console.error("Insert error:", error);
                setSending(false);
                return;
            }

            fetch("/api/moderate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: trimmed,
                    parent_id: data[0].id,
                    username,
                    column_type: activeCategory,
                    room_id: roomId,
                }),
            }).catch(console.error);

        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    }, [input, sending, username, activeCategory, roomId]);

    const activeCat = CATEGORIES.find((c) => c.id === activeCategory)!;

    return (
        <div className="board-shell">
            {/* ── View toggle ── */}
            <div className="view-toggle">
                <div className="view-toggle-pills">
                    {VIEWS.map((v) => (
                        <button
                            key={v.id}
                            className={viewMode === v.id ? "active" : ""}
                            onClick={() => setViewMode(v.id)}
                        >
                            {v.icon}
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Main content ── */}
            <div className={`main-content ${viewMode}`}>

                {/* ── Chat feed ── */}
                {viewMode === "chat" && (
                    <div className="chat-feed">
                        {messages.length === 0 && (
                            <div className="feed-empty">
                                <div className="feed-empty-icon">💬</div>
                                <p>Be the first to share a thought.</p>
                                <span>Select a type below and start reasoning together.</span>
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isAI = msg.username === "AI-Moderator";
                            const isMine = msg.username === username && !isAI;
                            const cat = CATEGORIES.find((c) => c.id === msg.column_type);

                            return (
                                <div
                                    key={msg.id}
                                    className={`bubble-row ${isMine ? "mine" : "theirs"}`}
                                >
                                    {/* Avatar */}
                                    {!isMine && (
                                        <div
                                            className={`bubble-avatar ${isAI ? "bubble-avatar-ai" : ""}`}
                                            style={!isAI ? { background: stringToColor(msg.username) } : {}}
                                        >
                                            {isAI ? "🤖" : getInitials(msg.username)}
                                        </div>
                                    )}

                                    <div className={`bubble-group ${isMine ? "mine" : ""}`}>
                                        {/* Name + time */}
                                        <div className={`bubble-meta ${isMine ? "right" : "left"}`}>
                                            <span className="bubble-name">
                                                {isAI ? "AI Moderator" : msg.username}
                                            </span>
                                            <span className="bubble-time">{formatTime(msg.created_at)}</span>
                                        </div>

                                        {/* Bubble */}
                                        <div
                                            className={`bubble ${isMine ? "bubble-mine" : isAI ? "bubble-ai" : "bubble-other"}`}
                                        >
                                            {/* Category badge */}
                                            {cat && (
                                                <span
                                                    className="bubble-badge"
                                                    style={{ color: cat.color, borderColor: `color-mix(in srgb, ${cat.color} 30%, transparent)`, background: `color-mix(in srgb, ${cat.color} 10%, transparent)` }}
                                                >
                                                    <cat.icon size={10} strokeWidth={2.5} />
                                                    {cat.label}
                                                </span>
                                            )}
                                            <div className="bubble-content">
                                                {msg.content.split("\n").map((line, i) => (
                                                    <span key={i}>{line}{i < msg.content.split("\n").length - 1 && <br />}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Own avatar on right */}
                                    {isMine && (
                                        <div
                                            className="bubble-avatar"
                                            style={{ background: stringToColor(username) }}
                                        >
                                            {getInitials(username)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>
                )}

                {/* Graph */}
                {viewMode === "graph" && <GraphView messages={messages} />}

                {/* Whiteboard */}
                {viewMode === "whiteboard" && (
                    <WhiteboardCanvas roomId="default-room" username={username} />
                )}
            </div>

            {/* ── Input area ── */}
            {viewMode !== "whiteboard" && (
                <div className="input-area-board">
                    {/* Category pills */}
                    <div className="category-selection">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                className={`cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                                onClick={() => setActiveCategory(cat.id)}
                                style={activeCategory === cat.id
                                    ? {
                                        color: cat.color,
                                        borderColor: cat.color,
                                        backgroundColor: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
                                    }
                                    : {}
                                }
                            >
                                <cat.icon size={12} strokeWidth={2.5} />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Input row */}
                    <div className="input-row">
                        <div
                            className="input-type-dot"
                            style={{ background: activeCat.color }}
                        />
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={`Share a ${activeCat.label.toLowerCase()}…`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={sending}
                            maxLength={600}
                        />
                        <button
                            className="send-btn"
                            onClick={handleSend}
                            disabled={sending || !input.trim()}
                            aria-label="Send"
                        >
                            {sending
                                ? <span className="spinner" />
                                : <Send size={16} strokeWidth={2.5} />
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* Deterministic color from a string */
function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 52%)`;
}
