import { useState, useEffect } from 'react'
import { Plus, Lock, Check, Trash2, Pencil, X, Dumbbell } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  obtenerEjercicios,
  crearEjercicio,
  editarEjercicio,
  cambiarDisponibilidad,
  eliminarEjercicio,
  type EjercicioAdmin,
} from '../lib/adminService'

// Claves de los ejercicios que YA están programados en la app (no se tocan)
const CLAVES_FUNCIONANDO = ['sentadilla', 'gobletSquat', 'pressMilitar', 'elevacionLateral']

export default function Ejercicios() {
  const [ejercicios, setEjercicios] = useState<EjercicioAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<EjercicioAdmin | null>(null)

  // Campos del formulario
  const [nombre, setNombre] = useState('')
  const [clave, setClave] = useState('')
  const [musculo, setMusculo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Reemplaza a window.confirm() para eliminar un ejercicio
  const [porBorrar, setPorBorrar] = useState<EjercicioAdmin | null>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const data = await obtenerEjercicios()
    setEjercicios(data)
    setCargando(false)
  }

  function abrirNuevo() {
    setEditando(null)
    setNombre(''); setClave(''); setMusculo(''); setDescripcion(''); setError('')
    setMostrarForm(true)
  }

  function abrirEditar(ej: EjercicioAdmin) {
    setEditando(ej)
    setNombre(ej.nombre)
    setClave(ej.clave)
    setMusculo(ej.musculo)
    setDescripcion(ej.descripcion || '')
    setError('')
    setMostrarForm(true)
  }

  // Genera una clave automática desde el nombre (ej: "Peso Muerto" -> "pesoMuerto")
  function generarClave(texto: string) {
    const limpio = texto
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
    const partes = limpio.split(/\s+/)
    if (partes.length === 0) return ''
    return partes[0].toLowerCase() +
      partes.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('')
  }

  async function guardar() {
    if (!nombre.trim() || !musculo.trim()) {
      setError('El nombre y el músculo son obligatorios.')
      return
    }
    setError(''); setGuardando(true)

    if (editando) {
      const ok = await editarEjercicio(editando.id, {
        nombre: nombre.trim(), musculo: musculo.trim(), descripcion: descripcion.trim(),
      })
      if (!ok) setError('No se pudo guardar los cambios.')
    } else {
      const claveFinal = clave.trim() || generarClave(nombre)
      const res = await crearEjercicio({
        clave: claveFinal, nombre: nombre.trim(),
        musculo: musculo.trim(), descripcion: descripcion.trim(),
      })
      if (!res.exito) { setError(res.error || 'No se pudo crear.'); setGuardando(false); return }
    }

    setGuardando(false)
    setMostrarForm(false)
    cargar()
  }

  async function toggleDisponible(ej: EjercicioAdmin) {
    await cambiarDisponibilidad(ej.id, !ej.disponible)
    cargar()
  }

  // Antes usaba window.confirm(); ahora solo abre el modal propio
  function pedirBorrar(ej: EjercicioAdmin) {
    setPorBorrar(ej)
  }

  async function confirmarBorrado() {
    if (!porBorrar) return
    const ej = porBorrar
    setPorBorrar(null)
    await eliminarEjercicio(ej.id)
    cargar()
  }

  return (
    <div className="p-6 md:p-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="text-yellow-400" size={26} /> Ejercicios
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestiona los ejercicios de la app. Los nuevos aparecen como "en desarrollo".
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition"
        >
          <Plus size={18} /> Nuevo
        </button>
      </div>

      {/* Lista de ejercicios */}
      {cargando ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ejercicios.map(ej => {
            const esFijo = CLAVES_FUNCIONANDO.includes(ej.clave)
            return (
              <div
                key={ej.id}
                className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-lg">{ej.nombre}</h3>
                      {ej.disponible ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                          <Check size={12} /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
                          <Lock size={12} /> En desarrollo
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{ej.musculo}</p>
                    {ej.descripcion && (
                      <p className="text-gray-500 text-xs mt-2 leading-relaxed">{ej.descripcion}</p>
                    )}
                    <p className="text-gray-600 text-[11px] mt-2">clave: {ej.clave}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  {/* Interruptor disponible: SOLO para los 4 ejercicios base
                      (los que la app sabe detectar). Los nuevos no se activan
                      porque la app aún no tiene su detección programada. */}
                  {esFijo ? (
                    <button
                      onClick={() => toggleDisponible(ej)}
                      className={`flex-1 text-xs py-2 rounded-lg font-semibold transition ${
                        ej.disponible
                          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                          : 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25'
                      }`}
                    >
                      {ej.disponible ? 'Bloquear en la app' : 'Activar en la app'}
                    </button>
                  ) : (
                    <div className="flex-1 text-xs py-2 rounded-lg font-semibold text-center bg-yellow-500/10 text-yellow-500/70">
                      En desarrollo (detección pendiente)
                    </div>
                  )}

                  <button
                    onClick={() => abrirEditar(ej)}
                    className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Solo se pueden borrar los que NO son de los 4 fijos */}
                  {!esFijo && (
                    <button
                      onClick={() => pedirBorrar(ej)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {esFijo && (
                  <p className="text-gray-600 text-[11px] mt-2">
                    Ejercicio base de la app (el admin puede activarlo o bloquearlo).
                  </p>
                )}
                {!esFijo && (
                  <p className="text-gray-600 text-[11px] mt-2">
                    Aparece con candado en la app hasta que su detección se programe.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal del formulario */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">
                {editando ? 'Editar ejercicio' : 'Nuevo ejercicio'}
              </h2>
              <button onClick={() => setMostrarForm(false)} className="text-gray-400 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 tracking-wider block mb-2">NOMBRE</label>
                <input
                  value={nombre}
                  onChange={e => { setNombre(e.target.value); setError('') }}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-yellow-400 outline-none text-white text-sm"
                  placeholder="Ej: Peso Muerto"
                />
              </div>

              {/* La clave solo se muestra al crear (al editar no se cambia) */}
              {!editando && (
                <div>
                  <label className="text-xs text-gray-400 tracking-wider block mb-2">
                    CLAVE (opcional, se genera sola)
                  </label>
                  <input
                    value={clave}
                    onChange={e => setClave(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-yellow-400 outline-none text-white text-sm"
                    placeholder={nombre ? generarClave(nombre) : 'Ej: pesoMuerto'}
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 tracking-wider block mb-2">MÚSCULO</label>
                <input
                  value={musculo}
                  onChange={e => { setMusculo(e.target.value); setError('') }}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-yellow-400 outline-none text-white text-sm"
                  placeholder="Ej: Espalda baja, glúteos"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 tracking-wider block mb-2">DESCRIPCIÓN</label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-yellow-400 outline-none text-white text-sm resize-none"
                  placeholder="Breve descripción del ejercicio..."
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            {!editando && (
              <p className="text-gray-500 text-xs mt-3">
                El ejercicio se creará como "en desarrollo". Podrás activarlo cuando su
                detección esté lista en la app.
              </p>
            )}

            <button
              onClick={guardar}
              disabled={guardando}
              className="w-full mt-5 py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear ejercicio')}
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación al eliminar — reemplaza confirm() */}
      {porBorrar && (
        <ConfirmDialog
          open
          title="Eliminar ejercicio"
          message={`¿Eliminar el ejercicio "${porBorrar.nombre}"? No se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          danger
          onConfirm={confirmarBorrado}
          onCancel={() => setPorBorrar(null)}
        />
      )}
    </div>
  )
}