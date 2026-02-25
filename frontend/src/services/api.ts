import axios from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse, GameRoom } from '../types';

const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<any> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  validateToken: async (): Promise<any> => {
    const response = await api.get('/api/auth/validate');
    return response.data;
  },
};

export const gameAPI = {
  createRoom: async (roomName: string, creatorId: number): Promise<GameRoom> => {
    const response = await api.post('/api/game/rooms', { roomName, creatorId });
    return response.data;
  },

  getAvailableRooms: async (): Promise<GameRoom[]> => {
    const response = await api.get('/api/game/rooms');
    return response.data;
  },

  joinRoom: async (roomCode: string): Promise<GameRoom> => {
    const response = await api.post(`/api/game/rooms/${roomCode}/join`);
    return response.data;
  },

  startGame: async (roomCode: string): Promise<GameRoom> => {
    const response = await api.post(`/api/game/rooms/${roomCode}/start`);
    return response.data;
  },
};

export const templateAPI = {
  createTemplate: async (template: any): Promise<any> => {
    const response = await api.post('/api/game/templates', template);
    return response.data;
  },

  getTemplates: async (): Promise<any[]> => {
    const response = await api.get('/api/game/templates');
    return response.data;
  },

  getTemplate: async (id: number): Promise<any> => {
    const response = await api.get(`/api/game/templates/${id}`);
    return response.data;
  },

  updateTemplate: async (id: number, template: any): Promise<any> => {
    const response = await api.put(`/api/game/templates/${id}`, template);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/api/game/templates/${id}`);
  },
};

export default api;
