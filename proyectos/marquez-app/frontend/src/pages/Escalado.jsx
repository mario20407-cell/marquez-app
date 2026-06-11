import { useState } from 'react'
import { useRecetas } from '../hooks/useRecetas'
import { PRODUCTOS } from '../lib/catalogo'
import { Scale, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = v => 'C$ ' + (parseFloat(v) || 0).toFixed(2)

export default function Escalado() {
  const { recetas } = useRecetas()
  const [prodIdx, setProdIdx] = useState('')
  const [base, setBase] = useState('')
  const [target, setTarget] = useState('')
  const [peso, setPeso] = useState('')
  const [merma, setMerma] = useState('')
  const [costoLote, setCostoLote] = useState('')
  const [ings, setIngs] = useState([
    { nombre: 'Harina', cantidad: '', unidad: 'kg' },
  ])
  const [resultado, setResultado] = useState(null)

  const prod = prodIdx !== '' ? PRODUCTOS[parseInt(prodIdx)] : null
  const receta = prod ? recetas[prod.n] : null

  const handleProdChange = (idx) => {
    setProdIdx(idx)
    setResultado(null)
    if (idx === '') return
    const r = recetas[PRODUCTOS[parseInt(idx)].n]
    if (r) {
      setBase(r.piezas)
      setPeso(r.peso_por_pieza || '')
      setMerma(r.merma_pct || '')
      setIngs(r.ingredientes?.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, unidad: i.unidad })) || ings)
    }
  }

  const addIng = () => setIngs(p => [...p, { nombre: '', cantidad: '', unidad: 'kg' }])
  const removeIng = (i) => setIngs(p => p.filter((_, idx) => idx !== i))
  const updateIng = (i, field, val) => setIngs(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x))

  const calcular = () => {
    const b = parseFloat(base), t = parseFloat(target)
    if (!b || !t) { toast.error('Ingresa receta base y piezas objetivo'); return }
    const factor = t / b
    const pesog = parseFloat(peso) || 0
    const mermap = parseFloat(merma) || 0
    const piezasR = Math.round(t * (1 - mermap / 100))
    const pesoTotal = (t * pesog) / 1000
    const cu = costoLote && piezasR > 0 ? parseFloat(costoLote) / piezasR : null
    const pventa = prod?.p || 0
    const margen = cu && pventa > 0 ? ((pventa - cu) / pventa) * 100 : null

    setResultado({
      factor, piezasObj: t, piezasR, pesoTotal, cu, margen, pventa,
      ingsEscalados: ings
        .filter(i => i.nombre && parseFloat(i.cantidad) > 0)
        .map(i => ({ ...i, escalado: (parseFloat(i.cantidad) * factor).toFixed(4) }))
    })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Motor de escalado</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group">
            <label className="form-label">Producto (opcional)</label>
            <select value={prodIdx} onChange={e => handleProdChange(e.target.value)}>
              <option value="">— Sin seleccionar —</option>
              {PRODUCTOS.map((p, i) => <option key={i} value={i}>{p.n}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">% merma estimada</label>
            <input type="number" value={merma} onChange={e => setMerma(e.target.value)} placeholder="5" min="0" max="40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group">
            <label className="form-label">Piezas base de receta</label>
            <input type="number" value={base} onChange={e => setBase(e.target.value)} placeholder="100" min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Piezas a producir</label>
            <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="500" min="1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="form-group">
            <label className="form-label">Peso por pieza (g)</label>
            <input type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="80" />
          </div>
          <div className="form-group">
            <label className="form-label">Costo total del lote (C$) — opcional</label>
            <input type="number" value={costoLote} onChange={e => setCostoLote(e.target.value)} placeholder="0" step="0.01" />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <label className="form-label" style={{ marginBottom: 0 }}>
              Ingredientes base ({base || 'X'} piezas)
            </label>
            <button onClick={addIng} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1">
              <Plus size={11} /> Agregar
            </button>
          </div>
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-1">
            {['Ingrediente', 'Cantidad', 'Unidad', ''].map((h, i) => (
              <div key={i} className="text-xs text-gray-400">{h}</div>
            ))}
          </div>
          {ings.map((ing, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-2">
              <input value={ing.nombre} onChange={e => updateIng(i, 'nombre', e.target.value)} placeholder="Ingrediente" />
              <input type="number" value={ing.cantidad} onChange={e => updateIng(i, 'cantidad', e.target.value)} placeholder="0" step="0.001" />
              <select value={ing.unidad} onChange={e => updateIng(i, 'unidad', e.target.value)}>
                {['kg','g','L','ml','unidad','porción'].map(u => <option key={u}>{u}</option>)}
              </select>
              <button onClick={() => removeIng(i)} className="btn-danger p-1.5"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>

        <button onClick={calcular} className="btn-primary flex items-center gap-2">
          <Scale size={14} /> Escalar producción
        </button>
      </div>

      {resultado && (
        <>
          {resultado.margen !== null && (
            resultado.margen >= 60
              ? <div className="alert-ok"><CheckCircle size={17} className="text-green-600 flex-shrink-0" /><div><strong>Margen aprobado — {resultado.margen.toFixed(1)}%</strong><div className="text-xs mt-0.5">Costo unitario: {fmt(resultado.cu)} / Precio venta: {fmt(resultado.pventa)}</div></div></div>
              : <div className="alert-bad"><AlertTriangle size={17} className="text-red-600 flex-shrink-0" /><div><strong>Violación de margen — {resultado.margen.toFixed(1)}%</strong><div className="text-xs mt-0.5">Precio mínimo requerido: {fmt(resultado.cu / 0.4)}</div></div></div>
          )}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Resultado — factor ×{resultado.factor.toFixed(2)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                ['Piezas objetivo', resultado.piezasObj],
                [`Piezas reales (−${merma||0}%)`, resultado.piezasR],
                ['Peso total masa', resultado.pesoTotal.toFixed(2) + ' kg'],
                ['Factor', '×' + resultado.factor.toFixed(2)],
              ].map(([l, v]) => (
                <div key={l} className="kpi-card">
                  <div className="text-xs text-gray-400 mb-1">{l}</div>
                  <div className="text-lg font-semibold text-gray-900">{v}</div>
                </div>
              ))}
            </div>
            {resultado.ingsEscalados.length > 0 && (
              <table className="table-base">
                <thead><tr><th>Ingrediente</th><th className="text-right">Base ({base}pz)</th><th className="text-right">Escalado ({target}pz)</th><th>Unidad</th></tr></thead>
                <tbody>
                  {resultado.ingsEscalados.map((ing, i) => (
                    <tr key={i}>
                      <td>{ing.nombre}</td>
                      <td className="text-right">{ing.cantidad}</td>
                      <td className="text-right font-medium" style={{ color: '#BA7517' }}>{ing.escalado}</td>
                      <td>{ing.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
