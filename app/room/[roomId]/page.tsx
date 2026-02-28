"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Room } from "@/lib/rooms";
import ChatBox from "@/components/ChatBox";
import { Copy, Check, ArrowLeft, Globe, Lock } from "lucide-react";

export default function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>();
    const router = useRouter();

    const [username, setUsername] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState("");
    const [mounted, setMounted] = useState(false);
    const [room, setRoom] = useState<Room | null>(null);
    const [roomLoading, setRoomLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("chat_username");
        if (stored) setUsername(stored);
    }, []);

    useEffect(() => {
        if (!roomId) return;
        supabase
            .from("rooms")
            .select("*")
            .eq("room_id", roomId)
            .single()
            .then(({ data, error }) => {
                if (error || !data) setNotFound(true);
                else setRoom(data as Room);
                setRoomLoading(false);
            });
    }, [roomId]);

    function handleLogin() {
        const name = nameInput.trim();
        if (!name) return;
        localStorage.setItem("chat_username", name);
        setUsername(name);
    }

    async function copyCode() {
        if (!room) return;
        await navigator.clipboard.writeText(room.join_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (!mounted) return null;

    /* ── Login ── */
    if (!username) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="login-brand">
                        <div className="login-mark">B</div>
                        <span className="login-brand-name">BitLazy</span>
                    </div>
                    <h1 className="login-h1">Join Room</h1>
                    {room && <p className="login-sub">{room.title}</p>}
                    <div className="login-form">
                        <input
                            type="text"
                            className="login-input"
                            placeholder="Your name…"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            autoFocus
                            maxLength={32}
                        />
                        <button className="login-btn" onClick={handleLogin} disabled={!nameInput.trim()}>
                            Enter Room →
                        </button>
                    </div>
                    <p className="login-footer">No account needed · Private sessions</p>
                </div>
            </div>
        );
    }

    if (roomLoading) {
        return (
            <div className="room-loading-screen">
                <span className="lg-spinner" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="room-not-found">
                <div className="not-found-icon">🔍</div>
                <h2>Room not found</h2>
                <p>This room doesn&apos;t exist or the link is broken.</p>
                <button className="back-link-btn" onClick={() => router.push("/lobby")}>
                    <ArrowLeft size={13} /> Back to Lobby
                </button>
            </div>
        );
    }

    return (
        <div className="reasoning-board">
            {/* Header */}
            <header className="chat-header">
                <div className="header-left">
                    <button className="icon-back-btn" onClick={() => router.push("/lobby")} title="Back to lobby">
                        <ArrowLeft size={14} />
                    </button>
                    <div className="header-room-info">
                        <h1>{room?.title ?? "Room"}</h1>
                        {room?.topic && <span className="header-topic">{room.topic}</span>}
                    </div>
                </div>

                <div className="header-right">
                    <span className={`room-vis-badge ${room?.is_public ? "public" : "private"}`}>
                        {room?.is_public ? <Globe size={10} /> : <Lock size={10} />}
                        {room?.is_public ? "Public" : "Private"}
                    </span>

                    {room && (
                        <button className="share-code-btn" onClick={copyCode} title="Copy join code">
                            <span className="share-code-label">Code</span>
                            <span className="share-code-value">{room.join_code}</span>
                            {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                        </button>
                    )}

                    <div className="user-badge">
                        <div className="user-avatar">{username[0].toUpperCase()}</div>
                        {username}
                    </div>

                    <button className="logout-btn" onClick={() => { localStorage.removeItem("chat_username"); setUsername(null); }}>
                        Sign out
                    </button>
                </div>
            </header>

            <ChatBox username={username} roomId={roomId} />
        </div>
    );
}
