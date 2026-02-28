// lib/rooms.ts — Room utilities (client-safe)

export interface Room {
    id: string;
    room_id: string;
    title: string;
    topic: string;
    is_public: boolean;
    join_code: string;
    created_by: string;
    created_at: string;
}

/** Generate a random URL-friendly room slug (12 chars) */
export function generateRoomId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 12 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}

/** Generate a 6-char uppercase join code */
export function generateJoinCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit confusable chars
    return Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}
