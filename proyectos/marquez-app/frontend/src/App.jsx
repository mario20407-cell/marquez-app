import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Catalogo from './pages/Catalogo'
import Recetas from './pages/Recetas'
import Costeo from './pages/Costeo'
import Escalado from './pages/Escalado'
import Inventario from './pages/Inventario'
import Compras from './pages/Compras'
import IAChat from './pages/IAChat'
import Exportar from './pages/Exportar'
import Ventas from './pages/Ventas'
import ChatbotCRM from './pages/ChatbotCRM'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/chatbot-crm" element={<ChatbotCRM />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/recetas" element={<Recetas />} />
        <Route path="/costeo" element={<Costeo />} />
        <Route path="/escalado" element={<Escalado />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/ia" element={<IAChat />} />
        <Route path="/exportar" element={<Exportar />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App