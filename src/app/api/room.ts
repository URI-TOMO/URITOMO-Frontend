import apiClient from './client';
import { RoomDetailResponse } from './types';

export const roomApi = {
    /**
     * 룸 상세 정보를 가져옵니다.
     * GET /rooms/{room_id}
     */
    getRoomDetail: async (roomId: string): Promise<RoomDetailResponse> => {
        return apiClient.get(`/rooms/${roomId}`);
    },
};
