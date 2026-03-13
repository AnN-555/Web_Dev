import axios from 'axios';
 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
 
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
 
const TOKEN_KEY = 'game_store_token';
 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 
// ─── Game API ───────────────────────────────────────────────────────────────
export const gameAPI = {
  getGames:      (params = {}) => api.get('/api/games', { params }).then(r => r.data),
  getGameById:   (id)          => api.get(`/api/games/${id}`).then(r => r.data),
  getGameBySlug: (slug)        => api.get(`/api/games/slug/${slug}`).then(r => r.data),
  getAllTags:     ()            => api.get('/api/games/tags/all').then(r => r.data),
  createGame:    (data)        => api.post('/api/games', data).then(r => r.data),
  updateGame:    (id, data)    => api.put(`/api/games/${id}`, data).then(r => r.data),
  deleteGame:    (id)          => api.delete(`/api/games/${id}`).then(r => r.data),
  getComments:   (gameId)      => api.get(`/api/games/${gameId}/comments`).then(r => r.data),
  addComment:    (gameId, text)=> api.post(`/api/games/${gameId}/comments`, { text }).then(r => r.data),
};
 
// ─── Auth API ────────────────────────────────────────────────────────────────
// authAPI vẫn return response.data vì AuthContext dùng trực tiếp
export const authAPI = {
  register: (username, email, password) =>
    api.post('/api/auth/register', { username, email, password }).then(r => r.data),
  login:  (email, password) =>
    api.post('/api/auth/login', { email, password }).then(r => r.data),
  logout: () =>
    api.post('/api/auth/logout').then(r => r.data),
  getMe:  () =>
    api.get('/api/auth/me').then(r => r.data),
};
 
// ─── Cart API ────────────────────────────────────────────────────────────────
export const cartAPI = {
  getCart:        ()       => api.get('/api/cart', { params: { t: Date.now() } }).then(r => r.data),
  addToCart:      (gameId) => api.post('/api/cart/add', { gameId }).then(r => r.data),
  removeFromCart: (gameId) => api.delete(`/api/cart/item/${gameId}`).then(r => r.data),
  checkout:       ()       => api.post('/api/cart/checkout').then(r => r.data),
};
 
// ─── Order API ───────────────────────────────────────────────────────────────
// return response.data = { success, data: [...] }
export const orderAPI = {
  createOrder:  (gameId) => api.post('/api/orders', { gameId }).then(r => r.data),
  getMyOrders:  ()       => api.get('/api/orders').then(r => r.data),
  getOrderById: (id)     => api.get(`/api/orders/${id}`).then(r => r.data),
};
 
// ─── Forum API ───────────────────────────────────────────────────────────────
// return response.data = { success, data: [...] }
export const forumAPI = {
  getPosts:      (params = {})        => api.get('/api/forums/posts', { params }).then(r => r.data),
  createPost:    ({ title, content }) => api.post('/api/forums/posts', { title, content }).then(r => r.data),
  getPostDetail: (id)                 => api.get(`/api/forums/posts/${id}`).then(r => r.data),
  addComment:    (postId, text)       => api.post(`/api/forums/posts/${postId}/comments`, { text }).then(r => r.data),
};
 
export default api;