import { useEffect, useState } from 'react'
import {
  obtenerCuentas, bloquearCuenta, eliminarCuenta,
  type Cuenta,
} from '../lib/adminService'
import {
  Search, Trash2, Ban, CheckCircle, Shield, User,
  Mail, Calendar, Hash, X, UserCheck, Activity, Users,
} from 'lucide-react'

export default function Cuentas() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'usuario' | 'entrenador'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [detalle, setDetalle] = useState<Cuenta | null>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const data = await obtenerCuentas()
    setCuentas(data)
    setCargando(false)
  }

  async function onBloquear(c: Cuenta) {
    const accion = c.cuenta_bloqueada ? 'desbloquear' : 'bloquear'
    if (!confirm(`¿Seguro que quieres ${accion} a ${c.first_name}?`)) return
    const ok = await bloquearCuenta(c.id, !c.cuenta_bloqueada)
    if (ok) cargar()
    else alert('No se pudo actualizar')
  }

  async function onEliminar(c: Cuenta) {
    if (!confirm(`¿Eliminar la cuenta de ${c.first_name}? Podrá volver a registrarse. Esta acción no se puede deshacer.`)) return
    const ok = await eliminarCuenta(c.id)
    if (ok) { setDetalle(null); cargar() }
    else alert('No se pudo eliminar')
  }

  const cuentasFiltradas = cuentas
    .filter(c => filtro === 'todos' || c.rol === filtro)
    .filter(c => {
      const t = busqueda.toLowerCase()
      return !t ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(t) ||
        (c.email || '').toLowerCase().includes(t)
    })

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestión de Cuentas</h1>
      <p className="text-gray-400 mb-6 text-sm md:text-base">Administra usuarios y entrenadores</p>

      {/* Controles: filtro + búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {(['todos', 'usuario', 'entrenador'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-xl capitalize transition ${
                filtro === f ? 'bg-yellow-400 text-black font-semibold' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'usuario' ? 'Usuarios' : 'Entrenadores'}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 focus:border-yellow-400 outline-none text-white"
          />
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="text-yellow-400 text-center py-12">Cargando cuentas...</div>
      ) : (
        <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400 text-sm">
                <th className="p-4">Nombre</th>
                <th className="p-4">Correo</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Relación</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentasFiltradas.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="p-4">
                    <button onClick={() => setDetalle(c)} className="flex items-center gap-3 hover:text-yellow-400">
                      <div className="w-9 h-9 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold">
                        {(c.first_name || 'U')[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{c.first_name} {c.last_name}</span>
                    </button>
                  </td>
                  <td className="p-4 text-gray-400">{c.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      c.rol === 'entrenador' ? 'bg-yellow-400/15 text-yellow-400' : 'bg-blue-400/15 text-blue-400'
                    }`}>
                      {c.rol === 'entrenador' ? 'Entrenador' : c.rol === 'usuario' ? 'Usuario' : 'Sin rol'}
                    </span>
                  </td>
                  <td className="p-4">
                    {c.rol === 'usuario' && (
                      <span className="text-sm text-gray-400">
                        {c.entrenadorNombre
                          ? <>Entrenador: <span className="text-white">{c.entrenadorNombre}</span></>
                          : <span className="text-gray-600">Sin entrenador</span>}
                      </span>
                    )}
                    {c.rol === 'entrenador' && (
                      <span className="text-sm text-gray-400">
                        <span className="text-yellow-400 font-semibold">{c.usuariosConectados?.length || 0}</span> usuarios
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {c.cuenta_bloqueada
                      ? <span className="text-red-400 text-sm flex items-center gap-1"><Ban size={14} /> Bloqueado</span>
                      : <span className="text-green-400 text-sm flex items-center gap-1"><CheckCircle size={14} /> Activo</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onBloquear(c)}
                        title={c.cuenta_bloqueada ? 'Desbloquear' : 'Bloquear'}
                        className={`p-2 rounded-lg transition ${
                          c.cuenta_bloqueada ? 'text-green-400 hover:bg-green-400/10' : 'text-orange-400 hover:bg-orange-400/10'
                        }`}
                      >
                        {c.cuenta_bloqueada ? <CheckCircle size={18} /> : <Ban size={18} />}
                      </button>
                      <button
                        onClick={() => onEliminar(c)}
                        title="Eliminar"
                        className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cuentasFiltradas.length === 0 && (
            <div className="text-center text-gray-500 py-12">No se encontraron cuentas</div>
          )}
        </div>
      )}

      {/* Panel de detalle */}
      {detalle && (
        <DetalleCuenta cuenta={detalle} onClose={() => setDetalle(null)} onEliminar={() => onEliminar(detalle)} onBloquear={() => onBloquear(detalle)} />
      )}
    </div>
  )
}

