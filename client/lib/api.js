import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Resume API
export const resumeAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getInsights: async () => {
    const response = await api.get('/resume/insights');
    return response.data;
  },
};

// Roles API
export const rolesAPI = {
  getAll: async () => {
    const response = await api.get('/roles');
    return response.data;
  },
};

// Interview API
export const interviewAPI = {
  start: async (data) => {
    const response = await api.post('/interview/start', data);
    return response.data;
  },
  
  getNextQuestion: async (sessionId) => {
    const response = await api.get(`/interview/${sessionId}/next`);
    return response.data;
  },
  
  submitAnswer: async (sessionId, questionId, answerText, timeSpentSeconds = 0) => {
    const response = await api.post(`/interview/${sessionId}/answer`, {
      questionId,
      answerText,
      timeSpentSeconds
    });
    return response.data;
  },
  
  complete: async (sessionId, forceComplete = false) => {
    const response = await api.post(`/interview/${sessionId}/complete`, {
      forceComplete
    });
    return response.data;
  },
  
  getSummary: async (sessionId) => {
    const response = await api.get(`/interview/${sessionId}/summary`);
    return response.data;
  },

  getSessions: async (limit) => {
    const response = await api.get('/interview/sessions', {
      params: {
        limit
      }
    });
    return response.data;
  },

  downloadReport: async (sessionId) => {
    const response = await api.get(`/interview/${sessionId}/report`, {
      responseType: 'blob'
    });
    return response;
  },
};

export default api;

