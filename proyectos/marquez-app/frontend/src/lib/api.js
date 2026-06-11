import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: adjunta JWT si existe
api.interceptors.request.use(config => {
  const token = localStorage.getItem('marquez_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: manejo global de errores
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || 'Error de conexión con el servidor'
    if (err.response?.status === 401) {
      localStorage.removeItem('marquez_token')
      window.location.href = '/login'
    } else if (err.response?.status !== 404) {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

// ── Catálogo ─────────────────────────────────────────────────────────────────
export const getCatalogo = () => api.get('/catalogo')
export const updateProducto = (id, data) => api.put(`/catalogo/${id}`, data)

// ── Recetas ──────────────────────────────────────────────────────────────────
export const getRecetas = () => api.get('/recetas')
export const getReceta = (productoNombre) => api.get(`/recetas/${encodeURIComponent(productoNombre)}`)
export const saveReceta = (data) => api.post('/recetas', data)
export const updateReceta = (id, data) => api.put(`/recetas/${id}`, data)
export const deleteReceta = (id) => api.delete(`/recetas/${id}`)
export const importRecetasCSV = (filas) => api.post('/recetas/import-csv', { filas })

// ── Costeo ───────────────────────────────────────────────────────────────────
export const saveCosteo = (data) => api.post('/costeos', data)
export const getCosteos = (params) => api.get('/costeos', { params })

// ── Inventario ───────────────────────────────────────────────────────────────
export const getInventario = () => api.get('/inventario')
export const saveInsumo = (data) => api.post('/inventario', data)
export const updateInsumo = (id, data) => api.put(`/inventario/${id}`, data)
export const deleteInsumo = (id) => api.delete(`/inventario/${id}`)

// ── Compras ──────────────────────────────────────────────────────────────────
export const getCompras = () => api.get('/compras')
export const saveFactura = (data) => api.post('/compras', data)

// ── IA ───────────────────────────────────────────────────────────────────────
export const chatIA = (messages, context) => api.post('/ia/chat', { messages, context })

// ── Exportar ─────────────────────────────────────────────────────────────────
export const exportarReporte = (tipo) => api.get(`/exportar/${tipo}`, { responseType: 'blob' })

// ── Ventas & CRM ─────────────────────────────────────────────────────────────
export const getClientes = () => api.get('/ventas/clientes')
export const saveCliente = (data) => api.post('/ventas/clientes', data)
export const updateCliente = (id, data) => api.put(`/ventas/clientes/${id}`, data)
export const getPedidos = () => api.get('/ventas/pedidos')
export const savePedido = (data) => api.post('/ventas/pedidos', data)
export const updateEstadoPedido = (id, estado) => api.put(`/ventas/pedidos/${id}/estado`, { estado })
export const getVentasStats = () => api.get('/ventas/pedidos/stats')

// ── Chatbot de Pedidos ────────────────────────────────────────────────────────
export const chatBotPedidos = (messages) => api.post('/ia-chatbot', { messages })

export default api
