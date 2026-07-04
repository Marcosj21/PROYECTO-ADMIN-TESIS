import { useEffect, useState } from 'react'
import {
  obtenerUsuariosConSesiones, obtenerSesionesDeUsuario,
  type SesionAdmin, type UsuarioConSesiones,
} from '../lib/adminService'
import DetalleSesion from '../components/DetalleSesion'
import { Search, Play, ArrowLeft, Activity, ChevronRight, Calendar } from 'lucide-react'

export default function Sesiones() {
  // Nivel 1: lista de usuarios. Nivel 2: sesiones del usuario elegido.
  const [usuarios, setUsuarios] = useState<UsuarioConSesiones[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioConSesiones | null>(null)
  const [sesiones, setSesiones] = useState<SesionAdmin[]>([])
  const [cargandoSes, setCargandoSes] = useState(false)
  const [filtroEjercicio, setFiltroEjercicio] = useState('todos')

  const [detalle, setDetalle] = useState<SesionAdmin | null>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    setUsuarios(await obtenerUsuariosConSesiones())
    setCargando(false)
  }

  async function abrirUsuario(u: UsuarioConSesiones) {
    setUsuarioActivo(u)
    setCargandoSes(true)
    setFiltroEjercicio('todos')
    setSesiones(await obtenerSesionesDeUsuario(u.id))
    setCargandoSes(false)
  }

  function calidad(s: SesionAdmin) {
    const total = (s.reps_validas || 0) + (s.reps_invalidas || 0)
    return total > 0 ? Math.round((s.reps_validas / total) * 100) : 0
  }

  // ===== NIVEL 2: sesiones de un usuario =====
  if (usuarioActivo) {
    const ejercicios = ['todos', ...Array.from(new Set(sesiones.map(s => s.ejercicio).filter(Boolean)))]
    const filtradas = sesiones.filter(s => filtroEjercicio === 'todos' || s.ejercicio === filtroEjercicio)

    return (
      <div className="p-4 md:p-8">
        <button onClick={() => setUsuarioActivo(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
          <ArrowLeft size={18} /> Volver a usuarios
        </button>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">{usuarioActivo.nombre}</h1>
        <p className="text-gray-400 mb-6 text-sm md:text-base">{usuarioActivo.totalSesiones} sesiones · Calidad promedio {usuarioActivo.calidadPromedio}%</p>

        {/* Filtro de ejercicios */}
        <label htmlFor="filtro-ejercicio" className="sr-only">Filtrar por ejercicio</label>
        <select
          id="filtro-ejercicio"
          value={filtroEjercicio}
          onChange={e => setFiltroEjercicio(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 focus:border-yellow-400 outline-none text-white mb-6"
        >
          {ejercicios.map(e => <option key={e} value={e}>{e === 'todos' ? 'Todos los ejercicios' : e}</option>)}
        </select>

        {cargandoSes ? (
          <div className="text-yellow-400 text-center py-12">Cargando sesiones...</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No hay sesiones</div>
        ) : (
          <>
            {/* ── VISTA MÓVIL: tarjetas apiladas (sin scroll horizontal) ── */}
            <div className="space-y-3 sm:hidden">
              {filtradas.map(s => {
                const q = calidad(s)
                return (
                  <div key={s.id} className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{s.ejercicio}</span>
                      <span className={`font-bold text-sm ${q >= 70 ? 'text-green-400' : q >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{q}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span>
                        <span className="text-green-400">{s.reps_validas || 0}✓</span>{' / '}
                        <span className="text-red-400">{s.reps_invalidas || 0}✗</span>
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={() => setDetalle(s)}
                      className="w-full px-3 py-2 rounded-lg bg-yellow-400/15 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/25 transition inline-flex items-center justify-center gap-1"
                    >
                      <Play size={14} /> Ver detalle
                    </button>
                  </div>
                )
              })}
            </div>

            {/* ── VISTA TABLET/DESKTOP: tabla normal ── */}
            <div className="hidden sm:block bg-[#1A1A1A] rounded-2xl border border-white/10 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400 text-sm">
                    <th scope="col" className="p-4">Ejercicio</th>
                    <th scope="col" className="p-4">Reps</th>
                    <th scope="col" className="p-4">Calidad</th>
                    <th scope="col" className="p-4">Fecha</th>
                    <th scope="col" className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(s => {
                    const q = calidad(s)
                    return (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-4 text-gray-300">{s.ejercicio}</td>
                        <td className="p-4 text-sm">
                          <span className="text-green-400">{s.reps_validas || 0}✓</span>{' / '}
                          <span className="text-red-400">{s.reps_invalidas || 0}✗</span>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold ${q >= 70 ? 'text-green-400' : q >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{q}%</span>
                        </td>
                        <td className="p-4 text-gray-400 text-sm">
                          {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setDetalle(s)} className="px-3 py-1.5 rounded-lg bg-yellow-400/15 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/25 transition inline-flex items-center gap-1">
                            <Play size={14} /> Ver
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {detalle && <DetalleSesion sesion={detalle} onClose={() => setDetalle(null)} />}
      </div>
    )
  }

  // ===== NIVEL 1: lista de usuarios =====
  const usuariosFiltrados = usuarios.filter(u => {
    const t = busqueda.toLowerCase()
    return !t || u.nombre.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)
  })

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Sesiones de Entrenamiento</h1>
      <p className="text-gray-400 mb-6 text-sm md:text-base">Elige un usuario para ver sus sesiones, videos y errores</p>

      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <label htmlFor="buscar-usuario" className="sr-only">Buscar usuario</label>
        <input
          id="buscar-usuario"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar usuario..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 focus:border-yellow-400 outline-none text-white"
        />
      </div>

      {cargando ? (
        <div className="text-yellow-400 text-center py-12">Cargando...</div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="text-gray-500 text-center py-12">No hay usuarios con sesiones</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuariosFiltrados.map(u => (
            <button
              key={u.id}
              onClick={() => abrirUsuario(u)}
              className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/10 hover:border-yellow-400/40 transition text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-yellow-400 text-black flex items-center justify-center text-lg font-bold shrink-0">
                {(u.nombre || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.nombre}</div>
                <div className="text-gray-400 text-sm flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Activity size={13} /> {u.totalSesiones}</span>
                  <span className={`font-semibold ${u.calidadPromedio >= 70 ? 'text-green-400' : u.calidadPromedio >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {u.calidadPromedio}%
                  </span>
                </div>
                {u.ultimaFecha && (
                  <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                    <Calendar size={11} /> {new Date(u.ultimaFecha).toLocaleDateString('es-EC')}
                  </div>
                )}
              </div>
              <ChevronRight size={20} className="text-gray-600 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}