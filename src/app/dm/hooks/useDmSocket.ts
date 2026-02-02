import { useState, useEffect, useRef, useCallback } from 'react';
import { MeetingSocket } from '../../meeting/websocket/client';
import { DmMessage, dmApi } from '../../api/dm';
import { toast } from 'sonner';

interface UseDmSocketProps {
    threadId: string;
    currentUserId: string | null;
}

export interface UiDmMessage extends DmMessage {
    isMe: boolean;
}

export function useDmSocket({ threadId, currentUserId }: UseDmSocketProps) {
    const [messages, setMessages] = useState<UiDmMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<MeetingSocket | null>(null);

    // Load History
    const loadHistory = useCallback(async () => {
        if (!threadId || !currentUserId) return;
        try {
            const res = await dmApi.getMessages(threadId);
            const uiMessages = res.messages.map(m => ({
                ...m,
                isMe: m.sender_user_id === currentUserId
            }));
            setMessages(uiMessages);
        } catch (e) {
            console.error("Failed to load DM history", e);
        }
    }, [threadId, currentUserId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // WebSocket
    useEffect(() => {
        if (!threadId || !currentUserId) return;

        console.log('🔗 [useDmSocket] Connecting to', threadId);

        // Pass '/dm/ws/' as prefix
        const socket = new MeetingSocket(threadId, '/dm/ws/');
        socketRef.current = socket;

        socket.connect();

        socket.onMessage((msg: any) => {
            console.log('📨 [useDmSocket] Received:', msg);
            if (msg.type === 'room_connected') {
                setIsConnected(true);
            } else if (msg.type === 'dm.chat') {
                const data = msg.data;
                const uiMsg: UiDmMessage = {
                    ...data,
                    isMe: data.sender_user_id === currentUserId
                };
                setMessages(prev => {
                    // Prevent duplicates
                    if (prev.find(m => m.id === uiMsg.id)) return prev;
                    return [...prev, uiMsg];
                });
            }
        });

        return () => {
            console.log('🔌 [useDmSocket] Disconnecting');
            socket.disconnect();
            setIsConnected(false);
        };

    }, [threadId, currentUserId]);

    const sendMessage = async (text: string) => {
        if (!threadId) return;
        try {
            await dmApi.sendMessage(threadId, text);
            // No need to manually add to messages, WebSocket will broadcast it back
        } catch (e) {
            toast.error("Failed to send message");
            console.error(e);
        }
    };

    return { messages, sendMessage, isConnected, loadHistory };
}
