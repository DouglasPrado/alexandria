import { z } from "zod";

export const MemberInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  cluster_id: z.string().uuid(),
});
export type MemberInfo = z.infer<typeof MemberInfoSchema>;

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  member: MemberInfoSchema,
  expires_in: z.number(),
  master_key_status: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const CreateClusterResponseSchema = z.object({
  cluster_id: z.string(),
  crypto_cluster_id: z.string(),
  seed_phrase: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
});
export type CreateClusterResponse = z.infer<typeof CreateClusterResponseSchema>;

export const ValidateInviteResponseSchema = z.object({
  valid: z.boolean(),
  cluster_name: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});
export type ValidateInviteResponse = z.infer<typeof ValidateInviteResponseSchema>;

export const AcceptInviteResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  member: MemberInfoSchema,
  expires_in: z.number(),
});
export type AcceptInviteResponse = z.infer<typeof AcceptInviteResponseSchema>;
