import { supabase } from './supabase'

export interface Cuenta {
  id: string
  first_name: string
  last_name: string
  email: string
  rol: string
  codigo_entrenador: string | null
  cuenta_bloqueada: boolean
  created_at: string
  // Datos extra (relaciones)
  entrenadorNombre?: string | null   // si es usuario: su entrenador
  usuariosConectados?: { id: string, nombre: string }[]  // si es entrenador: sus usuarios
  totalSesiones?: number
}

// Traer todas las cuentas CON sus relaciones (Ocultando a los administradores)
export async function obtenerCuentas(): Promise<Cuenta[]> {
  const { data: perfiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, rol, codigo_entrenador, cuenta_bloqueada, created_at')
    .neq('rol', 'admin') // <--- ESTA ES LA LÍNEA NUEVA QUE OCULTA AL ADMIN
    .order('created_at', { ascending: false })

  if (error || !perfiles) { console.error(error); return [] }

  // Traer todas las conexiones
  const { data: conexiones } = await supabase
    .from('entrenador_usuario')
    .select('entrenador_id, usuario_id')

  // Traer conteo de sesiones por usuario
  const { data: sesiones } = await supabase
    .from('training_sessions')
    .select('profile_id')

  const nombrePerfil = (id: string) => {
    const p = perfiles.find(x => x.id === id)
    return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre' : 'Desconocido'
  }

  // Enriquecer cada cuenta con sus relaciones
  return perfiles.map(p => {
    const cuenta: Cuenta = { ...p } as Cuenta

    if (p.rol === 'usuario') {
      const con = conexiones?.find(c => c.usuario_id === p.id)
      cuenta.entrenadorNombre = con ? nombrePerfil(con.entrenador_id) : null
      cuenta.totalSesiones = sesiones?.filter(s => s.profile_id === p.id).length || 0
    }

    if (p.rol === 'entrenador') {
      const sus = conexiones?.filter(c => c.entrenador_id === p.id) || []
      cuenta.usuariosConectados = sus.map(c => ({
        id: c.usuario_id,
        nombre: nombrePerfil(c.usuario_id),
      }))
    }

    return cuenta
  })
}

export async function bloquearCuenta(id: string, bloquear: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ cuenta_bloqueada: bloquear })
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function eliminarCuenta(id: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_eliminar_cuenta', { user_id: id })
  if (error) { console.error(error); return false }
  return true
}

// ============================================================
// SESIONES (supervisión de entrenamientos)
// ============================================================
export interface SesionAdmin {
  id: string
  profile_id: string
  usuario_nombre: string
  ejercicio: string
  reps_totales: number
  reps_validas: number
  reps_invalidas: number
  errores: any
  reps_detalle: any
  errores_timestamps: any
  video_url: string | null
  diagnostico_ia: any
  created_at: string
}

