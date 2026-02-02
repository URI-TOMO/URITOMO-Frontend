import { useState, useEffect, useRef, useCallback } from 'react';
import { MeetingSocket } from '../../meeting/websocket/client';
import { DmMessage, dmApi } from '../../api/dm';
import { toast } from 'sonner';

interface UseDmSocketProps {
    threadId: string;
    currentUserId: string;
}

export function useDmSocket({ threadId, currentUserId }: UseDmSocketProps) {
    const [messages, setMessages] = useState<DmMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<MeetingSocket | null>(null);

    // Initial load and WebSocket connection
    useEffect(() => {
        if (!threadId) return;

        // 1. Load History
        const loadHistory = async () => {
            try {
                const res = await dmApi.getMessages(threadId);
                setMessages(res.messages);
            } catch (e) {
                console.error("Failed to load generic messages", e);
            }
        };
        loadHistory();

        // 2. Connect WebSocket
        // Using Generic MeetingSocket but pointing to DM endpoint logic would be complex
        // because MeetingSocket class in client.ts hardcodes /meeting/ws/...
        // We need to modify MeetingSocket or create a DmSocket class.
        // For now, let's look at MeetingSocket class.
    }, [threadId]);

    // ...
}
