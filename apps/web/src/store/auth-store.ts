import { create } from 'zustand';

interface AuthMember {
  id: string;
  name: string;
  email: string;
  role: string;
  clusterId: string;
}

interface AuthState {
  member: AuthMember | null;
  isAuthenticated: boolean;
  setMember: (member: AuthMember) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  member: null,
  isAuthenticated: false,
  setMember: (member) => set({ member, isAuthenticated: true }),
  logout: () => set({ member: null, isAuthenticated: false }),
}));
