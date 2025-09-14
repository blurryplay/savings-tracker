import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors for request/response handling
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);
    return Promise.reject(error);
  }
);

// Savings Plans API
export const savingsAPI = {
  // Get all plans
  getPlans: async () => {
    try {
      const response = await api.get('/plans');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch savings plans');
    }
  },

  // Create new plan
  createPlan: async (planData) => {
    try {
      const response = await api.post('/plans', planData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create savings plan');
    }
  },

  // Add contribution
  addContribution: async (planId, contributionData) => {
    try {
      const response = await api.post(`/plans/${planId}/contribute`, contributionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add contribution');
    }
  },

  // Withdraw from plan
  withdrawFromPlan: async (planId, withdrawalData) => {
    try {
      const response = await api.post(`/plans/${planId}/withdraw`, withdrawalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to process withdrawal');
    }
  },

  // Delete plan
  deletePlan: async (planId) => {
    try {
      const response = await api.delete(`/plans/${planId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete savings plan');
    }
  },

  // Get dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard data');
    }
  },

  // Get contributions history
  getContributions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const url = queryString ? `/contributions?${queryString}` : '/contributions';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch contributions');
    }
  }
};

export default api;