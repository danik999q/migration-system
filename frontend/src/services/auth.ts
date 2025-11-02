const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
}

export const authService = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string, user: User): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: (): User | null => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  isAdmin: (): boolean => {
    const user = authService.getUser();
    return user?.role === 'admin';
  },
};

