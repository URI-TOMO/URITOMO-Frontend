import { useState, useEffect, useRef } from 'react';
import { Send, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

/**
 * WebSocket チャットのテストページ
 * 
 * 使い方:
 * 1. バックエンドを起動: docker compose up -d
 * 2. デバッグAPIでセッションを作成: POST /api/v1/debug/all-in-one
 * 3. 返されたsession_idとtokenをこのページで入力
 * 4. 接続してチャットをテスト
 */
export function WebSocketChatTest() {
    const [sessionId, setSessionId] = useState('');
    const [token, setToken] = useState('');
    const [userName, setUserName] = useState('TestUser');
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<Array<{
        id: string;
        sender: string;
        text: string;
        timestamp: Date;
        isLocal?: boolean;
    }>>([]);
    const [inputText, setInputText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000/api/v1';

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const connect = () => {
        if (!sessionId) {
            setError('Session IDを入力してください');
            return;
        }

        setIsConnecting(true);
        setError(null);

        let wsUrl = `${BACKEND_WS_URL}/meeting/${sessionId}`;
        if (token) {
            wsUrl += `?token=${token}`;
        }

        console.log('[WebSocketTest] Connecting to:', wsUrl);

        try {
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('✅ WebSocket Connected');
                setConnected(true);
                setIsConnecting(false);
                setError(null);
                setMessages(prev => [...prev, {
                    id: `system_${Date.now()}`,
                    sender: 'System',
                    text: '接続しました',
                    timestamp: new Date()
                }]);
            };

            ws.current.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    console.log('📩 Received:', msg);

                    if (msg.type === 'chat' && msg.data) {
                        setMessages(prev => {
                            // Avoid duplicates
                            if (prev.some(m => m.id === msg.data.id)) {
                                return prev;
                            }
                            return [...prev, {
                                id: msg.data.id,
                                sender: msg.data.display_name || 'Unknown',
                                text: msg.data.text,
                                timestamp: new Date(msg.data.created_at)
                            }];
                        });
                    } else if (msg.type === 'session_connected') {
                        setMessages(prev => [...prev, {
                            id: `system_${Date.now()}`,
                            sender: 'System',
                            text: `セッション接続完了: ${JSON.stringify(msg.data)}`,
                            timestamp: new Date()
                        }]);
                    } else if (msg.type === 'error') {
                        setError(msg.message || 'Unknown error');
                    }
                } catch (e) {
                    console.error('Parse error:', e);
                }
            };

            ws.current.onclose = (event) => {
                console.log('❌ WebSocket Closed:', event.code, event.reason);
                setConnected(false);
                setIsConnecting(false);
                setMessages(prev => [...prev, {
                    id: `system_${Date.now()}`,
                    sender: 'System',
                    text: `切断されました (code: ${event.code})`,
                    timestamp: new Date()
                }]);
            };

            ws.current.onerror = (err) => {
                console.error('WebSocket error:', err);
                setError('接続エラー');
                setIsConnecting(false);
            };
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
            setError('WebSocket作成に失敗しました');
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        if (ws.current) {
            ws.current.close();
        }
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;

        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'chat',
                text: inputText,
                lang: 'ja'
            }));

            // Add local message (will be replaced by server broadcast)
            setMessages(prev => [...prev, {
                id: `local_${Date.now()}`,
                sender: userName,
                text: inputText,
                timestamp: new Date(),
                isLocal: true
            }]);

            setInputText('');
        } else {
            setError('WebSocketが接続されていません');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">
                    WebSocket チャット テスト
                </h1>

                {/* Connection Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">接続設定</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Session ID *
                            </label>
                            <Input
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                placeholder="ls_xxxxxx"
                                disabled={connected}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Token (任意)
                            </label>
                            <Input
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI..."
                                disabled={connected}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                表示名
                            </label>
                            <Input
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!connected ? (
                            <Button
                                onClick={connect}
                                disabled={isConnecting}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isConnecting ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        接続中...
                                    </>
                                ) : (
                                    <>
                                        <Wifi className="h-4 w-4 mr-2" />
                                        接続
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={disconnect}
                                variant="destructive"
                            >
                                <WifiOff className="h-4 w-4 mr-2" />
                                切断
                            </Button>
                        )}

                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-sm text-gray-600">
                                {connected ? '接続中' : '未接続'}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                        <strong>ヒント:</strong> バックエンドの <code>/debug/all-in-one</code> を呼び出すと、
                        テスト用のsession_idとtokenが生成されます。
                        <br />
                        <code className="text-xs">接続URL: {BACKEND_WS_URL}/meeting/[session_id]</code>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-800 px-4 py-3">
                        <h2 className="text-white font-semibold">チャット</h2>
                    </div>

                    <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                メッセージがありません
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'System' ? 'justify-center' : msg.isLocal ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.sender === 'System' ? (
                                            <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs">
                                                {msg.text}
                                            </div>
                                        ) : (
                                            <div className={`max-w-[70%] rounded-lg p-3 ${msg.isLocal
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border border-gray-200'
                                                }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold opacity-75">
                                                        {msg.sender}
                                                    </span>
                                                    <span className="text-xs opacity-50">
                                                        {msg.timestamp.toLocaleTimeString('ja-JP', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{msg.text}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200">
                        <div className="flex gap-2">
                            <Input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="メッセージを入力..."
                                disabled={!connected}
                                className="flex-1"
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={!connected || !inputText.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
