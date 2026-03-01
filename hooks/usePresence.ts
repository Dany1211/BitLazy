import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function usePresence(sessionId: string, userId: string, userName?: string) {
    const [onlineUsers, setOnlineUsers] = useState<Map<string, { id: string, name: string, isTyping: boolean }>>(new Map())
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        let isMounted = true

        const room = supabase.channel(`presence-session-${sessionId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        })

        channelRef.current = room

        room
            .on('presence', { event: 'sync' }, () => {
                if (!isMounted) return
                const newState = room.presenceState()

                const activeMap = new Map<string, { id: string, name: string, isTyping: boolean }>()
                for (const state of Object.values(newState)) {
                    for (const presence of (state as any)) {
                        if (presence.user_id) {
                            activeMap.set(presence.user_id, {
                                id: presence.user_id,
                                name: presence.name || 'Anonymous',
                                isTyping: !!presence.isTyping
                            })
                        }
                    }
                }

                setOnlineUsers(activeMap)
                console.log('[Presence] Active Map updated:', Array.from(activeMap.entries()))
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && isMounted) {
                    await room.track({
                        user_id: userId,
                        name: userName || 'Anonymous',
                        isTyping: false,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            isMounted = false
            channelRef.current = null
            supabase.removeChannel(room)
        }
    }, [sessionId, userId, userName])

    const updatePresence = async (data: Partial<{ isTyping: boolean }>) => {
        console.log('[Presence] updatePresence called with:', data)
        if (channelRef.current) {
            await channelRef.current.track({
                user_id: userId,
                name: userName || 'Anonymous',
                online_at: new Date().toISOString(),
                ...data
            })
        }
    }

    const typingUsers = Array.from(onlineUsers.values())
        .filter(u => u.isTyping && u.id !== userId)

    return { onlineUsers, typingUsers, updatePresence }
}
