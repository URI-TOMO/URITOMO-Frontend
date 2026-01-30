import apiClient from './client';

export const profileApi = {
  getProfile: async () => {
    return apiClient.get('/user/me');
  },
  
  updateProfile: async (data: any) => {
    return apiClient.put('/user/profile', data);
  },
  
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
