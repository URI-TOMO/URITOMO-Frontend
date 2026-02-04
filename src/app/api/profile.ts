import apiClient from './client';
import { UserProfile } from './types';

export const profileApi = {
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
     * 프로필 이미지를 업로드합니다.
     * @param file 업로드할 이미지 파일
     */
    uploadProfileImage: async (file: File): Promise<{ picture: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/user/profile/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};
