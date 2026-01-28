
import apiClient from './client';
import { UserProfile } from './types';

export const profileApi = {
    /**
     * 내 프로필 정보를 조회합니다.
     */
    getProfile: async (): Promise<UserProfile> => {
        // user.ts already implements this as apiClient.get('/user/profile'), 
        // using that for consistency if possible, but duplicating for now.
        return apiClient.get('/user/profile');
    },

    /**
     * 프로필 정보를 수정합니다.
     */
    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        return apiClient.patch('/user/profile', data);
    },

    /**
     * 프로필 이미지를 업로드합니다.
     * Note: This might not be supported by backend yet (Emoji only spec),
     * but strictly required by ProfileSettings.tsx to compile.
     */
    uploadProfileImage: async (file: File): Promise<UserProfile> => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/user/profile/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};
