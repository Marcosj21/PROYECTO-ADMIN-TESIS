import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users, UserCheck, Activity, TrendingUp, Dumbbell,
  AlertTriangle, Award, Flame, CheckCircle2, XCircle, ListChecks,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'

const AMARILLO = '#FFD600'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsuarios: 0, totalEntrenadores: 0, totalSesiones: 0,
    repsValidas: 0, repsInvalidas: 0,
  })
  const [ejerciciosStats, setEjerciciosStats] = useState({
    total: 0, activos: 0, desactivados: 0,
  })
  const [ejerciciosData, setEjerciciosData] = useState<any[]>([])
  const [sesionesPorDia, setSesionesPorDia] = useState<any[]>([])
  const [erroresPorEjercicio, setErroresPorEjercicio] = useState<any[]>([])
  const [rankingEntrenadores, setRankingEntrenadores] = useState<any[]>([])
  const [usuariosActivos, setUsuariosActivos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    try {
      const { data: perfiles } = await supabase.from('profiles').select('id, first_name, last_name, rol')
      const usuarios = perfiles?.filter(p => p.rol === 'usuario').length || 0
      const entrenadores = perfiles?.filter(p => p.rol === 'entrenador').length || 0

      const { data: sesiones } = await supabase
        .from('training_sessions')
        .select('profile_id, ejercicio, reps_validas, reps_invalidas, created_at')

      const { data: conexiones } = await supabase
        .from('entrenador_usuario')
        .select('entrenador_id, usuario_id')

      // Conteo de ejercicios: cuántos activos vs desactivados/en desarrollo
      const { data: ejerciciosTabla } = await supabase
        .from('ejercicios')
        .select('disponible')

      const totalEj = ejerciciosTabla?.length || 0
      const activosEj = ejerciciosTabla?.filter(e => e.disponible).length || 0
      setEjerciciosStats({
        total: totalEj,
        activos: activosEj,
        desactivados: totalEj - activosEj,
      })

      const nombre = (id: string) => {
        const p = perfiles?.find(x => x.id === id)
        return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre' : '—'
      }

      let validas = 0, invalidas = 0
      const porEjercicio: Record<string, number> = {}
      const porDia: Record<string, number> = {}
      const erroresEj: Record<string, number> = {}
      const sesionesPorUsuario: Record<string, number> = {}

      sesiones?.forEach(s => {
        validas += s.reps_validas || 0
        invalidas += s.reps_invalidas || 0
        const ej = s.ejercicio || 'Otro'
        porEjercicio[ej] = (porEjercicio[ej] || 0) + 1
        erroresEj[ej] = (erroresEj[ej] || 0) + (s.reps_invalidas || 0)
        sesionesPorUsuario[s.profile_id] = (sesionesPorUsuario[s.profile_id] || 0) + 1
        if (s.created_at) {
          const dia = new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
          porDia[dia] = (porDia[dia] || 0) + 1
        }
      })

      // Ranking de entrenadores por número de usuarios
      const usuariosPorEntrenador: Record<string, number> = {}
      conexiones?.forEach(c => {
        usuariosPorEntrenador[c.entrenador_id] = (usuariosPorEntrenador[c.entrenador_id] || 0) + 1
      })

      setStats({ totalUsuarios: usuarios, totalEntrenadores: entrenadores, totalSesiones: sesiones?.length || 0, repsValidas: validas, repsInvalidas: invalidas })
      setEjerciciosData(Object.entries(porEjercicio).map(([name, value]) => ({ name, value })))
      setSesionesPorDia(Object.entries(porDia).slice(-7).map(([dia, total]) => ({ dia, total })))
      setErroresPorEjercicio(
        Object.entries(erroresEj).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
      )
      setRankingEntrenadores(
        Object.entries(usuariosPorEntrenador)
          .map(([id, total]) => ({ nombre: nombre(id), total }))
          .sort((a, b) => b.total - a.total).slice(0, 5)
      )
      setUsuariosActivos(
        Object.entries(sesionesPorUsuario)
          .map(([id, total]) => ({ nombre: nombre(id), total }))
          .sort((a, b) => b.total - a.total).slice(0, 5)
      )
    } catch (e) {
      console.error('Error dashboard:', e)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return <div className="flex items-center justify-center h-96"><div className="text-yellow-400 text-lg">Cargando datos...</div></div>
  }

  const totalReps = stats.repsValidas + stats.repsInvalidas
  const pctValidas = totalReps > 0 ? Math.round((stats.repsValidas / totalReps) * 100) : 0
  const pieData = [{ name: 'Válidas', value: stats.repsValidas }, { name: 'Inválidas', value: stats.repsInvalidas }]
  const COLORS = [AMARILLO, '#EF4444']

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-8 text-sm md:text-base">Resumen general de BioSmart</p>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={<Users />} label="Usuarios" value={stats.totalUsuarios} />
        <StatCard icon={<UserCheck />} label="Entrenadores" value={stats.totalEntrenadores} />
        <StatCard icon={<Activity />} label="Sesiones" value={stats.totalSesiones} />
        <StatCard icon={<TrendingUp />} label="Calidad técnica" value={`${pctValidas}%`} />
      </div>

      {/* Tarjetas de ejercicios: total / activos / desactivados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard icon={<ListChecks />} label="Total de ejercicios" value={ejerciciosStats.total} />
        <StatCard icon={<CheckCircle2 />} label="Activos en la app" value={ejerciciosStats.activos} colorValor="text-green-400" />
        <StatCard icon={<XCircle />} label="Desactivados / en desarrollo" value={ejerciciosStats.desactivados} colorValor="text-yellow-500" />
      </div>

      {/* Fila 1 de gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Sesiones (últimos días)" icon={<Activity size={18} />}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={sesionesPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="dia" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid #333', borderRadius: 8 }} />
              <Line type="monotone" dataKey="total" stroke={AMARILLO} strokeWidth={3} dot={{ fill: AMARILLO }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Calidad de repeticiones" icon={<TrendingUp size={18} />}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid #333', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: AMARILLO }} /> Válidas: {stats.repsValidas}</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Inválidas: {stats.repsInvalidas}</span>
          </div>
        </ChartCard>
      </div>

      {/* Fila 2: ejercicios y errores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Ejercicios más realizados" icon={<Dumbbell size={18} />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ejerciciosData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid #333', borderRadius: 8 }} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="value" fill={AMARILLO} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ejercicios con más errores" icon={<AlertTriangle size={18} />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={erroresPorEjercicio} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#888" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid #333', borderRadius: 8 }} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="value" fill="#EF4444" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Fila 3: rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingCard title="Top entrenadores" icon={<Award size={18} />} data={rankingEntrenadores} unidad="usuarios" />
        <RankingCard title="Usuarios más activos" icon={<Flame size={18} />} data={usuariosActivos} unidad="sesiones" />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, colorValor }: { icon: React.ReactNode, label: string, value: number | string, colorValor?: string }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10 hover:border-yellow-400/40 transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-yellow-400">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${colorValor || ''}`}>{value}</div>
    </div>
  )
}

function ChartCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="text-yellow-400">{icon}</span> {title}</h3>
      {children}
    </div>
  )
}

function RankingCard({ title, icon, data, unidad }: { title: string, icon: React.ReactNode, data: any[], unidad: string }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="text-yellow-400">{icon}</span> {title}</h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">Sin datos todavía</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-300'
              }`}>{i + 1}</div>
              <span className="flex-1 text-sm">{item.nombre}</span>
              <span className="text-yellow-400 font-bold text-sm">{item.total}</span>
              <span className="text-gray-500 text-xs">{unidad}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}