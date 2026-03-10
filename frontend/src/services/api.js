import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_KEY = 'game_store_token';

// Gửi kèm token khi gọi API cần đăng nhập
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Game API
export const gameAPI = {
  // Lấy danh sách games
  getGames: async (params = {}) => {
    const response = await api.get('api/games', { params });
    return response.data;
  },

  // Lấy game theo ID
  getGameById: async (id) => {
    const response = await api.get(`api/games/${id}`);
    return response.data;
  },

  // Lấy game theo slug
  getGameBySlug: async (slug) => {
    const response = await api.get(`api/games/slug/${slug}`);
    return response.data;
  },

  // Lấy tất cả tags
  getAllTags: async () => {
    const response = await api.get('api/games/tags/all');
    return response.data;
  },

  // Tạo game mới
  createGame: async (gameData) => {
    const response = await api.post('api/games', gameData);
    return response.data;
  },

  // Cập nhật game
  updateGame: async (id, gameData) => {
    const response = await api.put(`api/games/${id}`, gameData);
    return response.data;
  },

  // Xóa game
  deleteGame: async (id) => {
    const response = await api.delete(`api/games/${id}`);
    return response.data;
  },

// Lấy comment theo game
  getComments: async (gameId) => {
    const response = await api.get(`api/games/${gameId}/comments`);
    return response.data;
  },

  // Thêm comment (cần đăng nhập)
  addComment: async (gameId, text) => {
    const response = await api.post(`api/games/${gameId}/comments`, { text });
    return response.data;
  },
};

// Authentication API
export const authAPI = {
  register: async (username, email, password) => {
    const response = await api.post('api/auth/register', { username, email, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('api/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('api/auth/logout');
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('api/auth/me');
    return response.data;
  },
};

// Cart API (requires login)
export const cartAPI = {
  getCart: async () => {
    const response = await api.get('api/cart', { params: { t: Date.now() } });
    return response.data;
  },
  addToCart: async (gameId) => {
    const response = await api.post('api/cart/add', { gameId });
    return response.data;
  },
  removeFromCart: async (gameId) => {
    const response = await api.delete(`api/cart/item/${gameId}`);
    return response.data;
  },
  checkout: async () => {
    const response = await api.post('api/cart/checkout');
    return response.data;
  },
};

// Order API (requires login)
export const orderAPI = {
  /** Mua game – body: { gameId } */
  createOrder: async (gameId) => {
    const response = await api.post('api/orders', { gameId });
    return response.data;
  },

  /** Lấy danh sách đơn hàng của user */
  getMyOrders: async () => {
    const response = await api.get('api/orders');
    return response.data;
  },

  /** Chi tiết một đơn */
  getOrderById: async (id) => {
    const response = await api.get(`api/orders/${id}`);
    return response.data;
  },
};

// Forums API
export const forumAPI = {
  getPosts: async (params = {}) => {
    const response = await api.get('api/forums/posts', { params });
    return response.data;
  },
  createPost: async ({ title, content }) => {
    const response = await api.post('api/forums/posts', { title, content });
    return response.data;
  },
  getPostDetail: async (id) => {
    const response = await api.get(`api/forums/posts/${id}`);
    return response.data;
  },
  addComment: async (postId, text) => {
    const response = await api.post(`api/forums/posts/${postId}/comments`, { text });
    return response.data;
  },
};

export default api;