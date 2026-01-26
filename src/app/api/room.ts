import apiClient from './client';
import { RoomDetailResponse, AddRoomMemberResponse } from './types';

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
};
