import { WSMessage, WSMessageType } from '../types';

type MessageHandler = (message: WSMessage) => void;

export class MeetingSocket {
    private socket: WebSocket | null = null;
    private url: string;
    private listeners: MessageHandler[] = [];
    private reconnectTimer: any = null;
    private isIntentionalClose = false;

    constructor(roomId: string, pathPrefix: string = '/meeting/') {
        // Determine WebSocket URL based on environment or default
        const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://10.0.255.80:8000';
        const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
        const tokenRaw = localStorage.getItem('uri-tomo-token');
        const token = (tokenRaw && tokenRaw !== 'null' && tokenRaw !== 'undefined') ? tokenRaw : '';

        this.url = `${wsBaseUrl}${pathPrefix}${roomId}`;
        if (token) {
            this.url += `?token=${token}`;
        }
        console.log('🔧 [MeetingSocket] URL:', this.url);
    }

    public connect() {
        if (this.socket) {
            if (this.socket.readyState === WebSocket.OPEN) return;

            // Clear handlers before closing
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;
            this.socket.close();
        }

        this.isIntentionalClose = false;

        const connectingLog = {
            type: 'WS_CONNECTING',
            url: this.url
        };
        console.log(`🔌 Connecting to WebSocket: ${this.url}`, connectingLog);

        if ((window as any).electron?.sendSignal) {
            (window as any).electron.sendSignal('log', connectingLog);
        }

        try {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                const openLog = {
                    type: 'WS_OPEN',
                    url: this.url
                };
                console.log('✅ WebSocket Connected', openLog);

                if ((window as any).electron?.sendSignal) {
                    (window as any).electron.sendSignal('log', openLog);
                }
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.socket.onmessage = (event) => {
                try {
                    const message: WSMessage = JSON.parse(event.data);

                    const logData = {
                        type: 'WS_RECEIVE',
                        url: this.url,
                        data: message
                    };

                    console.log('[WebSocket Log]', logData);

                    // Send to terminal if electron is available
                    if ((window as any).electron?.sendSignal) {
                        (window as any).electron.sendSignal('log', logData);
                    }

                    this.notifyListeners(message);
                } catch (e) {
                    console.error('❌ Failed to parse WS message:', event.data);
                }
            };

            this.socket.onclose = (event) => {
                const logData = {
                    type: 'WS_CLOSE',
                    url: this.url,
                    code: event.code,
                    reason: event.reason
                };
                console.log(`🔌 WebSocket Closed: ${event.code} ${event.reason}`, logData);

                if ((window as any).electron?.sendSignal) {
                    (window as any).electron.sendSignal('log', logData);
                }

                if (event.code === 4003 || event.code === 1008) {
                    console.error("❌ Authentication failed. Stopping reconnect.");
                    // Trigger a global event so the UI can react (e.g. show login modal)
                    window.dispatchEvent(new CustomEvent('auth-error', { detail: { source: 'websocket' } }));
                    return;
                }

                if (!this.isIntentionalClose) {
                    this.scheduleReconnect();
                }
            };

            this.socket.onerror = (error) => {
                console.error('❌ WebSocket Error:', error);
                if ((window as any).electron?.sendSignal) {
                    (window as any).electron.sendSignal('log', {
                        type: 'WS_ERROR',
                        url: this.url,
                        error: 'WebSocket Error'
                    });
                }
            };

        } catch (e) {
            console.error('❌ Exception creating WebSocket:', e);
            this.scheduleReconnect();
        }
    }

    public disconnect() {
        this.isIntentionalClose = true;
        if (this.socket) {
            // Prevent zombie events
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;

            this.socket.close();
            this.socket = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    public send(type: WSMessageType, data?: any) {
        const payload = { type, ...data };

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            const errorLog = {
                type: 'WS_SEND_FAILED',
                reason: 'WebSocket not open',
                state: this.socket?.readyState,
                url: this.url,
                data: payload
            };
            console.error('[WebSocket Log] FAILED_TO_SEND', errorLog);

            if ((window as any).electron?.sendSignal) {
                (window as any).electron.sendSignal('log', errorLog);
            }
            return;
        }

        const logData = {
            type: 'WS_SEND',
            url: this.url,
            data: payload
        };
        console.log('[WebSocket Log]', logData);

        if ((window as any).electron?.sendSignal) {
            (window as any).electron.sendSignal('log', logData);
        }

        const message = JSON.stringify(payload);
        this.socket.send(message);
    }

    public sendChat(text: string, lang: string = 'ko') {
        this.send('chat', { text, lang });
    }

    public sendSTT(text: string, lang: string, is_final: boolean) {
        this.send('stt', { text, lang, is_final });
    }

    public ping() {
        this.send('ping');
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
