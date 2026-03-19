import { apiClient } from "@/services/api-client";
import type { Member, InviteResponse } from "../types/members.types";

export async function getMembers(clusterId: string): Promise<Member[]> {
  return apiClient.get(`/api/v1/clusters/${clusterId}/members`);
}

export async function inviteMember(
  clusterId: string,
  data: { email: string; role: string },
): Promise<InviteResponse> {
  return apiClient.post(`/api/v1/clusters/${clusterId}/invite`, data);
}

export async function removeMember(clusterId: string, memberId: string): Promise<void> {
  return apiClient.delete(`/api/v1/clusters/${clusterId}/members/${memberId}`);
}
