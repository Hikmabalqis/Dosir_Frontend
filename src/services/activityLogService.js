import api from './api';

const activityLogService = {
  // Get logs untuk entity tertentu (Box/Loker/Dokumen)
  getLogsByEntity: async (entity, entityId, limit = 50) => {
    const response = await api.get(`/activity-log/${entity}/${entityId}`, {
      params: { limit }
    });
    return response.data;
  },

  // Get all logs dengan filter
  getAllLogs: async (filters = {}) => {
    const response = await api.get('/activity-log', {
      params: filters
    });
    return response.data;
  },

  // Get logs by user
  getLogsByUser: async (userId, limit = 50) => {
    const response = await api.get(`/activity-log/user/${userId}`, {
      params: { limit }
    });
    return response.data;
  },

  // Cleanup old logs (superadmin only)
  cleanupOldLogs: async (days = 90) => {
    const response = await api.delete('/activity-log/cleanup', {
      data: { days }
    });
    return response.data;
  }
};

export default activityLogService;