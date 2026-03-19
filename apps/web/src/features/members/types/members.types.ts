import { z } from "zod";

export const MemberSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  created_at: z.string(),
});
export type Member = z.infer<typeof MemberSchema>;

export const InviteResponseSchema = z.object({
  invite_token: z.string(),
});
export type InviteResponse = z.infer<typeof InviteResponseSchema>;
