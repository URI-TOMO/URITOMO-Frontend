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
    sender_member_id: string | null;
    display_name: string;
    text: string;
    lang?: string | null;
    created_at: string;
    // UI extended properties
    isMe?: boolean;
    translated_text?: string | null;
    translated_lang?: string | null;
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
    // Optional fields for STT translations
    message_type?: 'chat' | 'stt';
    original_text?: string;
    translated_text?: string;
    source_lang?: string;
    target_lang?: string;
    is_stt?: boolean;
}

// WebSocket Message Types
export type WSMessageType = 'chat' | 'room_connected' | 'translation' | 'ping' | 'pong' | 'error' | 'stt' | 'unknown_type' | 'explanation';

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
