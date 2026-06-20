// hooks/useCatalogo.js — v3.2
// Hook centralizado para leer el catálogo desde la API.
// Reemplaza el array PRODUCTOS hardcodeado en lib/catalogo.js.

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL ?? ''

export function useCatalogo() {
  const { token } = useAuth()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState(null)

  const cargar = useCallback(async () => {
    if (!token) return
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/catalogo`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setProductos(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  // Helpers equivalentes a los de lib/catalogo.js
  const categorias = [...new Set(productos.map(p => p.categoria))].sort()

  const getProducto = (nombre) =>
    productos.find(p => p.nombre === nombre)

  const getPorCategoria = (cat) =>
    cat === 'Todos' ? productos : productos.filter(p => p.categoria === cat)

  return { productos, cargando, error, recargar: cargar, categorias, getProducto, getPorCategoria }
}