function DetalleCuenta({ cuenta, onClose, onEliminar, onBloquear }: {
  cuenta: Cuenta, onClose: () => void, onEliminar: () => void, onBloquear: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-400 text-black flex items-center justify-center text-2xl font-bold">
              {(cuenta.first_name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{cuenta.first_name} {cuenta.last_name}</h2>
              <span className={`text-xs ${cuenta.rol === 'entrenador' ? 'text-yellow-400' : 'text-blue-400'}`}>
                {cuenta.rol === 'entrenador' ? 'Entrenador' : 'Usuario'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
        </div>

        <div className="space-y-3 mb-6">
          <Dato icon={<Mail size={16} />} label="Correo" valor={cuenta.email || 'Sin correo'} />
          <Dato icon={<User size={16} />} label="Rol" valor={cuenta.rol || 'Sin asignar'} />
          {cuenta.codigo_entrenador && (
            <Dato icon={<Hash size={16} />} label="Código de entrenador" valor={cuenta.codigo_entrenador} />
          )}
          <Dato icon={<Calendar size={16} />} label="Registrado" valor={new Date(cuenta.created_at).toLocaleDateString('es-EC')} />
          <Dato icon={<Shield size={16} />} label="Estado" valor={cuenta.cuenta_bloqueada ? 'Bloqueado' : 'Activo'} />

          {/* Si es USUARIO: mostrar su entrenador y sesiones */}
          {cuenta.rol === 'usuario' && (
            <>
              <Dato icon={<UserCheck size={16} />} label="Su entrenador"
                valor={cuenta.entrenadorNombre || 'Sin entrenador'} />
              <Dato icon={<Activity size={16} />} label="Sesiones realizadas"
                valor={`${cuenta.totalSesiones ?? 0}`} />
            </>
          )}

          {/* Si es ENTRENADOR: mostrar sus usuarios */}
          {cuenta.rol === 'entrenador' && (
            <div className="pt-2">
              <div className="flex items-center gap-3 text-sm mb-2">
                <span className="text-gray-500"><Users size={16} /></span>
                <span className="text-gray-400">Usuarios conectados ({cuenta.usuariosConectados?.length || 0}):</span>
              </div>
              {cuenta.usuariosConectados && cuenta.usuariosConectados.length > 0 ? (
                <div className="flex flex-wrap gap-2 ml-7">
                  {cuenta.usuariosConectados.map(u => (
                    <span key={u.id} className="px-3 py-1 rounded-lg bg-white/5 text-sm text-white">
                      {u.nombre}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm ml-7">Ningún usuario conectado todavía</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onBloquear} className="flex-1 py-3 rounded-xl bg-orange-400/15 text-orange-400 font-semibold hover:bg-orange-400/25 transition">
            {cuenta.cuenta_bloqueada ? 'Desbloquear' : 'Bloquear'}
          </button>
          <button onClick={onEliminar} className="flex-1 py-3 rounded-xl bg-red-400/15 text-red-400 font-semibold hover:bg-red-400/25 transition">
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  )
}

function Dato({ icon, label, valor }: { icon: React.ReactNode, label: string, valor: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-500">{icon}</span>
      <span className="text-gray-400 w-40">{label}:</span>
      <span className="text-white font-medium">{valor}</span>
    </div>
  )
}