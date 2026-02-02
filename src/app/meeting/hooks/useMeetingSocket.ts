import { useState, useEffect, useRef, useCallback } from 'react';
import { MeetingSocket } from '../websocket/client';
import { meetingApi } from '../api';
import { ChatMessage, WSMessage } from '../types';
import { toast } from 'sonner';
import { roomApi } from '../../api/room';

interface UseMeetingSocketProps {
    roomId: string; // This might be used as roomId or sessionId
    userName: string;
}

// Get current user ID from localStorage
function getCurrentUserId(): string | null {
    try {
        const profile = localStorage.getItem('uri-tomo-user-id');
        if (profile) return profile;

        // Fallback: try to get from user profile
        const userProfile = localStorage.getItem('uri-tomo-user-profile');
        if (userProfile) {
            const parsed = JSON.parse(userProfile);
            return parsed.id || null;
        }
    } catch (e) {
        console.error('Failed to get user ID:', e);
    }
    return null;
}

export function useMeetingSocket({ roomId, userName }: UseMeetingSocketProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<MeetingSocket | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const currentUserId = getCurrentUserId();

    // Clear messages when roomId changes
    useEffect(() => {
        console.log('🔄 [useMeetingSocket] Room changed, clearing messages. New roomId:', roomId);
        setMessages([]);
        setIsConnected(false);
    }, [roomId]);

    // Load chat history on mount
    useEffect(() => {
        if (!roomId) return;

        const loadHistory = async () => {
            console.log('📜 [useMeetingSocket] Loading chat history for room:', roomId);
            try {
                const response = await roomApi.getMessages(roomId, 50);
                console.log('📜 [useMeetingSocket] History loaded:', response.messages.length, 'messages');

                // Convert to ChatMessage format with isMe detection
                const historyMessages: ChatMessage[] = response.messages.map(msg => ({
                    id: msg.id,
                    room_id: msg.room_id,
                    seq: msg.seq,
                    sender_member_id: msg.sender_member_id,
                    display_name: msg.display_name,
                    text: msg.text,
                    lang: msg.lang ?? null,
                    translated_text: msg.translated_text ?? null,
                    translated_lang: msg.translated_lang ?? null,
                    created_at: msg.created_at,
                    // Check if sender_member_id contains current user ID
                    isMe: msg.display_name === userName
                }));

                setMessages(historyMessages);
            } catch (e: any) {
                console.error('❌ [useMeetingSocket] Failed to load history:', e);
                // 404 is expected if no messages exist yet - don't block WebSocket connection
                if (e?.response?.status === 404) {
                    console.log('📭 [useMeetingSocket] No chat history found (404), starting fresh');
                }
                // Clear messages on error to ensure clean state
                setMessages([]);
            }
        };

        loadHistory();
    }, [roomId, userName]);

    // Initialize WebSocket
    useEffect(() => {
        let mounted = true;
        let socket: MeetingSocket | null = null;

        const initSession = async () => {
            if (!roomId) {
                console.log('⚠️ [useMeetingSocket] No roomId provided, skipping connection');
                return;
            }

            console.log('🚀 [useMeetingSocket] Initializing WebSocket for room:', roomId);

            try {
                // Connect WebSocket directly using roomId
                socket = new MeetingSocket(roomId);
                socketRef.current = socket;
                socket.connect();

                // Listen for messages
                socket.onMessage((msg: WSMessage) => {
                    console.log('📨 [useMeetingSocket] Received message:', msg.type, msg);

                    if (msg.type === 'room_connected') {
                        console.log('✅ [useMeetingSocket] Connected to room');
                        setIsConnected(true);
                        // Toast notification removed - silent connection
                    } else if (msg.type === 'chat') {
                        const data = msg.data;
                        console.log('💬 [useMeetingSocket] Chat message:', data);
                        // Convert to ChatMessage format
                        const chatMsg: ChatMessage = {
                            id: data.id,
                            room_id: data.room_id,
                            seq: data.seq,
                            sender_member_id: data.sender_member_id,
                            display_name: data.display_name,
                            text: data.text,
                            lang: data.lang ?? null,
                            translated_text: data.translated_text ?? null,
                            translated_lang: data.translated_lang ?? null,
                            created_at: data.created_at,
                            // Use display_name comparison for isMe (backend sends the sender's display name)
                            isMe: data.display_name === userName
                        };

                        // Check if message already exists (from our own send) to avoid duplicates
                        setMessages(prev => {
                            const exists = prev.some(m => m.id === chatMsg.id);
                            if (exists) {
                                console.log('⏭️ [useMeetingSocket] Skipping duplicate message:', chatMsg.id);
                                return prev;
                            }
                            return [...prev, chatMsg];
                        });
                    } else if (msg.type === 'translation') {
                        const data = msg.data;
                        console.log('🌐 [useMeetingSocket] Translation:', data);
                        const originalText = data?.original_text || data?.Original || data?.original || '';
                        const translatedText = data?.translated_text || data?.translated || '';
                        const translatedLang = data?.translated_lang || data?.target_lang || null;
                        if (!originalText || !translatedText) return;
                        // Handle translation logic...
                        setMessages(prev => {
                            const newMessages = [...prev];
                            for (let i = newMessages.length - 1; i >= 0; i--) {
                                if (newMessages[i].text === originalText && !newMessages[i].translated_text) {
                                    newMessages[i] = {
                                        ...newMessages[i],
                                        translated_text: translatedText,
                                        translated_lang: translatedLang
                                    };
                                    return newMessages;
                                }
                            }
                            return prev;
                        });
                    }
                });

            } catch (e) {
                console.error('❌ [useMeetingSocket] Failed to init session:', e);
                toast.error('サーバー接続に失敗しました');
            }
        };

        initSession();

        return () => {
            mounted = false;
            if (socket) {
                console.log('🔌 [useMeetingSocket] Disconnecting WebSocket');
                socket.disconnect();
            }
        };
    }, [roomId, userName]);

    const sendMessage = useCallback((text: string) => {
        if (socketRef.current) {
            // Determine language (mock for now, ideally detected or user setting)
            socketRef.current.sendChat(text, 'auto');
        }
    }, []);

    return {
        messages,
        isConnected,
        sendMessage,
        sessionId
    };
}
