import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, ChefHat, Calculator, Scale,
  Package, Receipt, Bot, Download, Menu, X, Croissant,
  ShoppingBag, MessageSquare
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ventas',      icon: ShoppingBag,     label: 'Ventas & CRM', badge: 'NUEVO' },
  { to: '/chatbot-crm', icon: MessageSquare,   label: 'Chatbot CRM',  badge: 'IA' },
  { to: '/catalogo',    icon: BookOpen,         label: 'Catálogo' },
  { to: '/recetas',     icon: ChefHat,          label: 'Recetas',   badge: 'CLAVE' },
  { to: '/costeo',      icon: Calculator,       label: 'Costeo' },
  { to: '/escalado',    icon: Scale,            label: 'Escalado' },
  { to: '/inventario',  icon: Package,          label: 'Inventario' },
  { to: '/compras',     icon: Receipt,          label: 'Compras' },
  { to: '/ia',          icon: Bot,              label: 'Consultar IA' },
  { to: '/exportar',    icon: Download,         label: 'Exportar' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const currentPage = NAV.find(n => location.pathname.startsWith(n.to))?.label || 'Marquéz'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-100
        flex flex-col transition-transform duration-200 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#BA7517' }}>
            <Croissant size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 leading-tight">Marquéz</div>
            <div className="text-xs text-gray-400 leading-tight">Maestro Panadero IA</div>
          </div>
          <button className="ml-auto lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: '#EF9F27', color: '#412402' }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-xs text-gray-400">v2.0 · Margen objetivo ≥60%</div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-semibold text-gray-900">{currentPage}</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-md font-medium"
              style={{ background: '#EAF3DE', color: '#27500A' }}>
              Margen objetivo: ≥60%
            </span>
          </div>
        </header>

        {/* Página activa */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
