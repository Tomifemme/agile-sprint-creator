
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}
