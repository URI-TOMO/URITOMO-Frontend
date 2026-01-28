export interface Room {
    id: string;
    name: string;
}

export interface Participant {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
}

export interface ChatMessage {
    id: string;
    room_id: string;
    seq: number;
    sender_member_id: string;
    display_name: string;
    text: string;
    lang: string;
    created_at: string;
    // UI extended properties
    isMe?: boolean;
    translated?: string;
}

export interface TranslationEvent {
    room_id: string;
    participant_id: string;
    participant_name: string;
    Original: string;
    translated: string;
    timestamp: string;
    sequence: string;
    lang: string;
}

// WebSocket Message Types
export type WSMessageType = 'chat' | 'room_connected' | 'translation' | 'ping' | 'pong' | 'error';

export interface WSMessage {
    type: WSMessageType;
    data?: any;
    message?: string; // for error
}

export interface WSChatMessage extends WSMessage {
    type: 'chat';
    text: string;
    lang: string;
}

export interface LiveSession {
    id: string;
    room_id: string;
    title: string;
    status: string;
    started_by: string;
    started_at: string;
    ended_at?: string;
}

export interface StartSessionResponse {
    status: string;
    data: {
        session: LiveSession;
    };
}
