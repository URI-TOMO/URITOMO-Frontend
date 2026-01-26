import apiClient from '../api/client';
import { StartSessionResponse } from './types';

// API endpoints for meeting
export const meetingApi = {
    /**
     * Start a live session for a room
     * POST /meeting/{room_id}/live-sessions
     */
    startLiveSession: async (roomId: string): Promise<StartSessionResponse> => {
        return apiClient.post<any, StartSessionResponse>(`/meeting/${roomId}/live-sessions`);
    }
};