export async function obtenerSesiones(): Promise<SesionAdmin[]> {
  const { data: sesiones, error } = await supabase
    .from('training_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !sesiones) { console.error(error); return [] }

  // Traer nombres de los usuarios
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')

  const nombre = (id: string) => {
    const p = perfiles?.find(x => x.id === id)
    return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre' : 'Desconocido'
  }

  return sesiones.map(s => ({
    ...s,
    usuario_nombre: nombre(s.profile_id),
  })) as SesionAdmin[]
}

// ============================================================
// MENSAJES (supervisión de chats)
// ============================================================
export interface MensajeAdmin {
  id: string
  emisor_id: string
  receptor_id: string
  emisor_nombre: string
  receptor_nombre: string
  texto: string
  leido: boolean
  sesion_id: string | null
  sesion_ejercicio: string | null
  created_at: string
}

export interface Conversacion {
  personaA_id: string
  personaB_id: string
  personaA_nombre: string
  personaB_nombre: string
  ultimoMensaje: string
  ultimaFecha: string
  totalMensajes: number
}

// Traer todas las conversaciones agrupadas (pares de personas)
export async function obtenerConversaciones(): Promise<Conversacion[]> {
  const { data: mensajes, error } = await supabase
    .from('mensajes')
    .select('emisor_id, receptor_id, texto, created_at')
    .order('created_at', { ascending: false })

  if (error || !mensajes) { console.error(error); return [] }

  const { data: perfiles } = await supabase.from('profiles').select('id, first_name, last_name')
  const nombre = (id: string) => {
    const p = perfiles?.find(x => x.id === id)
    return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre' : 'Desconocido'
  }

  // Agrupar por par de personas (sin importar quién envió)
  const grupos: Record<string, Conversacion> = {}
  for (const m of mensajes) {
    const par = [m.emisor_id, m.receptor_id].sort().join('|')
    if (!grupos[par]) {
      const [a, b] = par.split('|')
      grupos[par] = {
        personaA_id: a, personaB_id: b,
        personaA_nombre: nombre(a), personaB_nombre: nombre(b),
        ultimoMensaje: m.texto, ultimaFecha: m.created_at, totalMensajes: 0,
      }
    }
    grupos[par].totalMensajes++
  }
  return Object.values(grupos)
}

// Traer todos los mensajes entre dos personas
export async function obtenerConversacion(idA: string, idB: string): Promise<MensajeAdmin[]> {
  const { data: mensajes, error } = await supabase
    .from('mensajes')
    .select('*')
    .or(`and(emisor_id.eq.${idA},receptor_id.eq.${idB}),and(emisor_id.eq.${idB},receptor_id.eq.${idA})`)
    .order('created_at', { ascending: true })

  if (error || !mensajes) { console.error(error); return [] }

  const { data: perfiles } = await supabase.from('profiles').select('id, first_name, last_name')
  const nombre = (id: string) => {
    const p = perfiles?.find(x => x.id === id)
    return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre' : 'Desconocido'
  }

  return mensajes.map(m => ({
    ...m,
    emisor_nombre: nombre(m.emisor_id),
    receptor_nombre: nombre(m.receptor_id),
  })) as MensajeAdmin[]
}

// Traer UNA sesión por su ID (para abrir desde el chat)
export async function obtenerSesionPorId(sesionId: string): Promise<SesionAdmin | null> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('id', sesionId)
    .maybeSingle()

  if (error || !data) { console.error(error); return null }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', data.profile_id)
    .maybeSingle()

  return {
    ...data,
    usuario_nombre: perfil ? `${perfil.first_name || ''} ${perfil.last_name || ''}`.trim() : 'Usuario',
  } as SesionAdmin
}

// ============================================================
// SESIONES AGRUPADAS POR USUARIO
// ============================================================
export interface UsuarioConSesiones {
  id: string
  nombre: string
  email: string
  totalSesiones: number
  ultimaFecha: string | null
  calidadPromedio: number
}

export async function obtenerUsuariosConSesiones(): Promise<UsuarioConSesiones[]> {
  const { data: sesiones } = await supabase
    .from('training_sessions')
    .select('profile_id, reps_validas, reps_invalidas, created_at')

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, rol')

  if (!perfiles) return []

  // Agrupar sesiones por usuario
  const porUsuario: Record<string, { total: number, validas: number, totalReps: number, ultima: string }> = {}
  sesiones?.forEach(s => {
    if (!porUsuario[s.profile_id]) {
      porUsuario[s.profile_id] = { total: 0, validas: 0, totalReps: 0, ultima: s.created_at }
    }
    const u = porUsuario[s.profile_id]
    u.total++
    u.validas += s.reps_validas || 0
    u.totalReps += (s.reps_validas || 0) + (s.reps_invalidas || 0)
    if (s.created_at > u.ultima) u.ultima = s.created_at
  })

  // Solo usuarios que tienen sesiones
  return perfiles
    .filter(p => porUsuario[p.id])
    .map(p => {
      const u = porUsuario[p.id]
      return {
        id: p.id,
        nombre: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre',
        email: p.email || '',
        totalSesiones: u.total,
        ultimaFecha: u.ultima,
        calidadPromedio: u.totalReps > 0 ? Math.round((u.validas / u.totalReps) * 100) : 0,
      }
    })
    .sort((a, b) => b.totalSesiones - a.totalSesiones)
}

