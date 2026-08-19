import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; name: string; password: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me')
};

export const worldAPI = {
  list: (params?: any) => api.get('/worlds', { params }),
  get: (id: string) => api.get(`/worlds/${id}`),
  create: (data: any) => api.post('/worlds', data),
  update: (id: string, data: any) => api.put(`/worlds/${id}`, data),
  delete: (id: string) => api.delete(`/worlds/${id}`),
  addMember: (id: string, data: any) => api.post(`/worlds/${id}/members`, data),
  removeMember: (id: string, userId: string) => api.delete(`/worlds/${id}/members/${userId}`),
  share: (id: string, data: any) => api.post(`/worlds/${id}/share`, data)
};

export const manuscriptAPI = {
  list: (params?: any) => api.get('/manuscripts', { params }),
  publicList: (params?: any) => api.get('/manuscripts/public', { params }),
  get: (id: string) => api.get(`/manuscripts/${id}`),
  create: (data: any) => api.post('/manuscripts', data),
  update: (id: string, data: any) => api.put(`/manuscripts/${id}`, data),
  delete: (id: string) => api.delete(`/manuscripts/${id}`),
  addMember: (id: string, data: any) => api.post(`/manuscripts/${id}/members`, data)
};

export const chapterAPI = {
  list: (manuscriptId: string) => api.get(`/manuscripts/${manuscriptId}/chapters`),
  get: (manuscriptId: string, id: string) => api.get(`/manuscripts/${manuscriptId}/chapters/${id}`),
  create: (manuscriptId: string, data: any) => api.post(`/manuscripts/${manuscriptId}/chapters`, data),
  update: (manuscriptId: string, id: string, data: any) => api.put(`/manuscripts/${manuscriptId}/chapters/${id}`, data),
  delete: (manuscriptId: string, id: string) => api.delete(`/manuscripts/${manuscriptId}/chapters/${id}`),
  publish: (manuscriptId: string, id: string) => api.post(`/manuscripts/${manuscriptId}/chapters/${id}/publish`),
  unpublish: (manuscriptId: string, id: string) => api.post(`/manuscripts/${manuscriptId}/chapters/${id}/unpublish`)
};

export const taskAPI = {
  list: (manuscriptId: string, params?: any) => api.get(`/manuscripts/${manuscriptId}/tasks`, { params }),
  get: (manuscriptId: string, id: string) => api.get(`/manuscripts/${manuscriptId}/tasks/${id}`),
  create: (manuscriptId: string, data: any) => api.post(`/manuscripts/${manuscriptId}/tasks`, data),
  update: (manuscriptId: string, id: string, data: any) => api.put(`/manuscripts/${manuscriptId}/tasks/${id}`, data),
  delete: (manuscriptId: string, id: string) => api.delete(`/manuscripts/${manuscriptId}/tasks/${id}`),
  assign: (manuscriptId: string, id: string, data: any) => api.post(`/manuscripts/${manuscriptId}/tasks/${id}/assign`, data),
  addComment: (manuscriptId: string, id: string, data: any) => api.post(`/manuscripts/${manuscriptId}/tasks/${id}/comments`, data),
  getComments: (manuscriptId: string, id: string) => api.get(`/manuscripts/${manuscriptId}/tasks/${id}/comments`),
  reorder: (manuscriptId: string, data: any) => api.put(`/manuscripts/${manuscriptId}/tasks/reorder`, data),
  getSprints: (manuscriptId: string) => api.get(`/manuscripts/${manuscriptId}/sprints`),
  createSprint: (manuscriptId: string, data: any) => api.post(`/manuscripts/${manuscriptId}/sprints`, data),
  getMilestones: (manuscriptId: string) => api.get(`/manuscripts/${manuscriptId}/milestones`),
  createMilestone: (manuscriptId: string, data: any) => api.post(`/manuscripts/${manuscriptId}/milestones`, data),
  getCalendar: (manuscriptId: string, params?: any) => api.get(`/manuscripts/${manuscriptId}/calendar`, { params })
};

