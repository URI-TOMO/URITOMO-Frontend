import apiClient from './client';
import { MainDataResponse, AddFriendRequest, AddFriendResponse, UserProfile } from './types';

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


};
