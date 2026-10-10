import { mockAllUsers } from '../data/users';

const AUTH_STORAGE_KEY = 'govprep_user';

/**
 * Retrieve current user from localStorage
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading auth state from localStorage:', err);
    return null;
  }
};

/**
 * Check if a session exists in localStorage
 */
export const isAuthenticated = () => {
  const user = getCurrentUser();
  return !!user && (user.role === 'USER' || user.role === 'ADMIN');
};

/**
 * Get the current active user role
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

/**
 * Save user to localStorage
 */
export const setStoredUser = (user) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

/**
 * Clear user from localStorage
 */
export const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('govprep_logged_in');
  localStorage.removeItem('govprep_token');
};

/**
 * Perform frontend mock authentication
 */
export const login = async (email, password, expectedRole) => {
  // Simulate network latency for authentic feel
  await new Promise((resolve) => setTimeout(resolve, 400));

  const cleanEmail = email.trim().toLowerCase();
  const cleanPw = password.trim();

  // Find user matching email, password and role
  const matchedUser = mockAllUsers.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail &&
      u.password === cleanPw &&
      u.role === expectedRole
  );

  if (matchedUser) {
    const authData = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      targetExam: matchedUser.targetExam,
      avatarUrl: matchedUser.avatarUrl,
      status: matchedUser.status,
      testsAttempted: matchedUser.testsAttempted,
      averageScore: matchedUser.averageScore,
      joinedDate: matchedUser.joinedDate,
    };

    setStoredUser(authData);
    return { success: true, user: authData };
  }

  return {
    success: false,
    error: 'Invalid email or password.',
  };
};
