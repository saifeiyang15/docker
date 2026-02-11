import axios from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse, GameRoom } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

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
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<any> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  validateToken: async (): Promise<any> => {
    const response = await api.get('/auth/validate');
    return response.data;
  },
};

export const gameAPI = {
  createRoom: async (roomName: string, creatorId: number): Promise<GameRoom> => {
    const response = await api.post('/game/rooms', { roomName, creatorId });
    return response.data;
  },

  getAvailableRooms: async (): Promise<GameRoom[]> => {
    const response = await api.get('/game/rooms');
    return response.data;
  },

  joinRoom: async (roomCode: string): Promise<GameRoom> => {
    const response = await api.post(`/game/rooms/${roomCode}/join`);
    return response.data;
  },

  startGame: async (roomCode: string): Promise<GameRoom> => {
    const response = await api.post(`/game/rooms/${roomCode}/start`);
    return response.data;
  },
};

export default api;
