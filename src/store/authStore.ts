import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  username: string | null
  setTokens: (access: string, refresh: string, username: string) => void
  setAccessToken: (access: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      username: null,
      setTokens: (access, refresh, username) =>
        set({ accessToken: access, refreshToken: refresh, username }),
      setAccessToken: (access) => set({ accessToken: access }),
      logout: () => set({ accessToken: null, refreshToken: null, username: null }),
    }),
    {
      name: 'ravid-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
