import apiClient from './client';
import { MainDataResponse, AddFriendRequest, AddFriendResponse, UserProfile, UpdateNicknameResponse } from './types';

export const userApi = {
    /**
     * 메인 페이지에 필요한 모든 데이터를 가져옵니다.
     * (유저 정보, 친구 목록, 참가한 방 목록 등)
     */
    getMainData: async (): Promise<MainDataResponse> => {
        return apiClient.get('/user/main');
    },

    /**
     * 이메일로 친구를 추가합니다.
     * @param email 추가할 친구의 이메일
     * @returns 추가된 친구의 정보 (이름, 이메일, 언어)
     */
    addFriend: async (email: string): Promise<AddFriendResponse> => {
        const payload: AddFriendRequest = { email };
        return apiClient.post('/user/friend/add', payload);
    },

    /**
     * 내 프로필 정보를 조회합니다.
     */
    getProfile: async (): Promise<UserProfile> => {
        return apiClient.get('/user/profile');
    },

    /**
     * 프로필 정보를 수정합니다.
     * @param data 수정할 데이터 (이름, 언어, 국가 등)
     */
    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        return apiClient.patch('/user/profile', data);
    },

    /**
     * 친구 닉네임 변경 API 호출
     * @param friendId - 친구의 ID
     * @param newNickname - 변경할 새 닉네임
     */
    updateFriendNickname: async (friendId: string, newNickname: string): Promise<UpdateNicknameResponse> => {
        const cleanId = friendId.trim();
        console.log(`[API] Updating nickname for friendId: '${cleanId}' with nickname: '${newNickname}'`);

        // New Spec: Request body must include friendId
        // Handle response wrapper (e.g. { success: true, data: { ... } })
        const response: any = await apiClient.patch(
            `/user/friend/${cleanId}/nickname`,
            {
                friendId: cleanId,
                nickname: newNickname
            }
        );

        // If response has a 'data' property with the actual payload
        if (response && response.data && response.data.nickname) {
            return response.data as UpdateNicknameResponse;
        }

        // Fallback: assume flat response
        return response as UpdateNicknameResponse;
    },

    /**
     * 친구 삭제 API 호출
     * @param friendId - 삭제할 친구의 ID
     */
    deleteFriend: async (friendId: string): Promise<void> => {
        const cleanId = friendId.trim();
        console.log(`[API] Deleting friendId: '${cleanId}'`);
        await apiClient.delete(
            `/user/friend/${cleanId}`
        );
    },
};
