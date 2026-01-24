import { useEffect, useRef, useState, useCallback } from 'react';

// WebSocketから受信するチャットメッセージの型
export interface WSChatMessage {
    id: string;
    room_id: string;
    seq: number;
    sender_member_id: string;
    display_name: string;
    text: string;
    lang: string;
    created_at: string;
}

// ローカルで使用するチャットメッセージの型（UI表示用）
export interface ChatMessage {
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
    isAI?: boolean;
    isFromServer?: boolean;
}

interface UseMeetingChatOptions {
    sessionId: string;
    roomId: string;
    token?: string;  // オプショナル（開発用）
    userName: string;
    enabled?: boolean;  // WebSocket接続を有効にするか
}

export function useMeetingChat({
    sessionId,
    roomId,
    token = '',
    userName,
    enabled = true
}: UseMeetingChatOptions) {
    const ws = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    // バックエンドのURLを環境変数から取得
    const BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000/api/v1';

    const connect = useCallback(() => {
        if (!enabled || !sessionId) {
            console.log('[MeetingChat] WebSocket disabled or no sessionId');
            return;
        }

        // WebSocket URLの構築
        let wsUrl = `${BACKEND_WS_URL}/meeting/${sessionId}`;
        const params = new URLSearchParams();
        if (token) params.append('token', token);
        if (roomId) params.append('room_id', roomId);

        if (params.toString()) {
            wsUrl += `?${params.toString()}`;
        }

        console.log('[MeetingChat] Connecting to:', wsUrl);

        try {
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('✅ MeetingChat WebSocket Connected');
                setConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
            };

            ws.current.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    console.log('📩 WS Message:', msg);

                    switch (msg.type) {
                        case 'session_connected':
                            console.log('🎉 Session connected:', msg.data);
                            break;

                        case 'chat':
                            if (msg.data) {
                                const wsMsg = msg.data as WSChatMessage;
                                // WebSocketメッセージをローカル形式に変換
                                const chatMsg: ChatMessage = {
                                    id: wsMsg.id,
                                    sender: wsMsg.display_name || 'Unknown',
                                    message: wsMsg.text,
                                    timestamp: new Date(wsMsg.created_at),
                                    isFromServer: true
                                };
                                setMessages(prev => {
                                    // 重複チェック（同じIDのメッセージがあれば追加しない）
                                    if (prev.some(m => m.id === chatMsg.id)) {
                                        return prev;
                                    }
                                    return [...prev, chatMsg];
                                });
                            }
                            break;

                        case 'error':
                            console.error('❌ WS Error:', msg.message);
                            setError(msg.message || 'Unknown error');
                            break;

                        case 'pong':
                            console.log('🏓 Pong received');
                            break;
                    }
                } catch (e) {
                    console.error('Failed to parse WS message:', e);
                }
            };

            ws.current.onclose = (event) => {
                console.log('❌ WebSocket Disconnected:', event.code, event.reason);
                setConnected(false);

                // 自動再接続
                if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`[MeetingChat] Reconnecting in ${delay}ms...`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                }
            };

            ws.current.onerror = (err) => {
                console.error('WebSocket error:', err);
                setError('WebSocket connection error');
            };
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
            setError('Failed to create WebSocket connection');
        }
    }, [enabled, sessionId, roomId, token, BACKEND_WS_URL]);

    // 接続管理
    useEffect(() => {
        connect();

        // Pingを送信して接続を維持
        const pingInterval = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [connect]);

    // チャットメッセージ送信
    const sendMessage = useCallback((text: string, lang = 'ja') => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'chat',
                text,
                lang
            }));

            // ローカルにも追加（楽観的更新）
            // サーバーからブロードキャストされた時に重複チェックで弾かれる
            const localMsg: ChatMessage = {
                id: `local_${Date.now()}`,
                sender: userName,
                message: text,
                timestamp: new Date(),
                isFromServer: false
            };
            setMessages(prev => [...prev, localMsg]);
        } else {
            console.warn('WebSocket is not connected. Cannot send message.');
            // オフライン時はローカルにのみ追加
            const localMsg: ChatMessage = {
                id: `offline_${Date.now()}`,
                sender: userName,
                message: text,
                timestamp: new Date(),
                isFromServer: false
            };
            setMessages(prev => [...prev, localMsg]);
        }
    }, [userName]);

    // ローカルメッセージ追加（ファイル添付など）
    const addLocalMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const localMsg: ChatMessage = {
            ...message,
            id: `local_${Date.now()}`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, localMsg]);
    }, []);

    return {
        connected,
        error,
        messages,
        setMessages,
        sendMessage,
        addLocalMessage
    };
}
