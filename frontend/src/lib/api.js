import axios from 'axios'

// Where the Django API lives. Set VITE_API_URL in .env when you deploy.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

const KEY = 'hirelens.tokens'

export const tokens = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || null
    } catch {
      return null
    }
  },
  set(value) {
    try {
      localStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      /* private window: stay signed in for this tab only */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nothing to clear */
    }
  },
}

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const t = tokens.get()
  if (t?.access) config.headers.Authorization = `Bearer ${t.access}`
  return config
})

// The access token lasts 5 minutes. On a 401, swap the refresh token for a
// new one once and repeat the request, so the user is not thrown out mid-task.
let refreshing = null
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error
    const t = tokens.get()
    const isAuthCall = /\/auth\/(login|register|refresh)\//.test(config?.url || '')
    if (response?.status === 401 && t?.refresh && config && !config._retry && !isAuthCall) {
      config._retry = true
      try {
        refreshing ||= axios
          .post(`${API_URL}/auth/refresh/`, { refresh: t.refresh })
          .finally(() => {
            refreshing = null
          })
        const { data } = await refreshing
        tokens.set({ ...t, ...data }) // the refresh token rotates too
        config.headers.Authorization = `Bearer ${data.access}`
        return api(config)
      } catch {
        tokens.clear()
        window.dispatchEvent(new Event('hirelens:logout'))
      }
    }
    return Promise.reject(error)
  },
)

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')

// Turn any API failure into one sentence a person can act on.
export function errorText(error, fallback = 'Something went wrong. Try again.') {
  if (!error?.response) return 'Cannot reach the server. Is the backend running on port 8000?'
  const data = error.response.data
  if (!data || typeof data !== 'object') return fallback
  if (data.error) return String(data.error)
  if (data.detail) return String(data.detail)
  const [field, value] = Object.entries(data)[0] || []
  if (!field) return fallback
  const message = Array.isArray(value) ? value[0] : value
  return field === 'non_field_errors' ? String(message) : `${cap(field)}: ${message}`
}

export default api
