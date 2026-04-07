import API from './api';

const jenisDokumenService = {
  getAll: () => {
    return API.get('/jenis-dokumen');
  },

  create: (data) => {
    return API.post('/jenis-dokumen', data);
  },

  // ========== FUNGSI BARU: DELETE ==========
  delete: (id) => {
    return API.delete(`/jenis-dokumen/${id}`);
  }
};

export default jenisDokumenService;