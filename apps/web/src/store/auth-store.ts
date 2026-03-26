import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'reader';
  clusterId: string;
}

interface AuthState {
  member: AuthMember | null;
  isAuthenticated: boolean;
  setMember: (member: AuthMember) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      isAuthenticated: false,
      setMember: (member) => set({ member, isAuthenticated: true }),
      logout: () => set({ member: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      // Token NÃO é persistido — vive no cookie httpOnly.
      // Apenas dados do membro para condicionar UI client-side.
      partialize: (state) => ({
        member: state.member,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
