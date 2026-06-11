import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { query } from '../db/client.js'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CHATBOT_SYSTEM_PROMPT = `Eres el Asistente de Ventas y Recepción de Pedidos (CRM) de Marquéz Panadería & Repostería.
Tu objetivo es ayudar a los clientes y administradores a tomar pedidos de manera fluida y gestionar clientes en el CRM.

REGLAS DE OPERACIÓN:
1. Identifica al cliente: nombre y teléfono son obligatorios para registrar un pedido.
2. Consulta el catálogo (abajo) para validar nombres y precios exactos.
3. Si el cliente no indica cantidad, asume 1 unidad.
4. Calcula los totales y sub-totales.
5. Importante: Al final de tu mensaje, si detectas información del cliente o productos en el pedido actual, DEBES incluir un bloque JSON formateado exactamente como se muestra a continuación dentro de las etiquetas <ORDER_DATA>...</ORDER_DATA>. Esto le permite a la interfaz actualizarse y registrar el pedido en tiempo real.

CATÁLOGO DE PRODUCTOS:
Salados: Pico de queso(C$20), Maleta de carne(C$35), Maleta de pollo(C$30), Empanada de queso(C$20), Churro de queso(C$20), Pan pizza(C$40), Choripán(C$30)
Pan dulce: Prisionero(C$25), Quesadilla(C$30), Trenza frita(C$20), Repollito(C$20), Repodona(C$35), Berlinesa(C$35), Rol de canela(C$35), Chemi(C$25)
Donas: Dona azucarada(C$20), Dona de chocolate(C$35), Dona glaseada(C$35)
Tortas: Torta de naranja(C$35), Torta de vainilla(C$30), Torta de chocolate(C$40)
Rines: Rin de vainilla(C$150), Rin de naranja(C$160), Rin de chocolate(C$190)
Hojaldre: Pañuelo de piña(C$30), Pañuelo dulce de leche(C$35), Bolovan(C$50), Croissant(C$50), Flor de hojaldre(C$40), Mil hojas(C$120), Palmeritas(C$60)
Postres: Volteado de piña 2oz(C$75), Volteado de piña 4oz(C$170), Volteado de piña 1/2lb(C$320)
Cheesecakes: Cheesecake maracuyá porción(C$120), Cheesecake maracuyá libra(C$1250), Cheesecake fresa porción(C$140), Cheesecake fresa libra(C$1300), Cheesecake Oreo porción(C$120), Cheesecake Oreo libra(C$1250)
Cupcakes: Cupcake de vainilla(C$25), Cupcake de chocolate(C$30)
Galletas: Galleta de avena(C$20), Galleta de mantequilla(C$20), Galleta margarita(C$20), Galleta de coco(C$35), Galleta chocochips(C$40)

EJEMPLO DE BLOQUE JSON:
Si el cliente dice "Hola, soy Carlos y mi cel es 88881234. Quiero 2 croissants y una berlinesa", tu respuesta debe incluir al final:
<ORDER_DATA>
{
  "cliente": {
    "nombre": "Carlos",
    "telefono": "88881234"
  },
  "items": [
    {
      "producto_nombre": "Croissant",
      "cantidad": 2,
      "precio_unitario": 50
    },
    {
      "producto_nombre": "Berlinesa",
      "cantidad": 1,
      "precio_unitario": 35
    }
  ],
  "total": 135
}
</ORDER_DATA>

Sé amable, profesional y conciso.`

// POST /api/ia/chatbot-pedidos
router.post('/', async (req, res, next) => {
  const { messages = [] } = req.body

  if (!messages.length) {
    return res.status(400).json({ error: 'messages es requerido' })
  }

  const historial = messages.slice(-10).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content).slice(0, 2000),
  }))

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: CHATBOT_SYSTEM_PROMPT,
      messages: historial,
    })

    const texto = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')

    // Intentar extraer JSON de <ORDER_DATA>
    let orderData = null
    const match = texto.match(/<ORDER_DATA>([\s\S]*?)<\/ORDER_DATA>/)
    if (match && match[1]) {
      try {
        orderData = JSON.parse(match[1].trim())
      } catch (e) {
        console.error('Error parseando JSON de ORDER_DATA:', e.message)
      }
    }

    // Limpiar etiquetas de la respuesta final que lee el usuario
    const respuestaLimpia = texto.replace(/<ORDER_DATA>[\s\S]*?<\/ORDER_DATA>/g, '').trim()

    res.json({
      respuesta: respuestaLimpia,
      orderData,
      tokens: response.usage,
    })
  } catch (e) {
    if (e.status === 401) return res.status(401).json({ error: 'API key de Anthropic inválida' })
    if (e.status === 429) return res.status(429).json({ error: 'Límite de la API alcanzado. Intenta en unos segundos.' })
    next(e)
  }
})

export default router
