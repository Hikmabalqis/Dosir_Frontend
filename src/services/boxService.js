import API from './api';

const boxService = {
  // Get all boxes (optional: filter by lokerId)
  getAllBoxes: async (lokerId = null) => {
    const params = lokerId ? { lokerId } : {};
    const response = await API.get('/boxes', { params });
    return response.data;
  },

  // Get box by ID
  getBoxById: async (id) => {
    const response = await API.get(`/boxes/${id}`);
    return response.data;
  },

  // Create new boxes (batch). Data: { lokerId: '...', jumlah: 2 }
  createBox: async (data) => {
    const response = await API.post('/boxes', data);
    return response.data;
  },

  // Update box
  updateBox: async (id, boxData) => {
    const response = await API.put(`/boxes/${id}`, boxData);
    return response.data;
  },

  // Delete box
  deleteBox: async (id) => {
    const response = await API.delete(`/boxes/${id}`);
    return response.data;
  },

  // Export box content
  exportBox: async (id) => {
    const response = await API.get(`/boxes/${id}/export`);
    return response.data;
  }
};

export default boxService;