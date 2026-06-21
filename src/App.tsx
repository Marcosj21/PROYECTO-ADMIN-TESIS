import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cuentas from './pages/Cuentas'
import Sesiones from './pages/Sesiones'
import Mensajes from './pages/Mensajes'
import Layout from './components/Layout'

export default function App() {
  const [logueado, setLogueado] = useState(
    sessionStorage.getItem('biosmart_admin') === 'true'
  )
  const [seccion, setSeccion] = useState('dashboard')

  if (!logueado) {
    return <Login onLogin={() => setLogueado(true)} />
  }

  function logout() {
    sessionStorage.removeItem('biosmart_admin')
    setLogueado(false)
  }

  return (
    <Layout seccion={seccion} setSeccion={setSeccion} onLogout={logout}>
      {seccion === 'dashboard' && <Dashboard />}
      {seccion === 'cuentas' && <Cuentas />}
      {seccion === 'sesiones' && <Sesiones />}
      {seccion === 'mensajes' && <Mensajes />}
    </Layout>
  )
}