import { useState } from 'react'
import { LayoutDashboard, Users, Activity, MessageSquare, LogOut, Menu, X, Dumbbell } from 'lucide-react'

interface Props {
  children: React.ReactNode
  seccion: string
  setSeccion: (s: string) => void
  onLogout: () => void
}

export default function Layout({ children, seccion, setSeccion, onLogout }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'cuentas', label: 'Cuentas', icon: <Users size={20} /> },
    { id: 'sesiones', label: 'Sesiones', icon: <Activity size={20} /> },
    { id: 'ejercicios', label: 'Ejercicios', icon: <Dumbbell size={20} /> },
    { id: 'mensajes', label: 'Mensajes', icon: <MessageSquare size={20} /> },
  ]

  function seleccionar(id: string) {
    setSeccion(id)
    setMenuAbierto(false) // cerrar menú en móvil al elegir
  }

  return (
    <div className="flex min-h-screen relative">
      {/* Botón hamburguesa — solo en móvil */}
      <button
        onClick={() => setMenuAbierto(true)}
        aria-label="Abrir menú"
        className="lg:hidden fixed top-4 left-4 z-30 bg-[#1A1A1A] border border-white/10 rounded-xl p-2 text-yellow-400"
      >
        <Menu size={22} />
      </button>

      {/* Fondo oscuro cuando el menú está abierto en móvil */}
      {menuAbierto && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* Menú lateral */}
      <aside className={`
        w-64 bg-[#1A1A1A] border-r border-white/10 flex flex-col
        fixed lg:static inset-y-0 left-0 z-40
        transform transition-transform duration-300
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <header className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-widest text-yellow-400">BIOSMART</h1>
            <p className="text-xs text-gray-500 mt-1">Administración</p>
          </div>
          {/* Botón cerrar — solo móvil */}
          <button onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" className="lg:hidden text-gray-400">
            <X size={22} />
          </button>
        </header>

        <nav aria-label="Navegación principal" className="flex-1 p-4 space-y-2">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => seleccionar(item.id)}
              aria-current={seccion === item.id ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                seccion === item.id
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition"
          >
            <LogOut size={20} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto w-full">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}