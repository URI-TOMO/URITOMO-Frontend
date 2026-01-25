import apiClient from './client';
import { MainDataResponse } from './types';

export const userApi = {
    /**
     * 메인 페이지에 필요한 모든 데이터를 가져옵니다.
     * (유저 정보, 친구 목록, 참가한 방 목록 등)
     */
    getMainData: async (): Promise<MainDataResponse> => {
        return apiClient.get('/user/main');
    },
};
