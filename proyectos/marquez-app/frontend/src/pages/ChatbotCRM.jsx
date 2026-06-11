import { useState, useRef, useEffect } from 'react'
import { chatBotPedidos, saveCliente, savePedido, getClientes, getPedidos } from '../lib/api'
import { Bot, Send, User, Check, AlertCircle, ShoppingBag, Phone, UserPlus, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ChatbotCRM() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy el Agente de Ventas y CRM inteligente de Marquéz Panadería.\n\nPuedes dictarme un pedido con el nombre del cliente y su teléfono. Por ejemplo:\n"Hola, soy Juan Pérez con teléfono 8877-6655, quiero pedir 2 Croissant y 1 Berlinesa".' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [detectedOrder, setDetectedOrder] = useState(null)
  
  // Stats en tiempo real a la derecha
  const [clientesRecientes, setClientesRecientes] = useState([])
  const [pedidosRecientes, setPedidosRecientes] = useState([])

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    loadCRMData()
  }, [])

  const loadCRMData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([getClientes(), getPedidos()])
      setClientesRecientes(cRes.data?.slice(0, 5) || [])
      setPedidosRecientes(pRes.data?.slice(0, 5) || [])
    } catch (e) {
      console.error(e)
    }
  }

  const enviarMensaje = async (texto) => {
    const msg = texto || input.trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatBotPedidos([...messages, userMsg])
      const { respuesta, orderData } = res.data

      setMessages(prev => [...prev, { role: 'assistant', content: respuesta }])
      
      if (orderData) {
        setDetectedOrder(orderData)
      }
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de comunicación con el chatbot. Verifica que tu backend esté corriendo.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  // Guardar pedido detectado por IA en DB real
  const handleConfirmarPedidoIA = async () => {
    if (!detectedOrder) return
    const { cliente, items, total } = detectedOrder

    if (!cliente?.nombre) {
      return toast.error('El nombre del cliente no está definido o no fue detectado correctamente.')
    }

    try {
      // 1. Verificar si el cliente ya existe por teléfono o nombre
      // Buscamos coincidencia parcial
      const cRes = await getClientes()
      const listadoClientes = cRes.data || []
      let clienteId = null

      const clienteExistente = listadoClientes.find(c => 
        (cliente.telefono && c.telefono === cliente.telefono) || 
        c.nombre.toLowerCase() === cliente.nombre.toLowerCase()
      )

      if (clienteExistente) {
        clienteId = clienteExistente.id
        toast.success(`Cliente existente detectado: ${clienteExistente.nombre}`)
      } else {
        // Registrar nuevo cliente
        const nuevoClienteRes = await saveCliente({
          nombre: cliente.nombre,
          telefono: cliente.telefono || '',
          email: '',
          direccion: '',
          notas: 'Registrado automáticamente vía Chatbot'
        })
        clienteId = nuevoClienteRes.data.id
        toast.success(`Nuevo cliente registrado: ${cliente.nombre}`)
      }

      // 2. Registrar el pedido
      await savePedido({
        cliente_id: clienteId,
        total: total || items.reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0),
        estado: 'Pendiente',
        tipo_pago: 'Efectivo',
        notas: 'Pedido capturado e ingresado por Chatbot IA',
        items: items.map(i => ({
          producto_nombre: i.producto_nombre,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario
        }))
      })

      toast.success('¡Pedido registrado en el sistema correctamente!')
      setDetectedOrder(null)
      loadCRMData()
      
      // Responder en el chat que se ha registrado
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ He registrado exitosamente el pedido en el CRM para ${cliente.nombre} por un total de C$ ${total}.`
      }])

    } catch (e) {
      console.error(e)
      toast.error('Hubo un error al registrar el pedido.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ height: 'calc(100vh - 120px)' }}>
      
      {/* Columna Izquierda: Chatbot */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full">
        {/* Cabecera Chat */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#BA7517] flex items-center justify-center text-white">
            <Bot size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Recepción de Pedidos Inteligente</div>
            <div className="text-[10px] text-green-600 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Activo · Analizando CRM
            </div>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                m.role === 'user' ? 'bg-gray-200' : 'bg-[#BA7517]'}`}>
                {m.role === 'assistant'
                  ? <Bot size={15} className="text-white" />
                  : <User size={15} className="text-gray-600" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'text-white rounded-tr-sm bg-[#BA7517]'
                  : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {m.content.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < m.content.split('\n').length - 1 ? <br /> : null}</span>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#BA7517] flex items-center justify-center flex-shrink-0">
                <Bot size={15} className="text-white" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Introduce los detalles del pedido... (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#BA7517] focus:border-[#BA7517]"
            style={{ outline: 'none' }}
          />
          <button
            onClick={() => enviarMensaje()}
            disabled={!input.trim() || loading}
            className="btn-primary bg-[#BA7517] hover:bg-[#854F0B] text-white p-2.5 rounded-xl flex-shrink-0 disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Columna Derecha: Panel de Datos CRM / Detección en vivo */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto h-full pr-1">
        
        {/* Panel de pedido detectado */}
        {detectedOrder ? (
          <div className="bg-[#FAF7F2] border border-[#EEDCC5] rounded-xl p-4 shadow-sm space-y-3 animate-fade-in flex-shrink-0">
            <h3 className="text-xs font-bold text-[#854F0B] flex items-center gap-1.5">
              <ShoppingBag size={14} /> PEDIDO DETECTADO POR IA
            </h3>
            
            {/* Detalles del cliente */}
            <div className="bg-white p-3 rounded-lg border border-gray-100 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-gray-400">Cliente</div>
              <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-green-600" /> {detectedOrder.cliente?.nombre || 'No detectado'}
              </div>
              {detectedOrder.cliente?.telefono && (
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Phone size={10} /> {detectedOrder.cliente.telefono}
                </div>
              )}
            </div>

            {/* Artículos */}
            <div className="bg-white p-3 rounded-lg border border-gray-100 space-y-2">
              <div className="text-[10px] uppercase font-bold text-gray-400">Productos</div>
              <div className="space-y-1">
                {detectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-xs text-gray-700 py-0.5 border-b border-gray-50 last:border-b-0">
                    <span>{item.cantidad}x {item.producto_nombre}</span>
                    <span className="font-semibold text-gray-900">C$ {(item.cantidad * item.precio_unitario).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-gray-100 text-xs">
                <span className="font-bold text-gray-800">Total calculado</span>
                <span className="font-black text-gray-900 text-sm">C$ {detectedOrder.total?.toLocaleString() || 0}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setDetectedOrder(null)}
                className="flex-1 btn-secondary text-xs py-2 border border-gray-200"
              >
                Descartar
              </button>
              <button 
                onClick={handleConfirmarPedidoIA}
                className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <Check size={14} /> Confirmar & Registrar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center py-6 text-gray-400 flex-shrink-0">
            <AlertCircle size={28} className="text-gray-300 mb-2" />
            <div className="text-xs font-bold">Esperando pedido en el chat</div>
            <div className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
              Escribe un mensaje en el chat con los datos de un cliente y productos para que la IA extraiga el pedido automáticamente.
            </div>
          </div>
        )}

        {/* Clientes recientes en el CRM */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1 overflow-hidden flex flex-col min-h-[180px]">
          <h4 className="text-xs font-bold text-gray-800 mb-2.5 flex items-center justify-between">
            <span>Clientes Recientes CRM</span>
            <span className="text-[9px] bg-gray-100 text-gray-500 py-0.5 px-1.5 rounded-full font-bold">Últimos 5</span>
          </h4>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {clientesRecientes.length === 0 ? (
              <div className="text-[11px] text-gray-400 text-center py-4">No hay clientes aún.</div>
            ) : (
              clientesRecientes.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="text-xs font-semibold text-gray-800 truncate pr-2">{c.nombre}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{c.telefono || '—'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pedidos recientes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1 overflow-hidden flex flex-col min-h-[180px]">
          <h4 className="text-xs font-bold text-gray-800 mb-2.5 flex items-center justify-between">
            <span>Últimos Pedidos</span>
            <span className="text-[9px] bg-gray-100 text-gray-500 py-0.5 px-1.5 rounded-full font-bold">Últimos 5</span>
          </h4>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {pedidosRecientes.length === 0 ? (
              <div className="text-[11px] text-gray-400 text-center py-4">No hay pedidos aún.</div>
            ) : (
              pedidosRecientes.map(p => (
                <div key={p.id} className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex justify-between items-center">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-gray-800 truncate">{p.cliente_nombre || 'Cliente sin nombre'}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {p.items?.map(i => `${i.cantidad}x ${i.producto_nombre}`).join(', ')}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-gray-900">C$ {Number(p.total).toLocaleString()}</div>
                    <div className="text-[9px] bg-amber-50 text-amber-700 px-1 rounded font-medium mt-0.5 inline-block">{p.estado}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
