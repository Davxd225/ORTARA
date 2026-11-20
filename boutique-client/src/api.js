import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    (error.code === 'ERR_NETWORK'
      ? 'Impossible de joindre le serveur. Vérifiez que l’API est démarrée.'
      : error.message || 'Une erreur inattendue est survenue.')
  )
}
