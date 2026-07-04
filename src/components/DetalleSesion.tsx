import { type SesionAdmin } from '../lib/adminService'
import {
  Play, X, CheckCircle, XCircle, Calendar, User,
  Dumbbell, AlertTriangle, Activity, Brain,
} from 'lucide-react'

// Detalle completo de una sesión: métricas, video con línea de tiempo,
// repeticiones, errores y diagnóstico de IA.
// Se usa tanto en la sección Sesiones como en Mensajes (popup).
//
// FIX: el modal ahora tiene una altura MÁXIMA fija (max-h-[92vh]) con
// scroll SOLO en el contenido interno. Antes dependía del zoom del
// navegador para verse completo; ahora se ve igual sin importar el zoom
// ni el tamaño de pantalla (celular, tablet o escritorio).
export default function DetalleSesion({ sesion, onClose }: { sesion: SesionAdmin, onClose: () => void }) {
  const total = (sesion.reps_validas || 0) + (sesion.reps_invalidas || 0)
  const q = total > 0 ? Math.round((sesion.reps_validas / total) * 100) : 0
  const reps = Array.isArray(sesion.reps_detalle) ? sesion.reps_detalle : []
  const errores = Array.isArray(sesion.errores) ? sesion.errores : []

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 md:p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de la sesión de ${sesion.ejercicio}`}
        className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-lg max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera fija (no se mueve al hacer scroll del contenido) */}
        <header className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold truncate">{sesion.ejercicio}</h2>
            <p className="text-gray-400 text-xs md:text-sm flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1"><User size={14} /> {sesion.usuario_nombre}</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(sesion.created_at).toLocaleDateString('es-EC')}</span>
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-white shrink-0 ml-3">
            <X size={22} />
          </button>
        </header>

        {/* Contenido con scroll propio: aquí es donde se desplaza todo */}
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
          {/* Métricas */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <MetricaBox label="Total reps" valor={`${total}`} color="text-white" icon={<Activity size={18} />} />
            <MetricaBox label="Válidas" valor={`${sesion.reps_validas || 0}`} color="text-green-400" icon={<CheckCircle size={18} />} />
            <MetricaBox label="Calidad" valor={`${q}%`} color={q >= 70 ? 'text-green-400' : 'text-yellow-400'} icon={<Dumbbell size={18} />} />
          </div>

          {/* Video con línea de tiempo */}
          {sesion.video_url ? (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Play size={18} className="text-yellow-400" /> Video de la sesión</h3>
              <div className="flex justify-center">
                <video
                  src={sesion.video_url}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  playsInline
                  className="rounded-xl bg-black max-h-[220px] sm:max-h-[280px] md:max-h-[360px] max-w-full w-auto"
                />
              </div>
              <p className="text-gray-500 text-xs mt-2 text-center">Usa la barra de progreso para adelantar o retroceder el video.</p>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-6 text-center text-gray-500 text-sm">
              Esta sesión no tiene video grabado
            </div>
          )}

          {/* Detalle de repeticiones */}
          {reps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Detalle de repeticiones</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {reps.map((rep: any, i: number) => {
                  const valida = rep.valida === true
                  const razon = rep.razon || ''
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${valida ? 'bg-green-400/5' : 'bg-red-400/5'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${valida ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-semibold ${valida ? 'text-green-400' : 'text-red-400'}`}>
                          {valida ? 'Rep válida' : 'Rep no válida'}
                        </span>
                        {razon && <p className="text-gray-400 text-xs">{razon}</p>}
                      </div>
                      {valida ? <CheckCircle size={16} className="text-green-400 shrink-0" /> : <XCircle size={16} className="text-red-400 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Errores (sesiones viejas sin reps_detalle) */}
          {reps.length === 0 && errores.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-red-400" /> Errores detectados</h3>
              <div className="space-y-2">
                {errores.map((err: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-red-400/5 text-gray-300 text-sm">{String(err)}</div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnóstico de IA */}
          <DiagnosticoIA diag={sesion.diagnostico_ia} />
        </div>
      </div>
    </div>
  )
}

function MetricaBox({ label, valor, color, icon }: { label: string, valor: string, color: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center">
      <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
      <div className={`text-xl md:text-2xl font-bold ${color}`}>{valor}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  )
}

function DiagnosticoIA({ diag }: { diag: any }) {
  if (!diag || typeof diag !== 'object') {
    return (
      <div className="border border-dashed border-white/15 rounded-xl p-5 text-center">
        <Brain size={24} className="text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Análisis de IA pendiente</p>
        <p className="text-gray-600 text-xs mt-1">El diagnóstico aparecerá aquí cuando se procese</p>
      </div>
    )
  }

  const nivel = diag.nivel_riesgo || 'bajo'
  const color = nivel === 'alto' ? 'text-red-400' : nivel === 'medio' ? 'text-orange-400' : 'text-yellow-400'
  const bg = nivel === 'alto' ? 'bg-red-400/10 border-red-400/30' : nivel === 'medio' ? 'bg-orange-400/10 border-orange-400/30' : 'bg-yellow-400/10 border-yellow-400/30'

  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Brain size={18} className="text-yellow-400" /> Diagnóstico de IA
      </h3>
      <div className={`rounded-xl p-5 border ${bg}`}>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${color} text-sm font-semibold mb-3`}>
          Riesgo {String(nivel).toUpperCase()}
        </div>
        {diag.posible_lesion && (
          <p className="text-sm mb-2"><span className="text-gray-400">Lesión posible: </span><span className="text-white">{diag.posible_lesion}</span></p>
        )}
        {diag.musculos_en_riesgo && (
          <p className="text-sm mb-2"><span className="text-gray-400">Músculo en riesgo: </span><span className="text-white">{diag.musculos_en_riesgo}</span></p>
        )}
        {diag.descripcion && (
          <p className="text-gray-300 text-sm mt-3 leading-relaxed">{diag.descripcion}</p>
        )}
        {diag.recomendacion && (
          <div className="mt-3 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
            <p className="text-yellow-400 text-sm">💡 {diag.recomendacion}</p>
          </div>
        )}
      </div>
    </div>
  )
}