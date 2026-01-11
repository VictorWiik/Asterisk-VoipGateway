import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const auth = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// Providers
export const providers = {
  list: () => api.get('/providers'),
  get: (id) => api.get(`/providers/${id}`),
  create: (data) => api.post('/providers', data),
  update: (id, data) => api.put(`/providers/${id}`, data),
  delete: (id) => api.delete(`/providers/${id}`),
}

// Customers
export const customers = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
}

// DIDs
export const dids = {
  list: (params) => api.get('/dids', { params }),
  get: (id) => api.get(`/dids/${id}`),
  create: (data) => api.post('/dids', data),
  import: (data) => api.post('/dids/import', data),
  update: (id, data) => api.put(`/dids/${id}`, data),
  delete: (id) => api.delete(`/dids/${id}`),
  summary: () => api.get('/dids/summary'),
  allocate: (id, data) => api.post(`/dids/${id}/allocate`, data),
  deallocate: (id) => api.post(`/dids/${id}/deallocate`),
}

// Dashboard
export const dashboard = {
  stats: () => api.get('/dashboard/stats'),
  callsByHour: (days) => api.get('/dashboard/calls/by-hour', { params: { days } }),
  callsByDestination: (days, limit) => api.get('/dashboard/calls/by-destination', { params: { days, limit } }),
  topCustomers: (days, limit) => api.get('/dashboard/customers/top-consumption', { params: { days, limit } }),
  providersUsage: (days) => api.get('/dashboard/providers/usage', { params: { days } }),
}

export default api
