import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const searchesApi = {
  create: (data) => api.post('/searches/', data),
  list: () => api.get('/searches/'),
  get: (id) => api.get(`/searches/${id}`),
  clearAll: () => api.delete('/searches/all'),
}

export const leadsApi = {
  list: (params) => api.get('/leads/', { params }),
  count: () => api.get('/leads/count'),
  locais: () => api.get('/leads/locais'),
  update: (id, data) => api.patch(`/leads/${id}`, data),
}

export const whatsappApi = {
  status: () => api.get('/whatsapp/status'),
  check: (leadIds) => api.post('/whatsapp/check', { lead_ids: leadIds }),
}

export const exportApi = {
  leads: (params = {}) => {
    const url = new URL('/api/export/leads', window.location.origin)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) url.searchParams.set(k, v)
    })
    window.open(url.toString(), '_blank')
  },
}
