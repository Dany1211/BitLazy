import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AIScore } from '@/lib/metricsEngine'

export type MessageType = 'claim' | 'evidence' | 'counterargument' | 'question' | 'synthesis' | 'vote_answer'

export interface Message {
    id: string
    session_id: string
    user_id: string
    content: string
    type: MessageType
    created_at: string
    is_ai?: boolean
    profiles?: {
        name: string
        avatar_url: string | null
    }
}

export function useRealtimeMessages(sessionId: string) {
    const [messages, setMessages] = useState<Message[]>([])
    const [scores, setScores] = useState<AIScore[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function fetchInitialData() {
            setIsLoading(true)

            // Fetch messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*, profiles(name, avatar_url)')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })

            // Fetch scores for those messages
            const msgIds = (messagesData || []).map(m => m.id)
            let scoresData: AIScore[] = []
            if (msgIds.length > 0) {
                const { data: sData } = await supabase
                    .from('ai_scores')
                    .select('*')
                    .in('message_id', msgIds)
                if (sData) scoresData = sData as AIScore[]
            }

            if (!messagesError && messagesData && isMounted) {
                setMessages(messagesData as Message[])
                setScores(scoresData)
            }
            if (isMounted) setIsLoading(false)
        }

        fetchInitialData()

        const msgChannel = supabase
            .channel(`messages_channel_${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `session_id=eq.${sessionId}`,
                },
                async (payload) => {
                    console.log('Realtime received message:', payload)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('name, avatar_url')
                        .eq('id', payload.new.user_id)
                        .single()

                    const newMessage = {
                        ...payload.new,
                        profiles: profile || { name: 'Unknown User', avatar_url: null },
                    } as Message

                    setMessages((prev) => {
                        const exists = prev.find((m) => m.id === newMessage.id)
                        if (exists) return prev
                        return [...prev, newMessage]
                    })
                }
            )
            .subscribe((status) => {
                console.log('Messages channel status:', status)
            })

        const scoreChannel = supabase
            .channel(`scores_channel_${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ai_scores',
                },
                (payload) => {
                    console.log('Realtime received score:', payload)
                    setMessages(currentMessages => {
                        const belongsToSession = currentMessages.some(m => m.id === payload.new.message_id)
                        if (belongsToSession) {
                            setScores(prev => {
                                const exists = prev.find(s => s.id === payload.new.id)
                                if (exists) return prev
                                return [...prev, payload.new as AIScore]
                            })
                        }
                        return currentMessages
                    })
                }
            )
            .subscribe((status) => {
                console.log('Scores channel status:', status)
            })

        return () => {
            isMounted = false
            supabase.removeChannel(msgChannel)
            supabase.removeChannel(scoreChannel)
        }
    }, [sessionId])

    return { messages, scores, isLoading }
}
