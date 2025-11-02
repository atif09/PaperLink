import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.origin}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (
      !config.__retryCount &&
      (error.code === 'ECONNABORTED' ||
        error.message.includes('timeout') ||
        error.message.includes('Network Error')
      )
    ) {
      config.__retryCount = 1;

      await new Promise(resolve => setTimeout(resolve, 1000));

      return api(config);
    }

    return Promise.reject(error);
  }
)

export const searchPapers = async (query,filters = {}) => {
  const params = { q: query, ...filters };
  const response = await api.get('/search', {params});
  return response.data;
};

export const getPaperDetails = async (paperId) => {
  const response = await api.get(`/papers/${paperId}`);
  return response.data;
};

export const getCitationGraph = async (paperId, depth=1) => {
  const response = await api.get(`/papers/${paperId}/graph`, {
    params: {depth},
  });
  return response.data;
};

export const expandPaperNode = async (paperId) => {
  const response = await api.post(`/papers/${paperId}/expand`);
  return response.data;
};

export default api;