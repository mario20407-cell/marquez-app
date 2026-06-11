-- ============================================================
-- Marquéz Panadería & Repostería — Esquema de Base de Datos
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Catálogo de productos ────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      VARCHAR(120) NOT NULL UNIQUE,
  precio      NUMERIC(10,2) NOT NULL,
  presentacion VARCHAR(50) DEFAULT 'unidad',
  categoria   VARCHAR(60),
  activo      BOOLEAN DEFAULT true,
  creado_en   TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ── Recetas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recetas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto        VARCHAR(120) NOT NULL UNIQUE REFERENCES productos(nombre) ON UPDATE CASCADE,
  piezas          INTEGER NOT NULL DEFAULT 100,
  peso_por_pieza  NUMERIC(8,2) DEFAULT 0,
  merma_pct       NUMERIC(5,2) DEFAULT 0,
  notas           TEXT,
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Ingredientes de receta ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredientes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receta_id  UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  nombre     VARCHAR(100) NOT NULL,
  cantidad   NUMERIC(12,4) NOT NULL,
  unidad     VARCHAR(20) DEFAULT 'kg',
  precio     NUMERIC(10,4) DEFAULT 0,
  tipo       VARCHAR(20) DEFAULT 'directo' CHECK (tipo IN ('directo','indirecto')),
  orden      INTEGER DEFAULT 0
);

-- ── Costeos guardados ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS costeos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto       VARCHAR(120) NOT NULL,
  piezas_obj     INTEGER NOT NULL,
  piezas_reales  INTEGER,
  costo_directo  NUMERIC(12,2),
  costo_indirecto NUMERIC(12,2),
  costo_total    NUMERIC(12,2),
  costo_unitario NUMERIC(12,4),
  precio_venta   NUMERIC(10,2),
  margen_pct     NUMERIC(6,2),
  utilidad_neta  NUMERIC(12,2),
  aprobado       BOOLEAN,
  factor_escala  NUMERIC(8,4),
  creado_en      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Inventario ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(100) NOT NULL UNIQUE,
  existencia      NUMERIC(12,3) NOT NULL DEFAULT 0,
  unidad          VARCHAR(20) DEFAULT 'kg',
  consumo_diario  NUMERIC(12,3) DEFAULT 0,
  punto_reposicion NUMERIC(12,3) DEFAULT 0,
  costo_unitario  NUMERIC(10,4) DEFAULT 0,
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Facturas de compras ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS facturas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proveedor   VARCHAR(120),
  fecha       DATE DEFAULT CURRENT_DATE,
  total       NUMERIC(12,2),
  notas       TEXT,
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factura_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factura_id      UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  producto        VARCHAR(120),
  cantidad        NUMERIC(10,3),
  precio_actual   NUMERIC(10,4),
  precio_anterior NUMERIC(10,4),
  variacion_pct   NUMERIC(6,2),
  alerta          BOOLEAN DEFAULT false
);

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_costeos_producto    ON costeos(producto);
CREATE INDEX IF NOT EXISTS idx_costeos_creado_en   ON costeos(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_ingredientes_receta ON ingredientes(receta_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha      ON facturas(fecha DESC);

-- ── Función: actualizar timestamp automáticamente ─────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.actualizado_en = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_recetas_ts
  BEFORE UPDATE ON recetas
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE OR REPLACE TRIGGER trg_inventario_ts
  BEFORE UPDATE ON inventario
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ── Clientes (CRM) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(120) NOT NULL,
  telefono        VARCHAR(30),
  email           VARCHAR(120),
  direccion       TEXT,
  notas           TEXT,
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Pedidos (Ventas) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  fecha           TIMESTAMPTZ DEFAULT NOW(),
  total           NUMERIC(10,2) NOT NULL,
  estado          VARCHAR(30) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Preparando', 'Completado', 'Entregado', 'Cancelado')),
  tipo_pago       VARCHAR(30) DEFAULT 'Efectivo',
  notas           TEXT,
  creado_en       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Detalle del Pedido ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_nombre VARCHAR(120) NOT NULL,
  cantidad        INTEGER NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL
);

-- Indices adicionales
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);

CREATE OR REPLACE TRIGGER trg_clientes_ts
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
