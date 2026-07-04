import { AlertTriangle, Info } from 'lucide-react'

// Modal de confirmación / alerta con el estilo de la app.
// Reemplaza a window.confirm() y window.alert(), que se ven feos y
// muestran la URL del sitio (ej: "proyecto-admin-tesis...vercel.app dice").
//
// Uso como CONFIRMACIÓN (2 botones): pasar cancelText.
// Uso como ALERTA simple (1 botón): no pasar cancelText.
interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-2">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            danger ? 'bg-red-400/15 text-red-400' : 'bg-yellow-400/15 text-yellow-400'
          }`}>
            {danger ? <AlertTriangle size={20} /> : <Info size={20} />}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="font-bold text-white text-base leading-snug">{title}</h2>
            <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          {cancelText && (
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-300 font-semibold hover:bg-white/10 transition"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            autoFocus
            className={`flex-1 py-2.5 rounded-xl font-bold transition ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-yellow-400 text-black hover:bg-yellow-300'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}