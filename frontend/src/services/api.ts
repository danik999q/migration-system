import axios from 'axios';
import { authService } from './auth.js';

const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      authService.removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  personId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export const api = {
  auth: {
    login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      return response.data;
    },
    register: async (username: string, password: string): Promise<{ token: string; user: User }> => {
      const response = await axios.post(`${API_URL}/auth/register`, { username, password });
      return response.data;
    },
  },
  users: {
    getAll: async (): Promise<User[]> => {
      const response = await apiClient.get('/users');
      return response.data;
    },
    getById: async (id: string): Promise<User> => {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    },
    updateRole: async (id: string, role: 'user' | 'admin'): Promise<User> => {
      const response = await apiClient.put(`/users/${id}/role`, { role });
      return response.data;
    },
  },
  people: {
    getAll: async (): Promise<Person[]> => {
      const response = await apiClient.get('/people');
      return response.data;
    },
    getById: async (id: string): Promise<Person> => {
      const response = await apiClient.get(`/people/${id}`);
      return response.data;
    },
    create: async (data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> => {
      const response = await apiClient.post('/people', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Person>): Promise<Person> => {
      const response = await apiClient.put(`/people/${id}`, data);
      return response.data;
    },
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/people/${id}`);
    },
  },
  documents: {
    getByPersonId: async (personId: string): Promise<Document[]> => {
      const response = await apiClient.get(`/documents/person/${personId}`);
      return response.data;
    },
    upload: async (personId: string, file: File): Promise<Document> => {
      const formData = new FormData();
      formData.append('document', file);
      const response = await apiClient.post(`/documents/person/${personId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    delete: async (documentId: string): Promise<void> => {
      await apiClient.delete(`/documents/${documentId}`);
    },
    download: async (documentId: string, originalName: string): Promise<void> => {
      const response = await apiClient.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      const blob = response.data as Blob;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    },
    getPreviewUrl: async (documentId: string): Promise<string> => {
      const response = await apiClient.get(`/documents/${documentId}/content`, {
        responseType: 'blob',
      });
      const blob = response.data as Blob;
      return window.URL.createObjectURL(blob);
    },
    isImage: (mimeType: string): boolean => {
      return mimeType.startsWith('image/');
    },
    revokeObjectUrl: (url: string) => {
      window.URL.revokeObjectURL(url);
    },
  },
  status: {
    update: async (personId: string, status: string): Promise<Person> => {
      const response = await apiClient.put(`/status/${personId}`, { status });
      return response.data;
    },
  },
};

