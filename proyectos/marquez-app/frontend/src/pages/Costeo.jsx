import { useState } from 'react'
import { useRecetas } from '../hooks/useRecetas'
import { PRODUCTOS } from '../lib/catalogo'
import { Calculator, AlertTriangle, CheckCircle } from 'lucide-react'
import { saveCosteo } from '../lib/api'
import toast from 'react-hot-toast'

const fmt = (v) => 'C$ ' + (parseFloat(v) || 0).toFixed(2)

export default function Costeo() {
  const { recetas, calcularCostos } = useRecetas()
  const [prodIdx, setProdIdx] = useState('')
  const [piezas, setPiezas] = useState('')
  const [pventa, setPventa] = useState('')
  const [resultado, setResultado] = useState(null)

  const prod = prodIdx !== '' ? PRODUCTOS[parseInt(prodIdx)] : null
  const receta = prod ? recetas[prod.n] : null

  const handleProdChange = (idx) => {
    setProdIdx(idx)
    if (idx !== '') {
      const p = PRODUCTOS[parseInt(idx)]
      setPventa(p.p)
      const r = recetas[p.n]
      if (r) setPiezas(r.piezas)
    }
    setResultado(null)
  }

  const calcular = async () => {
    if (!prod) { toast.error('Selecciona un producto'); return }
    if (!receta) { toast.error('Este producto no tiene receta guardada'); return }
    if (!piezas) { toast.error('Ingresa las piezas a producir'); return }

    const r = calcularCostos(prod.n, parseInt(piezas))
    if (!r) { toast.error('Error al calcular costos'); return }

    const res = { ...r, pventa: parseFloat(pventa) || prod.p, producto: prod.n, piezasObj: parseInt(piezas) }
    res.margen = res.pventa > 0 ? ((res.pventa - res.cu) / res.pventa) * 100 : 0
    res.vtotal = res.pventa * res.piezasReales
    res.utilidad = res.vtotal - res.ct
    setResultado(res)

    try {
      await saveCosteo({ producto: prod.n, piezas: parseInt(piezas), ...res })
    } catch (_) {}
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Costeo automático desde receta</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group">
            <label className="form-label">Producto con receta</label>
            <select value={prodIdx} onChange={e => handleProdChange(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {PRODUCTOS.map((p, i) => {
                const tieneReceta = !!recetas[p.n]
                return (
                  <option key={i} value={i}>
                    {tieneReceta ? '✓ ' : '○ '}{p.n} — C$ {p.p}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Piezas a producir</label>
            <input type="number" value={piezas} onChange={e => setPiezas(e.target.value)} placeholder="100" min="1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="form-group">
            <label className="form-label">Precio de venta (C$)</label>
            <input type="number" value={pventa} onChange={e => setPventa(e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">Estado de receta</label>
            <div className="flex items-center gap-2 py-2">
              {!prod ? (
                <span className="text-xs text-gray-400">Sin producto seleccionado</span>
              ) : receta ? (
                <span className="badge-ok flex items-center gap-1">
                  <CheckCircle size={11} /> Receta disponible ({receta.ingredientes?.length} ingredientes)
                </span>
              ) : (
                <span className="badge-bad flex items-center gap-1">
                  <AlertTriangle size={11} /> Sin receta — ir a módulo Recetas
                </span>
              )}
            </div>
          </div>
        </div>

        {receta && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-xs text-gray-500 mb-2 font-medium">Ingredientes de la receta base ({receta.piezas} piezas)</div>
            <div className="overflow-x-auto">
              <table className="table-base text-xs">
                <thead><tr><th>Ingrediente</th><th>Base</th><th>Escalado</th><th>Unidad</th></tr></thead>
                <tbody>
                  {receta.ingredientes?.map((ing, i) => {
                    const factor = piezas ? parseInt(piezas) / receta.piezas : 1
                    return (
                      <tr key={i}>
                        <td>{ing.nombre} <span className={ing.tipo === 'indirecto' ? 'badge-info text-[10px]' : 'badge-gray text-[10px]'}>{ing.tipo}</span></td>
                        <td>{ing.cantidad} {ing.unidad}</td>
                        <td className="font-medium">{(ing.cantidad * factor).toFixed(3)} {ing.unidad}</td>
                        <td>{ing.unidad}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button onClick={calcular} className="btn-primary flex items-center gap-2" disabled={!receta}>
          <Calculator size={14} /> Calcular costeo completo
        </button>
      </div>

      {resultado && (
        <>
          {resultado.pventa > 0 && (
            resultado.margen >= 60 ? (
              <div className="alert-ok">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">Margen aprobado — {resultado.margen.toFixed(1)}%</div>
                  <div className="text-xs text-green-700 mt-0.5">
                    Operación viable. Utilidad neta del lote: {fmt(resultado.utilidad)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert-bad">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">ALERTA CRÍTICA — Violación de margen</div>
                  <div className="text-xs text-red-700 mt-0.5">
                    Margen: {resultado.margen.toFixed(1)}% (objetivo ≥60%).
                    Precio mínimo requerido: {fmt(resultado.pmin)}
                  </div>
                </div>
              </div>
            )
          )}

          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Resultado — {resultado.producto} ({resultado.piezasObj} piezas)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                ['Costo total lote', fmt(resultado.ct)],
                ['Costo unitario', fmt(resultado.cu)],
                ['Precio mínimo (60%)', fmt(resultado.pmin)],
                ['Margen neto', resultado.margen.toFixed(1) + '%'],
              ].map(([l, v]) => (
                <div key={l} className="kpi-card">
                  <div className="text-xs text-gray-400 mb-1">{l}</div>
                  <div className="text-lg font-semibold text-gray-900">{v}</div>
                </div>
              ))}
            </div>
            <table className="table-base">
              <thead><tr><th>Concepto</th><th className="text-right">Monto</th><th className="text-right">% del total</th></tr></thead>
              <tbody>
                <tr><td>Costos directos</td><td className="text-right">{fmt(resultado.cd)}</td><td className="text-right">{resultado.ct > 0 ? ((resultado.cd / resultado.ct) * 100).toFixed(1) : 0}%</td></tr>
                <tr><td>Costos indirectos</td><td className="text-right">{fmt(resultado.ci)}</td><td className="text-right">{resultado.ct > 0 ? ((resultado.ci / resultado.ct) * 100).toFixed(1) : 0}%</td></tr>
                <tr className="font-medium"><td>Costo total</td><td className="text-right">{fmt(resultado.ct)}</td><td></td></tr>
                <tr><td>Piezas reales (−{receta?.merma || 0}% merma)</td><td className="text-right">{resultado.piezasReales}</td><td></td></tr>
                {resultado.pventa > 0 && <>
                  <tr><td>Precio de venta</td><td className="text-right">{fmt(resultado.pventa)}</td><td></td></tr>
                  <tr><td>Venta total</td><td className="text-right">{fmt(resultado.vtotal)}</td><td></td></tr>
                  <tr><td>Utilidad neta</td>
                    <td className="text-right font-medium" style={{ color: '#27500A' }}>{fmt(resultado.utilidad)}</td><td></td></tr>
                  <tr><td>Margen neto</td>
                    <td className="text-right">
                      <span className={resultado.margen >= 60 ? 'badge-ok' : 'badge-bad'}>
                        {resultado.margen.toFixed(1)}%
                      </span>
                    </td><td></td></tr>
                </>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
