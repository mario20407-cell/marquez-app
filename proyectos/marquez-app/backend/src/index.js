import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import catalogoRoutes   from './routes/catalogo.js'
import recetasRoutes    from './routes/recetas.js'
import costeosRoutes    from './routes/costeos.js'
import inventarioRoutes from './routes/inventario.js'
import comprasRoutes    from './routes/compras.js'
import iaRoutes         from './routes/ia.js'
import exportarRoutes   from './routes/exportar.js'
import ventasRoutes     from './routes/ventas.js'
import iaChatbotRoutes  from './routes/iaChatbot.js'

const app = express()
const PORT = process.env.PORT || 3001

// ── Seguridad ─────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}))

// Rate limiting estricto para la IA
const iaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas consultas a la IA. Espera un minuto.' },
})

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(morgan('dev'))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/catalogo',   catalogoRoutes)
app.use('/api/recetas',    recetasRoutes)
app.use('/api/costeos',    costeosRoutes)
app.use('/api/inventario', inventarioRoutes)
app.use('/api/compras',    comprasRoutes)
app.use('/api/ia',         iaLimiter, iaRoutes)
app.use('/api/ia-chatbot', iaLimiter, iaChatbotRoutes)
app.use('/api/ventas',     ventasRoutes)
app.use('/api/exportar',   exportarRoutes)

// Health check
app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  version: '2.0',
  negocio: 'Marquéz Panadería & Repostería',
  timestamp: new Date().toISOString(),
}))

// ── Manejo de errores ─────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

app.listen(PORT, () => {
  console.log(`\n🥐 Maestro Panadero IA — Marquéz Backend`)
  console.log(`   Servidor: http://localhost:${PORT}`)
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}\n`)
})

export default app
