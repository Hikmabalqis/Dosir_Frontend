import axios from 'axios';

// Ambil API URL dari environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Debug: tampilkan di console
console.log('='.repeat(50));
console.log('🔧 API Configuration:');
console.log('- Environment:', process.env.NODE_ENV);
console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('- Final API_URL:', API_URL);
console.log('- Base URL:', `${API_URL}/api`);
console.log('='.repeat(50));

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor untuk handle error response
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    // ========== FIX: JANGAN REDIRECT UNTUK LOGIN ENDPOINT ==========
    if (error.response?.status === 401) {
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');
      const isRegisterEndpoint = error.config?.url?.includes('/auth/register');
      
      // Hanya redirect jika BUKAN dari login/register endpoint
      if (!isLoginEndpoint && !isRegisterEndpoint) {
        console.warn('🔒 Unauthorized - Token expired or invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        
        // Gunakan timeout agar tidak bentrok dengan React Router
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else {
        console.log('ℹ️ Login/Register failed - letting component handle the error');
      }
    }
    // ==============================================================
    
    return Promise.reject(error);
  }
);

export default api;