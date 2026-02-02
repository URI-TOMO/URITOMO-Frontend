import apiClient from './client';
import { RoomDetailResponse, AddRoomMemberResponse } from './types';

// Types for Room Chat
export interface RoomMessage {
    id: string;
    room_id: string;
    seq: number;
    sender_member_id: string | null;
    display_name: string;
    text: string;
    lang: string | null;
    translated_text: string | null;
    translated_lang: string | null;
    created_at: string;
}

export interface RoomMessagesResponse {
    messages: RoomMessage[];
    total: number;
    has_more: boolean;
}

export interface SendMessagePayload {
    text: string;
    lang?: string;
}

export interface SendMessageResponse {
    id: string;
    room_id: string;
    seq: number;
    text: string;
    lang: string;
    translated_text: string | null;
    translated_lang: string | null;
    created_at: string;
}

export const roomApi = {
    /**
     * 룸 상세 정보를 가져옵니다.
     * GET /rooms/{room_id}
     */
    getRoomDetail: async (roomId: string): Promise<RoomDetailResponse> => {
        return apiClient.get(`/rooms/${roomId}`);
    },

    /**
     * 룸에 새로운 멤버를 추가합니다.
     * POST /rooms/{room_id}/members
     */
    addMember: async (roomId: string, email: string): Promise<AddRoomMemberResponse> => {
        return apiClient.post(`/rooms/${roomId}/members`, { email });
    },

    /**
     * 룸 초대를 수락합니다.
     * POST /rooms/invite/{invite_id}/accept
     */
    acceptInvite: async (inviteId: string): Promise<{ message: string; room_id: string }> => {
        return apiClient.post(`/rooms/invite/${inviteId}/accept`, {});
    },

    /**
     * 룸 초대를 거절합니다.
     * POST /rooms/invite/{invite_id}/reject
     */
    rejectInvite: async (inviteId: string): Promise<{ message: string }> => {
        return apiClient.post(`/rooms/invite/${inviteId}/reject`, {});
    },

    /**
     * 룸의 채팅 메시지 기록을 가져옵니다.
     * GET /rooms/{room_id}/messages
     * @param roomId 룸 ID
     * @param limit 가져올 메시지 수 (기본: 50)
     * @param beforeSeq 페이지네이션: 이 seq 이전의 메시지를 가져옵니다
     */
    getMessages: async (
        roomId: string,
        limit: number = 50,
        beforeSeq?: number
    ): Promise<RoomMessagesResponse> => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (beforeSeq !== undefined) {
            params.append('before_seq', beforeSeq.toString());
        }
        return apiClient.get(`/rooms/${roomId}/messages?${params.toString()}`);
    },

    /**
     * 룸에 채팅 메시지를 전송합니다 (REST API).
     * POST /rooms/{room_id}/messages
     * WebSocket 연결 없이도 메시지를 전송할 수 있습니다.
     * @param roomId 룸 ID
     * @param text 메시지 내용
     * @param lang 메시지 언어 (Korean/Japanese)
     */
    sendMessage: async (
        roomId: string,
        text: string,
        lang: string = 'Korean'
    ): Promise<SendMessageResponse> => {
        const payload: SendMessagePayload = { text, lang };
        return apiClient.post(`/rooms/${roomId}/messages`, payload);
    },
};
