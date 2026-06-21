import { useEffect, useState } from 'react'
import {
  obtenerConversaciones, obtenerConversacion, obtenerSesionPorId,
  type Conversacion, type MensajeAdmin, type SesionAdmin,
} from '../lib/adminService'
import DetalleSesion from '../components/DetalleSesion'
import { MessageSquare, ArrowLeft, Dumbbell, Search } from 'lucide-react'

export default function Mensajes() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [activa, setActiva] = useState<Conversacion | null>(null)
  const [mensajes, setMensajes] = useState<MensajeAdmin[]>([])
  const [cargandoChat, setCargandoChat] = useState(false)
  const [sesionPopup, setSesionPopup] = useState<SesionAdmin | null>(null)

  async function abrirEjercicio(sesionId: string) {
    const sesion = await obtenerSesionPorId(sesionId)
    if (sesion) setSesionPopup(sesion)
    else alert('No se pudo cargar el ejercicio')
  }

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const data = await obtenerConversaciones()
    setConversaciones(data)
    setCargando(false)
  }

  async function abrirChat(c: Conversacion) {
    setActiva(c)
    setCargandoChat(true)
    const msgs = await obtenerConversacion(c.personaA_id, c.personaB_id)
    setMensajes(msgs)
    setCargandoChat(false)
  }

  const filtradas = conversaciones.filter(c => {
    const t = busqueda.toLowerCase()
    return !t || c.personaA_nombre.toLowerCase().includes(t) || c.personaB_nombre.toLowerCase().includes(t)
  })

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Supervisión de Mensajes</h1>
      <p className="text-gray-400 mb-6 text-sm md:text-base">Revisa las conversaciones entre entrenadores y usuarios</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de conversaciones — se oculta en móvil cuando hay chat abierto */}
        <div className={`lg:col-span-1 ${activa ? 'hidden lg:block' : 'block'}`}>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar persona..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 focus:border-yellow-400 outline-none text-white"
            />
          </div>

          {cargando ? (
            <div className="text-yellow-400 text-center py-8">Cargando...</div>
          ) : filtradas.length === 0 ? (
            <div className="text-gray-500 text-center py-8 text-sm">No hay conversaciones</div>
          ) : (
            <div className="space-y-2">
              {filtradas.map((c, i) => (
                <button
                  key={i}
                  onClick={() => abrirChat(c)}
                  className={`w-full text-left p-4 rounded-xl border transition ${
                    activa?.personaA_id === c.personaA_id && activa?.personaB_id === c.personaB_id
                      ? 'bg-yellow-400/10 border-yellow-400/40'
                      : 'bg-[#1A1A1A] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{c.personaA_nombre}</span>
                    <span className="text-xs text-gray-500">{c.totalMensajes} msj</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">con {c.personaB_nombre}</div>
                  <div className="text-xs text-gray-500 truncate">{c.ultimoMensaje}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vista del chat */}
        <div className={`lg:col-span-2 ${activa ? 'block' : 'hidden lg:block'}`}>
          {!activa ? (
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 h-96 flex flex-col items-center justify-center text-gray-500">
              <MessageSquare size={40} className="mb-3 opacity-40" />
              <p className="text-sm">Selecciona una conversación para verla</p>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 flex flex-col h-[70vh]">
              {/* Cabecera del chat */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <button onClick={() => setActiva(null)} className="lg:hidden text-gray-400 hover:text-white">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="font-semibold">{activa.personaA_nombre} ↔ {activa.personaB_nombre}</h3>
                  <p className="text-xs text-gray-500">{mensajes.length} mensajes</p>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {cargandoChat ? (
                  <div className="text-yellow-400 text-center py-8">Cargando chat...</div>
                ) : (
                  mensajes.map(m => {
                    // El emisor "A" va a la izquierda, "B" a la derecha
                    const esA = m.emisor_id === activa.personaA_id
                    return (
                      <div key={m.id} className={`flex ${esA ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-3 ${esA ? 'bg-[#2A2A2A]' : 'bg-yellow-400 text-black'}`}>
                          <div className={`text-xs mb-1 font-semibold ${esA ? 'text-gray-400' : 'text-black/60'}`}>
                            {m.emisor_nombre}
                          </div>
                          {/* Tarjeta de ejercicio si la hay (tocable, abre el detalle) */}
                          {m.sesion_ejercicio && (
                            <button
                              onClick={() => m.sesion_id && abrirEjercicio(m.sesion_id)}
                              className={`flex items-center gap-2 mb-2 p-2 rounded-lg text-xs w-full hover:opacity-80 transition ${esA ? 'bg-black/30' : 'bg-black/10'}`}
                            >
                              <Dumbbell size={14} />
                              <span className="flex-1 text-left">{m.sesion_ejercicio}</span>
                              <span className="opacity-70">Ver ▸</span>
                            </button>
                          )}
                          <div className="text-sm">{m.texto}</div>
                          <div className={`text-[10px] mt-1 ${esA ? 'text-gray-500' : 'text-black/50'}`}>
                            {new Date(m.created_at).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {!esA && (m.leido ? ' · Leído' : ' · Entregado')}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                {!cargandoChat && mensajes.length === 0 && (
                  <div className="text-gray-500 text-center py-8 text-sm">No hay mensajes</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup del ejercicio (al tocar una tarjeta en el chat) */}
      {sesionPopup && <DetalleSesion sesion={sesionPopup} onClose={() => setSesionPopup(null)} />}
    </div>
  )
}