export interface UpdateProfileRequest {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  clusterId: string;
}
