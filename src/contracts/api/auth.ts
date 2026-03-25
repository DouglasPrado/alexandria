import type { MemberRole } from '../enums/member-role';

/** POST /api/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  member: {
    id: string;
    name: string;
    email: string;
    role: MemberRole;
    clusterId: string;
  };
  accessToken: string;
}

/** POST /api/auth/refresh */
export interface RefreshResponse {
  accessToken: string;
}
