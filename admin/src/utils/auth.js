const ADMIN_TOKEN_KEY = 'govprep_admin_token';
const ADMIN_USER_KEY = 'govprep_admin_user';

export const getStoredToken = () => {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem('govprep_token');
};

export const setStoredAuth = (token, user) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  // also set general token for shared services
  localStorage.setItem('govprep_token', token);
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem(ADMIN_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem('govprep_token');
};
