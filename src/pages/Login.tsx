import { useState } from 'react'
import { loginComoAdmin } from '../lib/adminService'

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('') 
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar() {
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.')
      return
    }

    setError('')
    setCargando(true)

    // Aquí ya enviamos el email exactamente como lo escribiste
    const resultado = await loginComoAdmin(email.toLowerCase().trim(), password)

    if (resultado.exito) {
      sessionStorage.setItem('biosmart_admin', 'true')
      onLogin()
    } else {
      setError(resultado.error || 'Credenciales incorrectas')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-2xl p-8 md:p-10 border border-white/10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-widest text-yellow-400">BIOSMART</h1>
          <p className="text-gray-400 mt-2">Panel de Administración</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 tracking-wider block mb-2">CORREO ADMINISTRADOR</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-yellow-400 outline-none text-white text-sm"
              placeholder="Ej: support.fitnesspro.app@gmail.com"
              disabled={cargando}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 tracking-wider block mb-2">CONTRASEÑA</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && !cargando && entrar()}
              className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-yellow-400 outline-none text-white text-sm"
              placeholder="••••••••"
              disabled={cargando}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button
          onClick={entrar}
          disabled={cargando}
          className="w-full mt-6 py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? 'Verificando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}