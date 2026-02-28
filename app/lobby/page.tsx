"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Room, generateRoomId, generateJoinCode } from "@/lib/rooms";
import { Plus, Hash, Globe, Lock, ArrowRight, Users, Search, Check, Copy } from "lucide-react";
import Link from "next/link";

export default function LobbyPage() {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState("");
    const [mounted, setMounted] = useState(false);

    const [view, setView] = useState<"home" | "create" | "join">("home");
    const [publicRooms, setPublicRooms] = useState<Room[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    const [newTitle, setNewTitle] = useState("");
    const [newTopic, setNewTopic] = useState("");
    const [newPublic, setNewPublic] = useState(false);
    const [creating, setCreating] = useState(false);

    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState("");
    const [joining, setJoining] = useState(false);

    const [searchQ, setSearchQ] = useState("");

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("chat_username");
        if (stored) setUsername(stored);
    }, []);

    useEffect(() => {
        if (view === "home" && username) fetchPublicRooms();
    }, [view, username]);

    async function fetchPublicRooms() {
        setLoadingRooms(true);
        const { data } = await supabase
            .from("rooms")
            .select("*")
            .eq("is_public", true)
            .order("created_at", { ascending: false })
            .limit(30);
        setPublicRooms(data ?? []);
        setLoadingRooms(false);
    }

    function handleLogin() {
        const name = nameInput.trim();
        if (!name) return;
        localStorage.setItem("chat_username", name);
        setUsername(name);
    }

    async function handleCreate() {
        if (!newTitle.trim() || creating) return;
        setCreating(true);
        const room_id = generateRoomId();
        const join_code = generateJoinCode();
        const { error } = await supabase.from("rooms").insert({
            room_id, title: newTitle.trim(), topic: newTopic.trim(),
            is_public: newPublic, join_code, created_by: username,
        });
        if (error) { console.error(error); setCreating(false); return; }
        router.push(`/room/${room_id}`);
    }

    async function handleJoin() {
        const code = joinCode.trim().toUpperCase();
        if (!code || joining) return;
        setJoining(true);
        setJoinError("");
        const { data } = await supabase.from("rooms").select("*").eq("join_code", code).single();
        if (!data) { setJoinError("No room found with that code."); setJoining(false); return; }
        router.push(`/room/${data.room_id}`);
    }

    const filtered = publicRooms.filter(
        (r) => r.title.toLowerCase().includes(searchQ.toLowerCase()) ||
            r.topic.toLowerCase().includes(searchQ.toLowerCase())
    );

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
                    <h1 className="login-h1">Welcome back</h1>
                    <p className="login-sub">Enter your name to access the reasoning platform.</p>
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
                            Continue →
                        </button>
                    </div>
                    <p className="login-footer">No account needed · Private by default</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lobby-shell">
            {/* Header */}
            <header className="app-header">
                <Link href="/" className="app-logo">
                    <div className="app-logo-mark">B</div>
                    BitLazy
                </Link>
                <div className="app-header-right">
                    <div className="user-pill">
                        <div className="user-avatar-sm">{username[0].toUpperCase()}</div>
                        {username}
                    </div>
                    <button className="app-leave-btn" onClick={() => { localStorage.removeItem("chat_username"); setUsername(null); }}>
                        Sign out
                    </button>
                </div>
            </header>

            <div className="lobby-body">
                {/* Sidebar */}
                <aside className="lobby-aside">
                    <div className="lobby-aside-label">Rooms</div>
                    {[
                        { id: "home", icon: <Globe size={14} />, label: "Discover" },
                        { id: "create", icon: <Plus size={14} />, label: "New Room" },
                        { id: "join", icon: <Hash size={14} />, label: "Join via Code" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            className={`lobby-nav-btn${view === item.id ? " active" : ""}`}
                            onClick={() => setView(item.id as typeof view)}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main */}
                <main className="lobby-main">

                    {/* Discover */}
                    {view === "home" && (
                        <div>
                            <div className="lobby-section-title">Public Rooms</div>
                            <div className="lobby-section-sub">Join an open discussion or create your own private room.</div>

                            <div className="lobby-search">
                                <Search size={14} className="lobby-search-icon" />
                                <input
                                    type="text"
                                    className="lobby-search-input"
                                    placeholder="Search rooms…"
                                    value={searchQ}
                                    onChange={(e) => setSearchQ(e.target.value)}
                                />
                            </div>

                            {loadingRooms ? (
                                <div style={{ padding: "24px 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>
                                    Loading rooms…
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="lobby-empty">
                                    <div className="lobby-empty-icon">🌐</div>
                                    <div className="lobby-empty-title">No public rooms yet</div>
                                    <div className="lobby-empty-sub">Be the first — create one below.</div>
                                    <button className="lobby-empty-btn" onClick={() => setView("create")}>
                                        <Plus size={13} /> Create a Room
                                    </button>
                                </div>
                            ) : (
                                <div className="lobby-room-grid">
                                    {filtered.map((room) => (
                                        <div key={room.room_id} className="room-card" onClick={() => router.push(`/room/${room.room_id}`)}>
                                            <div>
                                                <span className="room-card-label public">
                                                    <Globe size={9} /> Public
                                                </span>
                                            </div>
                                            <div className="room-card-title">{room.title}</div>
                                            {room.topic && <div className="room-card-topic">{room.topic}</div>}
                                            <div className="room-card-author">
                                                <Users size={10} /> by {room.created_by}
                                            </div>
                                            <button className="room-card-btn">
                                                Join <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Create */}
                    {view === "create" && (
                        <div>
                            <div className="lobby-section-title">Create a Room</div>
                            <div className="lobby-section-sub">Private rooms are invite-only. Public rooms appear in Discover.</div>

                            <div className="app-form">
                                <div className="form-group">
                                    <label className="form-label">Room Title <span style={{ color: "var(--color-red)" }}>*</span></label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. AI Ethics Debate"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        maxLength={60}
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Topic / Goal <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Should LLMs have rights?"
                                        value={newTopic}
                                        onChange={(e) => setNewTopic(e.target.value)}
                                        maxLength={120}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Visibility</label>
                                    <div className="vis-grid">
                                        <button className={`vis-option${!newPublic ? " active" : ""}`} onClick={() => setNewPublic(false)}>
                                            <Lock size={16} />
                                            Private
                                            <span className="vis-option-sub">Invite-only via code</span>
                                        </button>
                                        <button className={`vis-option${newPublic ? " active" : ""}`} onClick={() => setNewPublic(true)}>
                                            <Globe size={16} />
                                            Public
                                            <span className="vis-option-sub">Listed in Discover</span>
                                        </button>
                                    </div>
                                </div>

                                <button className="form-submit-btn" onClick={handleCreate} disabled={!newTitle.trim() || creating}>
                                    {creating ? <span className="spinner" /> : <><Plus size={14} /> Create Room</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Join */}
                    {view === "join" && (
                        <div>
                            <div className="lobby-section-title">Join via Code</div>
                            <div className="lobby-section-sub">Enter the 6-character code shared with you.</div>

                            <div className="app-form">
                                <div className="form-group">
                                    <label className="form-label">Join Code</label>
                                    <input
                                        type="text"
                                        className="form-input code-input"
                                        placeholder="XXXXXX"
                                        value={joinCode}
                                        onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                                        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                                {joinError && <p className="join-error">{joinError}</p>}
                                <button className="form-submit-btn" onClick={handleJoin} disabled={joinCode.length < 6 || joining}>
                                    {joining ? <span className="spinner" /> : <>Join Room <ArrowRight size={14} /></>}
                                </button>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
