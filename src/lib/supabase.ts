import { createClient } from '@supabase/supabase-js'

// Las credenciales van en el archivo .env (NO se suben a GitHub)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey)