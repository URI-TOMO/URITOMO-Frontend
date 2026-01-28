import { WSMessage, WSMessageType } from '../types';

type MessageHandler = (message: WSMessage) => void;

export class MeetingSocket {
    private socket: WebSocket | null = null;
    private url: string;
    private listeners: MessageHandler[] = [];
    private reconnectTimer: any = null;
    private isIntentionalClose = false;

    constructor(sessionId: string) {
        // Determine WebSocket URL based on environment or default
        const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://10.0.255.80:8000';
        const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
        const token = localStorage.getItem('uri-tomo-token');

        this.url = `${wsBaseUrl}/api/v1/meeting/${sessionId}?token=${token}`;
    }

    public connect() {
        if (this.socket) {
            if (this.socket.readyState === WebSocket.OPEN) return;
            this.socket.close();
        }

        this.isIntentionalClose = false;
        console.log(`🔌 Connecting to WebSocket: ${this.url}`);

        try {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                console.log('✅ WebSocket Connected');
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.socket.onmessage = (event) => {
                try {
                    const message: WSMessage = JSON.parse(event.data);
                    // console.log('📩 WS Message:', message);
                    this.notifyListeners(message);
                } catch (e) {
                    console.error('❌ Failed to parse WS message:', event.data);
                }
            };

            this.socket.onclose = (event) => {
                console.log(`🔌 WebSocket Closed: ${event.code} ${event.reason}`);
                if (!this.isIntentionalClose && event.code !== 1008) { // 1008 is Policy Violation (e.g. invalid session)
                    this.scheduleReconnect();
                }
            };

            this.socket.onerror = (error) => {
                console.error('❌ WebSocket Error:', error);
            };

        } catch (e) {
            console.error('❌ Exception creating WebSocket:', e);
            this.scheduleReconnect();
        }
    }

    public disconnect() {
        this.isIntentionalClose = true;
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    public send(type: WSMessageType, data?: any) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ Cannot send message, WebSocket not open');
            return;
        }

        const message = JSON.stringify({ type, ...data });
        this.socket.send(message);
    }

    public sendChat(text: string, lang: string = 'ja') {
        this.send('chat', { text, lang });
    }

    public onMessage(handler: MessageHandler) {
        this.listeners.push(handler);
        return () => {
            this.listeners = this.listeners.filter(h => h !== handler);
        };
    }

    private notifyListeners(message: WSMessage) {
        this.listeners.forEach(handler => handler(message));
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return;
        console.log('🔄 Scheduling reconnect in 3s...');
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 3000);
    }
}
