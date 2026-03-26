import { useMutation } from '@tanstack/react-query';
import { settingsApi } from '../api/settings-api';
import type { UpdateProfileRequest } from '../types/settings.types';

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => settingsApi.updateProfile(data),
  });
}
