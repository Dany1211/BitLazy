"use client";

import { useEffect, useRef } from "react";

export interface Message {
    id: string;
    username: string;
    content: string;
    column_type: string;
    x_pos: number;
    y_pos: number;
    parent_id?: string;
    created_at: string;
}

interface MessageListProps {
    messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function formatTime(dateStr: string) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return (
        <div className="message-list">
            {messages.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            )}
            {messages.map((msg) => {
                const isAI = msg.username === "AI-Moderator";
                return (
                    <div
                        key={msg.id}
                        className={`message ${isAI ? "message-ai" : "message-user"}`}
                    >
                        <div className="message-header">
                            <span className={`username ${isAI ? "username-ai" : ""}`}>
                                {isAI ? "🤖 " : ""}
                                {msg.username}
                            </span>
                            <span className="timestamp">{formatTime(msg.created_at)}</span>
                        </div>
                        <div className="message-content">
                            {msg.content.split("\n").map((line, i) => (
                                <span key={i}>
                                    {line}
                                    {i < msg.content.split("\n").length - 1 && <br />}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
