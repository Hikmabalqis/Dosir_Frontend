import API from './api';

const lokerService = {
  // Get all loker
  getAllLoker: async () => {
    const response = await API.get('/loker');
    return response.data;
  },

  // Get loker by ID
  getLokerById: async (id) => {
    const response = await API.get(`/loker/${id}`);
    return response.data;
  },

  // Create new loker
  createLoker: async (data) => {
    const response = await API.post('/loker', data);
    return response.data;
  },

  // Update loker
  updateLoker: async (id, data) => {
    const response = await API.put(`/loker/${id}`, data);
    return response.data;
  },

  // Delete loker
  deleteLoker: async (id) => {
    const response = await API.delete(`/loker/${id}`);
    return response.data;
  },

  // Get boxes in specific loker
  getBoxesByLoker: async (id) => {
    const response = await API.get(`/loker/${id}/boxes`);
    return response.data;
  }
};

export default lokerService;