import API from './api';

const dokumenService = {
  // Get all dokumen with optional filters
  getAllDokumen: async (params = {}) => {
    const response = await API.get('/dokumen', { params });
    return response.data;
  },

  // Get dokumen by ID
  getDokumenById: async (id) => {
    const response = await API.get(`/dokumen/${id}`);
    return response.data;
  },

  // Create new dokumen
  createDokumen: async (dokumenData) => {
    const response = await API.post('/dokumen', dokumenData);
    return response.data;
  },

  // Update dokumen
  updateDokumen: async (id, dokumenData) => {
    const response = await API.put(`/dokumen/${id}`, dokumenData);
    return response.data;
  },

  // Delete dokumen
  deleteDokumen: async (id) => {
    const response = await API.delete(`/dokumen/${id}`);
    return response.data;
  },

  // Check duplicate
  checkDuplicate: async (data) => {
    const response = await API.post('/dokumen/check-duplicate', data);
    return response.data;
  },

  // Update peminjaman
  updatePeminjaman: async (id, data) => {
    const response = await API.put(`/dokumen/${id}/peminjaman`, data);
    return response.data;
  },

  // Get dokumen by box
  getDokumenByBox: async (boxId) => {
    const response = await API.get(`/dokumen/box/${boxId}`);
    return response.data;
  }
};

export default dokumenService;