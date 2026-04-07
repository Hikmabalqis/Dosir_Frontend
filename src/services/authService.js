import API from './api';

const authService = {
  // Register admin baru
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
  },

  // Get current admin
  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  // Get admin from localStorage
  getCurrentAdmin: () => {
    const admin = localStorage.getItem('admin');
    return admin ? JSON.parse(admin) : null;
  },

  // Check if logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;