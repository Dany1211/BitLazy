import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export type MessageType = 'claim' | 'evidence' | 'counterargument' | 'question' | 'synthesis'

export interface Message {
    id: string
    session_id: string
    user_id: string
    content: string
    type: MessageType
    created_at: string
    profiles?: {
        name: string
        avatar_url: string | null
    }
}

export function useRealtimeMessages(sessionId: string) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function fetchMessages() {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('messages')
                .select('*, profiles(name, avatar_url)')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })

            if (!error && data && isMounted) {
                setMessages(data as Message[])
            }
            if (isMounted) setIsLoading(false)
        }

        fetchMessages()

        const channel = supabase
            .channel(`realtime:session:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `session_id=eq.${sessionId}`,
                },
                async (payload) => {
                    // Fetch the profile for the new message since it won't be included in the INSERT payload
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('name, avatar_url')
                        .eq('id', payload.new.user_id)
                        .single()

                    const newMessage = {
                        ...payload.new,
                        profiles: profile || { name: 'Unknown User', avatar_url: null },
                    } as Message

                    setMessages((prev) => [...prev, newMessage])
                }
            )
            .subscribe()

        return () => {
            isMounted = false
            supabase.removeChannel(channel)
        }
    }, [sessionId])

    return { messages, isLoading }
}
