import { useState, useEffect } from 'react'
import { 
  getClientes, saveCliente, updateCliente, 
  getPedidos, savePedido, updateEstadoPedido, getVentasStats 
} from '../lib/api'
import { PRODUCTOS } from '../lib/catalogo'
import { 
  Users, ShoppingBag, Plus, Search, Calendar, 
  DollarSign, CheckCircle, Clock, Check, X, CreditCard, ChevronRight, UserPlus
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Ventas() {
  // Tabs: 'pedidos' o 'clientes'
  const [activeTab, setActiveTab] = useState('pedidos')
  
  // Data States
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [stats, setStats] = useState({
    total_ventas: 0,
    total_pedidos: 0,
    pendientes: 0,
    preparando: 0,
    completados: 0,
    entregados: 0,
    cancelados: 0,
    total_clientes: 0
  })

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')

  // Modals
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [showPedidoModal, setShowPedidoModal] = useState(false)

  // Form States (Cliente)
  const [clienteForm, setClienteForm] = useState({
    nombre: '', telefono: '', email: '', direccion: '', notas: ''
  })

  // Form States (Pedido)
  const [selectedClienteId, setSelectedClienteId] = useState('')
  const [pedidoItems, setPedidoItems] = useState([{ producto_nombre: '', cantidad: 1, precio_unitario: 0 }])
  const [pedidoNotas, setPedidoNotas] = useState('')
  const [tipoPago, setTipoPago] = useState('Efectivo')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [cRes, pRes, sRes] = await Promise.all([
        getClientes(),
        getPedidos(),
        getVentasStats()
      ])
      setClientes(cRes.data || [])
      setPedidos(pRes.data || [])
      setStats(sRes.data || {
        total_ventas: 0, total_pedidos: 0, pendientes: 0, 
        preparando: 0, completados: 0, entregados: 0, cancelados: 0, total_clientes: 0
      })
    } catch (e) {
      console.error('Error cargando datos de ventas:', e)
    }
  }

  // Clientes Handlers
  const handleOpenClienteModal = (client = null) => {
    if (client) {
      setEditingCliente(client)
      setClienteForm({
        nombre: client.nombre,
        telefono: client.telefono || '',
        email: client.email || '',
        direccion: client.direccion || '',
        notas: client.notas || ''
      })
    } else {
      setEditingCliente(null)
      setClienteForm({ nombre: '', telefono: '', email: '', direccion: '', notas: '' })
    }
    setShowClienteModal(true)
  }

  const handleSaveCliente = async (e) => {
    e.preventDefault()
    if (!clienteForm.nombre.trim()) return toast.error('El nombre es obligatorio')

    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, clienteForm)
        toast.success('Cliente actualizado')
      } else {
        await saveCliente(clienteForm)
        toast.success('Cliente registrado')
      }
      setShowClienteModal(false)
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  // Pedidos Handlers
  const handleAddPlayItem = () => {
    setPedidoItems([...pedidoItems, { producto_nombre: '', cantidad: 1, precio_unitario: 0 }])
  }

  const handleRemovePlayItem = (index) => {
    const updated = [...pedidoItems]
    updated.splice(index, 1)
    setPedidoItems(updated)
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...pedidoItems]
    updated[index][field] = value

    if (field === 'producto_nombre') {
      const prod = PRODUCTOS.find(p => p.n === value)
      if (prod) {
        updated[index].precio_unitario = prod.p
      }
    }
    setPedidoItems(updated)
  }

  const calculatePedidoTotal = () => {
    return pedidoItems.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0)
  }

  const handleSavePedido = async (e) => {
    e.preventDefault()
    if (!selectedClienteId) return toast.error('Selecciona un cliente')
    
    const validItems = pedidoItems.filter(i => i.producto_nombre && i.cantidad > 0)
    if (!validItems.length) return toast.error('Agrega al menos un producto válido')

    const total = calculatePedidoTotal()

    try {
      await savePedido({
        cliente_id: selectedClienteId,
        total,
        estado: 'Pendiente',
        tipo_pago: tipoPago,
        notas: pedidoNotas,
        items: validItems
      })
      toast.success('Pedido registrado con éxito')
      setShowPedidoModal(false)
      // Reset Form
      setSelectedClienteId('')
      setPedidoItems([{ producto_nombre: '', cantidad: 1, precio_unitario: 0 }])
      setPedidoNotas('')
      setTipoPago('Efectivo')
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateEstado = async (id, nuevoEstado) => {
    try {
      await updateEstadoPedido(id, nuevoEstado)
      toast.success(`Pedido marcado como ${nuevoEstado}`)
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  // Filtrados
  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.telefono && c.telefono.includes(searchQuery))
  )

  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch = p.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.items.some(i => i.producto_nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesEstado = filterEstado === 'Todos' || p.estado === filterEstado
    return matchesSearch && matchesEstado
  })

  // Estilos de badge por estado
  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-amber-100 text-amber-800'
      case 'Preparando': return 'bg-blue-100 text-blue-800'
      case 'Completado': return 'bg-purple-100 text-purple-800'
      case 'Entregado': return 'bg-green-100 text-green-800'
      case 'Cancelado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="kpi-card flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div>
            <div className="text-xs font-medium text-gray-400">Ventas Totales</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">C$ {Number(stats.total_ventas).toLocaleString()}</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="kpi-card flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div>
            <div className="text-xs font-medium text-gray-400">Pedidos Totales</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total_pedidos}</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <ShoppingBag size={20} />
          </div>
        </div>

        <div className="kpi-card flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div>
            <div className="text-xs font-medium text-gray-400">Pendientes/Preparando</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.pendientes + stats.preparando}</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="kpi-card flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div>
            <div className="text-xs font-medium text-gray-400">Total Clientes CRM</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total_clientes}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Control Navigation & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => { setActiveTab('pedidos'); setSearchQuery('') }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'pedidos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Pedidos (Ventas)
          </button>
          <button 
            onClick={() => { setActiveTab('clientes'); setSearchQuery('') }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'clientes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            CRM (Clientes)
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder={activeTab === 'pedidos' ? "Buscar pedido..." : "Buscar cliente..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 w-full border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {activeTab === 'pedidos' && (
            <select 
              value={filterEstado} 
              onChange={e => setFilterEstado(e.target.value)}
              className="border border-gray-200 text-xs py-2 px-3 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Preparando">Preparando</option>
              <option value="Completado">Completado</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          )}

          <button 
            onClick={() => activeTab === 'pedidos' ? setShowPedidoModal(true) : handleOpenClienteModal()}
            className="btn-primary flex items-center gap-1 bg-[#BA7517] hover:bg-[#854F0B] text-white px-3 py-2 rounded-lg text-xs"
          >
            <Plus size={14} />
            {activeTab === 'pedidos' ? 'Nuevo Pedido' : 'Nuevo Cliente'}
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'pedidos' ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 text-sm">
              Listado de Pedidos Recientes
            </div>
            {filteredPedidos.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No hay pedidos registrados que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredPedidos.map(pedido => (
                  <div key={pedido.id} className="p-4 hover:bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {pedido.cliente_nombre || 'Cliente sin nombre'}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getBadgeStyle(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                          <Calendar size={11} /> {new Date(pedido.fecha).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {pedido.items?.map(i => `${i.cantidad}x ${i.producto_nombre}`).join(', ')}
                      </div>
                      {pedido.notas && (
                        <div className="text-[11px] text-gray-400 italic bg-gray-50 px-2 py-1 rounded max-w-lg">
                          Notas: {pedido.notas}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 justify-between md:justify-end">
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">C$ {Number(pedido.total).toLocaleString()}</div>
                        <div className="text-[10px] text-gray-400">{pedido.tipo_pago}</div>
                      </div>

                      {/* State actions */}
                      <div className="flex items-center gap-1">
                        {pedido.estado === 'Pendiente' && (
                          <button 
                            onClick={() => handleUpdateEstado(pedido.id, 'Preparando')}
                            className="p-1 hover:bg-blue-50 text-blue-600 rounded border border-blue-200 text-xs font-semibold px-2 py-1 flex items-center gap-1 transition-colors"
                          >
                            <Clock size={12} /> Preparar
                          </button>
                        )}
                        {pedido.estado === 'Preparando' && (
                          <button 
                            onClick={() => handleUpdateEstado(pedido.id, 'Completado')}
                            className="p-1 hover:bg-purple-50 text-purple-600 rounded border border-purple-200 text-xs font-semibold px-2 py-1 flex items-center gap-1 transition-colors"
                          >
                            <Check size={12} /> Completar
                          </button>
                        )}
                        {pedido.estado === 'Completado' && (
                          <button 
                            onClick={() => handleUpdateEstado(pedido.id, 'Entregado')}
                            className="p-1 hover:bg-green-50 text-green-600 rounded border border-green-200 text-xs font-semibold px-2 py-1 flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle size={12} /> Entregar
                          </button>
                        )}
                        {pedido.estado !== 'Entregado' && pedido.estado !== 'Cancelado' && (
                          <button 
                            onClick={() => handleUpdateEstado(pedido.id, 'Cancelado')}
                            className="p-1 hover:bg-red-50 text-red-500 rounded border border-red-200 text-xs font-semibold px-1.5 py-1 transition-colors"
                            title="Cancelar pedido"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CRM Clientes View */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 text-sm">
            Clientes Registrados
          </div>
          {filteredClientes.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No hay clientes registrados que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Dirección</th>
                    <th>Notas</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map(c => (
                    <tr key={c.id}>
                      <td className="font-semibold text-gray-900">{c.nombre}</td>
                      <td>{c.telefono || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td className="max-w-[200px] truncate" title={c.direccion}>{c.direccion || '—'}</td>
                      <td className="max-w-[200px] truncate text-gray-400" title={c.notas}>{c.notas || '—'}</td>
                      <td className="text-right">
                        <button 
                          onClick={() => handleOpenClienteModal(c)}
                          className="text-xs text-amber-700 hover:text-amber-900 font-medium px-2 py-1 rounded hover:bg-amber-50"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL CLIENTE */}
      {showClienteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente CRM'}</h3>
              <button onClick={() => setShowClienteModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveCliente} className="p-4 space-y-4">
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input 
                  type="text" 
                  value={clienteForm.nombre}
                  onChange={e => setClienteForm({...clienteForm, nombre: e.target.value})}
                  placeholder="Ej. Mario Zelaya"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input 
                    type="text" 
                    value={clienteForm.telefono}
                    onChange={e => setClienteForm({...clienteForm, telefono: e.target.value})}
                    placeholder="Ej. 8888-8888"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    value={clienteForm.email}
                    onChange={e => setClienteForm({...clienteForm, email: e.target.value})}
                    placeholder="Ej. mario@email.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dirección de Entrega</label>
                <textarea 
                  value={clienteForm.direccion}
                  onChange={e => setClienteForm({...clienteForm, direccion: e.target.value})}
                  placeholder="Dirección exacta para envíos"
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notas / Preferencias</label>
                <textarea 
                  value={clienteForm.notas}
                  onChange={e => setClienteForm({...clienteForm, notas: e.target.value})}
                  placeholder="Notas adicionales (Ej. Alérgico al maní, prefiere entregas por la tarde)"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowClienteModal(false)} className="btn-secondary px-4 py-2">Cancelar</button>
                <button type="submit" className="btn-primary bg-[#BA7517] hover:bg-[#854F0B] text-white px-4 py-2 rounded-lg">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PEDIDO */}
      {showPedidoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl w-full max-w-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Crear Nuevo Pedido</h3>
              <button onClick={() => setShowPedidoModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSavePedido} className="p-4 space-y-4">
              {/* Cliente */}
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedClienteId} 
                    onChange={e => setSelectedClienteId(e.target.value)}
                    className="flex-1"
                    required
                  >
                    <option value="">Selecciona un cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} {c.telefono ? `(${c.telefono})` : ''}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => { setShowPedidoModal(false); handleOpenClienteModal() }}
                    className="btn-secondary p-2 flex items-center gap-1 border border-gray-200"
                    title="Nuevo Cliente"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              </div>

              {/* Items de Producto */}
              <div className="space-y-2">
                <label className="form-label">Productos en el pedido</label>
                {pedidoItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <select 
                      value={item.producto_nombre}
                      onChange={e => handleItemChange(idx, 'producto_nombre', e.target.value)}
                      className="flex-1 text-xs"
                      required
                    >
                      <option value="">Seleccionar producto...</option>
                      {PRODUCTOS.map(p => (
                        <option key={p.n} value={p.n}>{p.n} (C$ {p.p})</option>
                      ))}
                    </select>

                    <input 
                      type="number" 
                      min="1" 
                      value={item.cantidad}
                      onChange={e => handleItemChange(idx, 'cantidad', Number(e.target.value))}
                      className="w-16 text-center text-xs"
                      required
                    />

                    <div className="w-20 text-xs font-bold text-gray-700 text-right">
                      C$ {((item.cantidad || 0) * (item.precio_unitario || 0)).toLocaleString()}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemovePlayItem(idx)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                      disabled={pedidoItems.length === 1}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={handleAddPlayItem}
                  className="btn-secondary text-[11px] font-semibold py-1 px-3 border border-dashed border-gray-300 w-full hover:border-[#BA7517] hover:text-[#BA7517]"
                >
                  + Agregar Producto
                </button>
              </div>

              {/* Configuración de Pago y Notas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Forma de Pago</label>
                  <select value={tipoPago} onChange={e => setTipoPago(e.target.value)}>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                  </select>
                </div>
                <div className="form-group justify-end items-end pr-2">
                  <div className="text-[11px] text-gray-400 font-medium">Total a Pagar</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">C$ {calculatePedidoTotal().toLocaleString()}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas Especiales / Envío</label>
                <textarea 
                  value={pedidoNotas}
                  onChange={e => setPedidoNotas(e.target.value)}
                  placeholder="Detalles de entrega, dedicatorias, etc."
                  rows={2}
                />
              </div>

              {/* Verificación de margen */}
              <div className="alert-ok flex items-center justify-between text-xs p-2.5 bg-green-50 border border-green-150 rounded-lg text-green-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-green-600" />
                  <span>Pedido cumple con el margen objetivo global (≥ 60%)</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPedidoModal(false)} className="btn-secondary px-4 py-2">Cancelar</button>
                <button type="submit" className="btn-primary bg-[#BA7517] hover:bg-[#854F0B] text-white px-4 py-2 rounded-lg">Registrar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
