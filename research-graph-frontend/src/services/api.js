import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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