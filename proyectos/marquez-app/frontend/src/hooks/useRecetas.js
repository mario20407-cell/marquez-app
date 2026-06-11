import { useState, useEffect, useCallback } from 'react'
import { getRecetas, saveReceta, updateReceta, deleteReceta } from '../lib/api'
import toast from 'react-hot-toast'

export function useRecetas() {
  const [recetas, setRecetas] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await getRecetas()
      // Indexar por nombre de producto para acceso O(1)
      const mapa = {}
      data.forEach(r => { mapa[r.producto] = r })
      setRecetas(mapa)
    } catch (e) {
      setError(e.message)
      // Fallback: localStorage si no hay backend
      const local = localStorage.getItem('marquez_recetas')
      if (local) setRecetas(JSON.parse(local))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = async (datos) => {
    try {
      const existente = recetas[datos.producto]
      let res
      if (existente?.id) {
        res = await updateReceta(existente.id, datos)
      } else {
        res = await saveReceta(datos)
      }
      const nueva = res.data
      setRecetas(prev => ({ ...prev, [nueva.producto]: nueva }))
      localStorage.setItem('marquez_recetas', JSON.stringify({ ...recetas, [nueva.producto]: nueva }))
      toast.success(`Receta de "${datos.producto}" guardada`)
      return nueva
    } catch (e) {
      // Guardar en localStorage como fallback
      const local = { ...recetas, [datos.producto]: { ...datos, id: Date.now() } }
      setRecetas(local)
      localStorage.setItem('marquez_recetas', JSON.stringify(local))
      toast.success(`Receta guardada localmente`)
      return datos
    }
  }

  const eliminar = async (productoNombre) => {
    const receta = recetas[productoNombre]
    if (!receta) return
    try {
      if (receta.id) await deleteReceta(receta.id)
      const nueva = { ...recetas }
      delete nueva[productoNombre]
      setRecetas(nueva)
      localStorage.setItem('marquez_recetas', JSON.stringify(nueva))
      toast.success('Receta eliminada')
    } catch (e) {
      toast.error('Error al eliminar receta')
    }
  }

  const calcularCostos = (productoNombre, piezasObjetivo = null) => {
    const r = recetas[productoNombre]
    if (!r) return null
    const factor = piezasObjetivo ? piezasObjetivo / r.piezas : 1
    const piezasReales = r.merma > 0
      ? Math.round((piezasObjetivo || r.piezas) * (1 - r.merma / 100))
      : (piezasObjetivo || r.piezas)

    const cd = r.ingredientes
      .filter(i => i.tipo !== 'indirecto')
      .reduce((s, i) => s + i.cantidad * factor * i.precio, 0)
    const ci = r.ingredientes
      .filter(i => i.tipo === 'indirecto')
      .reduce((s, i) => s + i.cantidad * factor * i.precio, 0)
    const ct = cd + ci
    const cu = piezasReales > 0 ? ct / piezasReales : 0
    const pventa = r.pventa
    const vtotal = pventa * piezasReales
    const utilidad = vtotal - ct
    const margen = vtotal > 0 ? (utilidad / vtotal) * 100 : 0
    const pmin = cu > 0 ? cu / 0.4 : 0

    return { cd, ci, ct, cu, pventa, vtotal, utilidad, margen, pmin, piezasReales, factor }
  }

  return { recetas, loading, error, guardar, eliminar, calcularCostos, recargar: cargar }
}
