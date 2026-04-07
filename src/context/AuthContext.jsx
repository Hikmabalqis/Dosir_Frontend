import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentAdmin = authService.getCurrentAdmin();
    if (currentAdmin) {
      setAdmin(currentAdmin);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔍 AuthContext: Attempting login...', credentials.username);
      const data = await authService.login(credentials);
      console.log('✅ AuthContext: Login successful', data);
      setAdmin(data);
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error.response?.data);
      
      // ========== TANGKAP SEMUA ERROR INFO DARI BACKEND ==========
      const errorData = error.response?.data || {};
      
      return { 
        success: false, 
        error: errorData.message || 'Login gagal',
        errorType: errorData.errorType,           // ← TAMBAHKAN INI
        accountDisabled: errorData.accountDisabled // ← SUDAH ADA
      };
      // ===========================================================
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setAdmin(data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Register gagal' 
      };
    }
  };

  const logout = () => {
    authService.logout();
    setAdmin(null);
  };

  // Helper function to check if user is superadmin
  const isSuperAdmin = () => {
    return admin?.role === 'superadmin';
  };

  // Helper function to check if user is admin (any role)
  const isAdmin = () => {
    return admin?.role === 'admin' || admin?.role === 'superadmin';
  };

  const value = {
    admin,
    login,
    register,
    logout,
    isAuthenticated: !!admin,
    isSuperAdmin,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};