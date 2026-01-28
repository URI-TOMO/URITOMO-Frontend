import { useEffect, useRef, useState, useCallback } from 'react';

// メッセージタイプ定義
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

export interface TranslationResult {
    original_text: string;
    translated_text: string;
    source_lang: string;
    target_lang: string;
    explanation?: string;
}

export interface SummaryResult {
    summary_id?: string;
    content: string;
    action_items: string[];
    key_decisions: string[];
    from_seq: number;
    to_seq: number;
    created_at: string;
}

interface WSMessage {
    type: 'session_connected' | 'chat' | 'translation' | 'summary' | 'error' | 'pong';
    data?: WSChatMessage | TranslationResult | SummaryResult | any;
    message?: string;
}

export function useUritomoWebSocket(sessionId: string, roomId: string, token: string) {
    const ws = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [chatMessages, setChatMessages] = useState<WSChatMessage[]>([]);
    const [translations, setTranslations] = useState<TranslationResult[]>([]);
    const [latestSummary, setLatestSummary] = useState<SummaryResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // バックエンドのURLを環境変数から取得 (デフォルトはlocalhost)
    const BACKEND_URL = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000/api/v1';

    useEffect(() => {
        if (!sessionId || !token) return;

        // WebSocket URLの構築
        // sessionIdが既に "ls_" などのプレフィックスを含んでいる前提
        const wsUrl = `${BACKEND_URL}/meeting/${sessionId}?token=${token}&room_id=${roomId}`;
        console.log('[WS] Connecting to:', wsUrl);

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('✅ URITOMO WebSocket Connected');
            setConnected(true);
            setError(null);
        };

        ws.current.onmessage = (event) => {
            try {
                const msg: WSMessage = JSON.parse(event.data);
                console.log('📩 WS Message:', msg);

                switch (msg.type) {
                    case 'session_connected':
                        console.log('🎉 Session connected:', msg.data);
                        break;

                    case 'chat':
                        if (msg.data) {
                            setChatMessages(prev => [...prev, msg.data as WSChatMessage]);
                        }
                        break;

                    case 'translation':
                        if (msg.data) {
                            setTranslations(prev => [...prev, msg.data as TranslationResult]);
                        }
                        break;

                    case 'summary':
                        if (msg.data) {
                            setLatestSummary(msg.data as SummaryResult);
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
        };

        ws.current.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError('WebSocket connection error');
        };

        // Pingを送信して接続を維持
        const pingInterval = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [sessionId, roomId, token, BACKEND_URL]);

    // チャット送信
    const sendChat = useCallback((text: string, lang = 'ja') => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'chat',
                text,
                lang
            }));
        } else {
            console.warn('WebSocket is not connected. Cannot send chat.');
        }
    }, []);

    // 翻訳リクエスト
    const requestTranslation = useCallback((
        text: string,
        sourceLang: string,
        targetLang: string
    ) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'translation',
                text,
                source_lang: sourceLang,
                target_lang: targetLang
            }));
        }
    }, []);

    // 要約リクエスト
    const requestSummary = useCallback((fromSeq = 0, toSeq?: number) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'summary',
                action: 'generate',
                from_seq: fromSeq,
                to_seq: toSeq
            }));
        }
    }, []);

    return {
        connected,
        error,
        chatMessages,
        translations,
        latestSummary,
        sendChat,
        requestTranslation,
        requestSummary
    };
}
