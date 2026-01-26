
import apiClient from './client';

export const meetingApi = {
    /**
     * 라이브 세션 시작 알림 (LiveKit Room ID 및 Session ID 전달)
     * POST /meeting/{room_id}/live-sessions/{session_id}
     */
    startLiveSession: async (roomId: string, sessionId: string, token?: string) => {
        // 戻り値の型は any (null data expected including status)
        return apiClient.post(`/meeting/${roomId}/live-sessions/${sessionId}`, { token });
    },

    // 기존 meetingApi 메서드가 있다면 여기에 유지
};