export const notificationAPI = {
  list: (params?: any) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export const statsAPI = {
  world: (worldId: string) => api.get(`/stats/world/${worldId}`),
  manuscript: (manuscriptId: string) => api.get(`/stats/manuscript/${manuscriptId}`)
};

export const bestiaryAPI = {
  list: (worldId: string, params?: any) => api.get(`/bestiary/world/${worldId}`, { params }),
  get: (id: string) => api.get(`/bestiary/${id}`),
  create: (data: any) => api.post('/bestiary', data),
  update: (id: string, data: any) => api.put(`/bestiary/${id}`, data),
  delete: (id: string) => api.delete(`/bestiary/${id}`)
};

export const characterAPI = {
  list: (worldId: string, params?: any) => api.get(`/characters/world/${worldId}`, { params }),
  get: (id: string) => api.get(`/characters/${id}`),
  create: (data: any) => api.post('/characters', data),
  update: (id: string, data: any) => api.put(`/characters/${id}`, data),
  delete: (id: string) => api.delete(`/characters/${id}`)
};

export const geographyAPI = {
  // Continents
  listContinents: (worldId: string) => api.get(`/geography/continents/world/${worldId}`),
  createContinent: (data: any) => api.post('/geography/continents', data),
  updateContinent: (id: string, data: any) => api.put(`/geography/continents/${id}`, data),
  deleteContinent: (id: string) => api.delete(`/geography/continents/${id}`),
  // Seas
  listSeas: (worldId: string) => api.get(`/geography/seas/world/${worldId}`),
  createSea: (data: any) => api.post('/geography/seas', data),
  // Regions
  listRegions: (worldId: string) => api.get(`/geography/regions/world/${worldId}`),
  createRegion: (data: any) => api.post('/geography/regions', data),
  updateRegion: (id: string, data: any) => api.put(`/geography/regions/${id}`, data),
  deleteRegion: (id: string) => api.delete(`/geography/regions/${id}`),
  // Maps
  listMaps: (worldId: string, params?: any) => api.get(`/geography/maps/world/${worldId}`, { params }),
  getMap: (id: string) => api.get(`/geography/maps/${id}`),
  createMap: (data: any) => api.post('/geography/maps', data),
  updateMap: (id: string, data: any) => api.put(`/geography/maps/${id}`, data),
  deleteMap: (id: string) => api.delete(`/geography/maps/${id}`)
};

export const timelineAPI = {
  list: (worldId: string, params?: any) => api.get(`/events/world/${worldId}`, { params }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`)
};

export const magicAPI = {
  listSystems: (worldId: string) => api.get(`/magic/systems/world/${worldId}`),
  createSystem: (data: any) => api.post('/magic/systems', data),
  updateSystem: (id: string, data: any) => api.put(`/magic/systems/${id}`, data),
  deleteSystem: (id: string) => api.delete(`/magic/systems/${id}`),
  listSpells: (worldId: string, params?: any) => api.get(`/magic/spells/world/${worldId}`, { params }),
  getSpell: (id: string) => api.get(`/magic/spells/${id}`),
  createSpell: (data: any) => api.post('/magic/spells', data),
  updateSpell: (id: string, data: any) => api.put(`/magic/spells/${id}`, data),
  deleteSpell: (id: string) => api.delete(`/magic/spells/${id}`)
};

export const nationsAPI = {
  list: (worldId: string) => api.get(`/nations/world/${worldId}`),
  get: (id: string) => api.get(`/nations/${id}`),
  create: (data: any) => api.post('/nations', data),
  update: (id: string, data: any) => api.put(`/nations/${id}`, data),
  delete: (id: string) => api.delete(`/nations/${id}`)
};

export const heraldryAPI = {
  list: (worldId: string) => api.get(`/heraldry/world/${worldId}`),
  get: (id: string) => api.get(`/heraldry/${id}`),
  create: (data: any) => api.post('/heraldry', data),
  update: (id: string, data: any) => api.put(`/heraldry/${id}`, data),
  delete: (id: string) => api.delete(`/heraldry/${id}`)
};

export const lawsAPI = {
  list: (worldId: string, params?: any) => api.get(`/laws/world/${worldId}`, { params }),
  get: (id: string) => api.get(`/laws/${id}`),
  create: (data: any) => api.post('/laws', data),
  update: (id: string, data: any) => api.put(`/laws/${id}`, data),
  delete: (id: string) => api.delete(`/laws/${id}`)
};
