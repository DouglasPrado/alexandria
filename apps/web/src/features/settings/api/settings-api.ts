import { apiClient } from '@/lib/api-client';
import type { UpdateProfileRequest, UpdateProfileResponse } from '../types/settings.types';

export const settingsApi = {
  updateProfile: (data: UpdateProfileRequest): Promise<UpdateProfileResponse> =>
    apiClient.patch<UpdateProfileResponse>('/members/me', data),
};
