export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

export const setUser = (user: any): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): any => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const removeUser = (): void => {
  localStorage.removeItem('user');
};

export const logout = (): void => {
  removeToken();
  removeUser();
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
