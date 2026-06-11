import { Router } from 'express'
import { query, transaction } from '../db/client.js'

const router = Router()

// ── CLIENTES (CRM) ────────────────────────────────────────────────────────────

// Listar todos los clientes
router.get('/clientes', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM clientes ORDER BY nombre ASC')
    res.json(rows)
  } catch (e) {
    next(e)
  }
})

// Crear un cliente nuevo
router.post('/clientes', async (req, res, next) => {
  const { nombre, telefono, email, direccion, notas } = req.body
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' })
  }
  try {
    const { rows } = await query(
      `INSERT INTO clientes (nombre, telefono, email, direccion, notas)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, telefono, email, direccion, notas]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    next(e)
  }
})

// Actualizar un cliente
router.put('/clientes/:id', async (req, res, next) => {
  const { id } = req.params
  const { nombre, telefono, email, direccion, notas } = req.body
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' })
  }
  try {
    const { rows } = await query(
      `UPDATE clientes 
       SET nombre = $1, telefono = $2, email = $3, direccion = $4, notas = $5, actualizado_en = NOW()
       WHERE id = $6
       RETURNING *`,
      [nombre, telefono, email, direccion, notas, id]
    )
    if (!rows.length) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    res.json(rows[0])
  } catch (e) {
    next(e)
  }
})

// ── PEDIDOS (VENTAS) ──────────────────────────────────────────────────────────

// Listar todos los pedidos (con items)
router.get('/pedidos', async (req, res, next) => {
  try {
    const { rows: pedidos } = await query(`
      SELECT p.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono 
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.fecha DESC
    `)

    // Obtener los items de cada pedido
    const { rows: items } = await query('SELECT * FROM pedido_items')
    
    // Mapear items a sus respectivos pedidos
    const resultado = pedidos.map(p => ({
      ...p,
      items: items.filter(i => i.pedido_id === p.id)
    }))

    res.json(resultado)
  } catch (e) {
    next(e)
  }
})

// Crear un pedido (con transacción)
router.post('/pedidos', async (req, res, next) => {
  const { cliente_id, total, estado = 'Pendiente', tipo_pago = 'Efectivo', notas, items = [] } = req.body

  if (!items.length) {
    return res.status(400).json({ error: 'El pedido debe tener al menos un producto' })
  }

  try {
    const result = await transaction(async (client) => {
      // 1. Insertar el pedido principal
      const { rows: pedidoRows } = await client.query(
        `INSERT INTO pedidos (cliente_id, total, estado, tipo_pago, notas)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [cliente_id, total, estado, tipo_pago, notas]
      )
      const nuevoPedido = pedidoRows[0]

      // 2. Insertar cada item
      const itemPromises = items.map(item => {
        const subtotal = item.cantidad * item.precio_unitario
        return client.query(
          `INSERT INTO pedido_items (pedido_id, producto_nombre, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [nuevoPedido.id, item.producto_nombre, item.cantidad, item.precio_unitario, subtotal]
        )
      })

      const itemResults = await Promise.all(itemPromises)
      nuevoPedido.items = itemResults.map(r => r.rows[0])

      return nuevoPedido
    })

    res.status(201).json(result)
  } catch (e) {
    next(e)
  }
})

// Actualizar el estado de un pedido
router.put('/pedidos/:id/estado', async (req, res, next) => {
  const { id } = req.params
  const { estado } = req.body

  const estadosValidos = ['Pendiente', 'Preparando', 'Completado', 'Entregado', 'Cancelado']
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado de pedido no válido' })
  }

  try {
    const { rows } = await query(
      `UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *`,
      [estado, id]
    )
    if (!rows.length) {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }
    res.json(rows[0])
  } catch (e) {
    next(e)
  }
})

// Estadísticas de ventas
router.get('/pedidos/stats', async (req, res, next) => {
  try {
    const statsQuery = `
      SELECT 
        COALESCE(SUM(total), 0)::numeric(12,2) as total_ventas,
        COUNT(*)::integer as total_pedidos,
        COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END)::integer as pendientes,
        COUNT(CASE WHEN estado = 'Preparando' THEN 1 END)::integer as preparando,
        COUNT(CASE WHEN estado = 'Completado' THEN 1 END)::integer as completados,
        COUNT(CASE WHEN estado = 'Entregado' THEN 1 END)::integer as entregados,
        COUNT(CASE WHEN estado = 'Cancelado' THEN 1 END)::integer as cancelados
      FROM pedidos
    `
    const { rows: stats } = await query(statsQuery)
    const { rows: clientesCount } = await query('SELECT COUNT(*)::integer as count FROM clientes')

    res.json({
      ...stats[0],
      total_clientes: clientesCount[0].count
    })
  } catch (e) {
    next(e)
  }
})

export default router
