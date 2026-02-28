import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function usePresence(sessionId: string, userId: string) {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

    useEffect(() => {
        let isMounted = true

        // Create a dedicated presence channel per session
        const room = supabase.channel(`presence-session-${sessionId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        })

        room
            .on('presence', { event: 'sync' }, () => {
                if (!isMounted) return
                const newState = room.presenceState()

                const activeIds = new Set<string>()
                for (const state of Object.values(newState)) {
                    for (const presence of (state as unknown as Array<{ user_id: string }>)) {
                        if (presence.user_id) {
                            activeIds.add(presence.user_id)
                        }
                    }
                }

                setOnlineUsers(activeIds)
                console.log('[Presence] Sync: Online users:', Array.from(activeIds))
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('[Presence] Join:', key, newPresences)
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('[Presence] Leave:', key, leftPresences)
            })
            .subscribe(async (status) => {
                console.log('[Presence] Subscribe status:', status)
                if (status === 'SUBSCRIBED') {
                    // Register (track) them in the presence channel
                    const trackRes = await room.track({
                        user_id: userId,
                        online_at: new Date().toISOString(),
                    })
                    console.log('[Presence] Track response:', trackRes)
                }
            })

        return () => {
            isMounted = false
            supabase.removeChannel(room)
        }
    }, [sessionId, userId])

    // Ensure the current user is ALWAYS in the set on first render before sync happens
    const usersToReturn = new Set(onlineUsers)
    usersToReturn.add(userId)

    return { onlineUsers: usersToReturn }
}
