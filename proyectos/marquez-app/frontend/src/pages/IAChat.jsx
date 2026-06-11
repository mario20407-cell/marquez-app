import { useState, useRef, useEffect } from 'react'
import { chatIA } from '../lib/api'
import { useRecetas } from '../hooks/useRecetas'
import { Bot, Send, User } from 'lucide-react'

const SUGERENCIAS = [
  '¿Qué productos tienen mayor margen potencial?',
  '¿Cómo calculo el precio mínimo con 60% de margen?',
  '¿Cuándo debo reponer un insumo?',
  '¿Cómo reduzco el desperdicio en producción?',
  'Explícame la diferencia entre costo directo e indirecto',
  '¿Qué cheesecake es más rentable vender por porción o por libra?',
]

export default function IAChat() {
  const { recetas } = useRecetas()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola. Soy el Maestro Panadero IA Marquéz. Tengo acceso al catálogo completo de 49 productos y tus recetas guardadas. ¿En qué te puedo ayudar hoy?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const enviar = async (texto) => {
    const msg = texto || input.trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const context = {
        recetasActivas: Object.keys(recetas).length > 0
          ? Object.keys(recetas).join(', ')
          : 'Ninguna cargada aún',
      }

      const { data } = await chatIA([...messages, userMsg], context)
      setMessages(prev => [...prev, { role: 'assistant', content: data.respuesta }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión con la IA. Verifica que el backend esté corriendo y la API key esté configurada.'
      }])
    } finally {
      setLoading(false) }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  return (
    <div className="max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              m.role === 'user' ? 'bg-gray-200' : ''}`}
              style={m.role === 'assistant' ? { background: '#BA7517' } : {}}>
              {m.role === 'assistant'
                ? <Bot size={14} className="text-white" />
                : <User size={14} className="text-gray-600" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'text-white rounded-tr-sm'
                : 'bg-white border border-gray-100 shadow-card text-gray-800 rounded-tl-sm'
            }`} style={m.role === 'user' ? { background: '#BA7517' } : {}}>
              {m.content.split('\n').map((line, j) => (
                <span key={j}>{line}{j < m.content.split('\n').length - 1 ? <br /> : null}</span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#BA7517' }}>
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-card rounded-2xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#BA7517', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias */}
      {messages.length <= 1 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {SUGERENCIAS.map((s, i) => (
            <button key={i} onClick={() => enviar(s)}
              className="btn-secondary text-xs px-2 py-1.5 text-left leading-tight">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-2 shadow-card">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu pregunta... (Enter para enviar)"
          rows={1}
          className="flex-1 resize-none border-none bg-transparent focus:ring-0 text-sm py-1 px-1"
          style={{ outline: 'none' }}
        />
        <button
          onClick={() => enviar()}
          disabled={!input.trim() || loading}
          className="btn-primary p-2 rounded-lg flex-shrink-0 disabled:opacity-40">
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
