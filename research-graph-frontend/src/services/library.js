import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/library';

const getUserId = () => {
  let userId = localStorage,getItem('user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_id', userId);
  }
  return userId;
};

export const getCollections = async () => {
  const response = await axios.get(`${API_BASE_URL}/collections`, {
    params: {user_id: getUserId()}
  });
  return response.data;
};

export const createCollection = async (name, description = '') => {
  const response = await axios.post(`${API_BASE_URL}/collections`, {
    name,
    description,
    user_id: getUserId()
  });
  return response.data;
};

export const deleteCollection = async (collectionId) => {
  const response = await axios.delete(`${API_BASE_URL}/collections/${collectionId}`, {
    params: {user_id: getUserId()}
  });
  return response.data;
};

export const savePaper = async (paperId, collectionId, notes = '', status = 'to_read') => {
  const response = await axios.post(`${API_BASE_URL}/saved-papers`, {
    paper_id: paperId,
    collection_id: collectionId,
    user_id: getUserId(),
    notes,
    status
  });
  return response.data;
};

export const updateSavedPaper = async (savedPaperId, updates) => {
  const response = await axios.put(`${API_BASE_URL}/saved-papers/${savedPaperId}`, updates, {
    params: {user_id: getUserId()}
  });
  return response.data;
};

export const deleteSavedPaper = async (savedPaperId) => {
  const response = await axios.delete(`${API_BASE_URL}/saved-papers/${savedPaperId}`, {
    params: {user_id: getUserId()}
  });
  return response.data;
};

export const getCollectionPapers = async (colletionId) => {
  const response = await axios.get(`${API_BASE_URL}/collections/${collectionId}/papers`, {
    params: {user_id: getUserId()}
  });
  return response.data;
};

export const exportCollection = async (collectionId, format = 'bibtex') => {
  const response = await axios.get(`${API_BASE_URL}/collections/${collectionId}/export`, {
    params: { user_id: getUserId(), format },
    responseType: 'text'
  });
  return response.data;
}