// Sesiones de UN usuario específico
export async function obtenerSesionesDeUsuario(usuarioId: string): Promise<SesionAdmin[]> {
  const { data: sesiones, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('profile_id', usuarioId)
    .order('created_at', { ascending: false })

  if (error || !sesiones) return []

  const { data: perfil } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', usuarioId)
    .maybeSingle()

  const nombre = perfil ? `${perfil.first_name || ''} ${perfil.last_name || ''}`.trim() : 'Usuario'
  return sesiones.map(s => ({ ...s, usuario_nombre: nombre })) as SesionAdmin[]
}
// Agrega esto al final de tu archivo lib/adminService.ts

export async function loginComoAdmin(email: string, clave: string): Promise<{ exito: boolean; error?: string }> {
  try {
    // 1. Iniciar sesión con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: clave,
    })

    if (error) return { exito: false, error: 'Credenciales incorrectas.' }
    if (!data.user) return { exito: false, error: 'No se pudo obtener el usuario.' }

    // 2. Verificar en la tabla profiles si el usuario tiene el rol 'admin'
    const { data: perfil, error: errorPerfil } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', data.user.id)
      .single()

    if (errorPerfil || !perfil) {
      await supabase.auth.signOut()
      return { exito: false, error: 'Error al verificar los permisos del perfil.' }
    }

    if (perfil.rol !== 'admin') {
      // Si entra un usuario o entrenador normal, le cerramos la sesión y lo bloqueamos
      await supabase.auth.signOut()
      return { exito: false, error: 'Acceso denegado. No eres administrador.' }
    }

    return { exito: true }
  } catch (err) {
    console.error(err)
    return { exito: false, error: 'Error inesperado en el servidor.' }
  }
}
// ============================================================
// FUNCIONES DE EJERCICIOS — agrégalas al final de lib/adminService.ts
// (gestión de ejercicios: listar, crear, editar, activar/desactivar, borrar)
// ============================================================

export interface EjercicioAdmin {
  id: string
  clave: string
  nombre: string
  musculo: string
  requiere_camara: boolean
  disponible: boolean
  descripcion: string | null
  created_at: string
}

// Traer TODOS los ejercicios (los que funcionan y los "en desarrollo")
export async function obtenerEjercicios(): Promise<EjercicioAdmin[]> {
  const { data, error } = await supabase
    .from('ejercicios')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !data) { console.error(error); return [] }
  return data as EjercicioAdmin[]
}

// Crear un ejercicio nuevo. Por defecto queda "en desarrollo" (disponible=false),
// porque la detección de ángulos hay que programarla en la app.
export async function crearEjercicio(datos: {
  clave: string
  nombre: string
  musculo: string
  descripcion: string
}): Promise<{ exito: boolean; error?: string }> {
  // Validar que la clave no exista ya
  const { data: existe } = await supabase
    .from('ejercicios')
    .select('id')
    .eq('clave', datos.clave)
    .maybeSingle()

  if (existe) {
    return { exito: false, error: 'Ya existe un ejercicio con esa clave.' }
  }

  const { error } = await supabase.from('ejercicios').insert({
    clave: datos.clave,
    nombre: datos.nombre,
    musculo: datos.musculo,
    descripcion: datos.descripcion,
    requiere_camara: true,
    disponible: false, // nuevo = en desarrollo
  })

  if (error) { console.error(error); return { exito: false, error: 'No se pudo crear el ejercicio.' } }
  return { exito: true }
}

// Editar un ejercicio existente (nombre, músculo, descripción)
export async function editarEjercicio(id: string, datos: {
  nombre: string
  musculo: string
  descripcion: string
}): Promise<boolean> {
  const { error } = await supabase
    .from('ejercicios')
    .update({
      nombre: datos.nombre,
      musculo: datos.musculo,
      descripcion: datos.descripcion,
    })
    .eq('id', id)

  if (error) { console.error(error); return false }
  return true
}

// Activar / desactivar la disponibilidad (el interruptor "en desarrollo")
export async function cambiarDisponibilidad(id: string, disponible: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('ejercicios')
    .update({ disponible })
    .eq('id', id)

  if (error) { console.error(error); return false }
  return true
}

// Borrar un ejercicio
export async function eliminarEjercicio(id: string): Promise<boolean> {
  const { error } = await supabase.from('ejercicios').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}