import { useState } from 'react'

// Contraseña de admin. En producción esto iría en el backend,
// pero para la tesis usamos una variable de entorno.
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function entrar() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('biosmart_admin', 'true')
      onLogin()
    } else {
      setError('Contraseña incorrecta')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-[#1A1A1A] rounded-2xl p-10 border border-white/10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-widest text-yellow-400">BIOSMART</h1>
          <p className="text-gray-400 mt-2">Panel de Administración</p>
        </div>

        <label className="text-xs text-gray-400 tracking-wider">CONTRASEÑA DE ADMINISTRADOR</label>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && entrar()}
          className="w-full mt-2 mb-1 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-yellow-400 outline-none text-white"
          placeholder="••••••••"
        />
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <button
          onClick={entrar}
          className="w-full mt-4 py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition"
        >
          Entrar
        </button>
      </div>
    </div>
  )
}