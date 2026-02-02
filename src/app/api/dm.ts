import apiClient from './client';

export interface DmThread {
    id: string;
    friend_id: string;
    friend_name?: string;
    created_at: string;
}

export interface DmMessage {
    id: string;
    thread_id: string;
    seq: number;
    sender_type: string;
    sender_user_id: string;
    display_name: string;
    text: string;
    created_at: string;
}

export const dmApi = {
    /**
     * Start or get existing DM thread with a friend
     */
    startDm: async (friendId: string): Promise<DmThread> => {
        // friend_id is a query parameter
        return apiClient.post(`/dm/start?friend_id=${friendId}`, {});
    },

    /**
     * Get messages for a thread
     */
    getMessages: async (threadId: string, limit = 50): Promise<{ messages: DmMessage[] }> => {
        return apiClient.get(`/dm/${threadId}/messages`, { params: { limit } });
    },

    /**
     * Send a message to a thread
     */
    sendMessage: async (threadId: string, text: string): Promise<{ message: DmMessage }> => {
        return apiClient.post(`/dm/${threadId}/messages`, { text });
    }
};
