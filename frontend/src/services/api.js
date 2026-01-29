import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Game API
export const gameAPI = {
  // Lấy danh sách games
  getGames: async (params = {}) => {
    const response = await api.get('/games', { params });
    return response.data;
  },

  // Lấy game theo ID
  getGameById: async (id) => {
    const response = await api.get(`/games/${id}`);
    return response.data;
  },

  // Lấy game theo slug
  getGameBySlug: async (slug) => {
    const response = await api.get(`/games/slug/${slug}`);
    return response.data;
  },

  // Lấy tất cả tags
  getAllTags: async () => {
    const response = await api.get('/games/tags/all');
    return response.data;
  },

  // Tạo game mới
  createGame: async (gameData) => {
    const response = await api.post('/games', gameData);
    return response.data;
  },

  // Cập nhật game
  updateGame: async (id, gameData) => {
    const response = await api.put(`/games/${id}`, gameData);
    return response.data;
  },

  // Xóa game
  deleteGame: async (id) => {
    const response = await api.delete(`/games/${id}`);
    return response.data;
  },
};

export default api;
