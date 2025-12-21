import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStores = () => api.get('/stores');
export const getStore = (id) => api.get(`/stores/${id}`);
export const createList = (storeId) => api.post('/lists', { store_id: storeId });
export const getList = (id) => api.get(`/lists/${id}`);
export const addItem = (listId, name) => api.post(`/lists/${listId}/items`, { name });
export const removeItem = (listId, itemId) => api.delete(`/lists/${listId}/items/${itemId}`);
export const updateItemStatus = (listId, itemId, isDone) => api.put(`/lists/${listId}/items/${itemId}`, { is_done: isDone });
export const getRoute = (listId) => api.post(`/lists/${listId}/route`);

export default api;
