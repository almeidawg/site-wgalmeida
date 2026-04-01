export const useAuthStore = () => ({
  user: null,
  session: null,
  loading: false,
  isAuthenticated: false,
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
});

export default useAuthStore;
