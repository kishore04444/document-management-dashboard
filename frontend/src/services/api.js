import axios from 'axios';

const API_BASE_URL = 'https://document-management-dashboard.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadFiles = async (formData) => {
  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

export const downloadDocument = async (id, filename) => {
  const response = await api.get(`/documents/download/${id}`, {
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread/count');
  return response.data.count;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};
