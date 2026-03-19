import { apiClient } from "@/services/api-client";
import type {
  LoginResponse,
  CreateClusterResponse,
  ValidateInviteResponse,
  AcceptInviteResponse,
} from "../types/auth.types";

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiClient.post("/api/v1/auth/login", { email, password });
}

export async function createCluster(data: {
  name: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}): Promise<CreateClusterResponse> {
  return apiClient.post("/api/v1/clusters", data);
}

export async function validateInvite(
  token: string,
): Promise<ValidateInviteResponse> {
  return apiClient.get(`/api/v1/invite/${token}/validate`);
}

export async function acceptInvite(
  token: string,
  data: {
    name: string;
    email: string;
    password: string;
  },
): Promise<AcceptInviteResponse> {
  return apiClient.post(`/api/v1/invite/${token}`, data);
}

export async function unlockMasterKey(
  seedPhrase: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.post("/api/v1/auth/unlock", { seed_phrase: seedPhrase });
}
