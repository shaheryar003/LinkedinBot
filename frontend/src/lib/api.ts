import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Drafts API
export const draftsApi = {
  getAll: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/api/drafts', { params }),
  getById: (id: string) => api.get(`/api/drafts/${id}`),
  approve: (id: string) => api.put(`/api/drafts/${id}/approve`),
  reject: (id: string) => api.put(`/api/drafts/${id}/reject`),
  edit: (id: string, content: string) => api.put(`/api/drafts/${id}/edit`, { content }),
  delete: (id: string) => api.delete(`/api/drafts/${id}`),
  generate: () => api.post('/api/drafts/generate'),
  generateFromTopic: (topic: string, context?: string) =>
    api.post('/api/drafts/generate-from-topic', { topic, context }),
};

// Posts API
export const postsApi = {
  getAll: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/api/posts', { params }),
  getById: (id: string) => api.get(`/api/posts/${id}`),
  postNow: (draftId: string) => api.post(`/api/posts/${draftId}/post-now`),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/api/settings'),
  update: (data: any) => api.put('/api/settings', data),
  testLinkedIn: (method: 'puppeteer' | 'api') =>
    api.post('/api/settings/test-linkedin', null, { params: { method } }),
  testOpenAI: () => api.post('/api/settings/test-openai'),
};

// News API
export const newsApi = {
  getAll: (params?: { used?: boolean; limit?: number; offset?: number }) =>
    api.get('/api/news', { params }),
  fetch: () => api.post('/api/news/fetch'),
};

// Analytics API
export const analyticsApi = {
  recordMetric: (
    postId: string,
    metric: { impressions?: number; reactions?: number; comments?: number; shares?: number; clicks?: number }
  ) => api.post(`/api/analytics/posts/${postId}/metrics`, metric),
  runAnalysis: () => api.post('/api/analytics/run'),
  getInsight: () => api.get('/api/analytics/insight'),
};

// Health check
export const healthApi = {
  check: () => api.get('/api/health'),
};

export default api;
