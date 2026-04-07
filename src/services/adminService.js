import api from './api';

const adminService = {
  // Get all admins
  getAllAdmins: async () => {
    const response = await api.get('/admin');
    return response.data;
  },

  // Get single admin
  getAdminById: async (id) => {
    const response = await api.get(`/admin/${id}`);
    return response.data;
  },

  // Create new admin
  createAdmin: async (adminData) => {
    const response = await api.post('/admin', adminData);
    return response.data;
  },

  // Update admin
  updateAdmin: async (id, adminData) => {
    const response = await api.put(`/admin/${id}`, adminData);
    return response.data;
  },

  // Delete admin
  deleteAdmin: async (id) => {
    const response = await api.delete(`/admin/${id}`);
    return response.data;
  },

  // Toggle admin status
  toggleAdminStatus: async (id) => {
    const response = await api.patch(`/admin/${id}/toggle-status`);
    return response.data;
  }
};

export default adminService;