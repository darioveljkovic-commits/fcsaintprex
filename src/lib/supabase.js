import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const calcVO2 = (dist) => ((dist / 1000) - 0.3138) / 0.0278
export const vo2Level = (v) => v >= 48 ? { l: 'Excellent', c: 'good' } : v >= 42 ? { l: 'Bon', c: 'good' } : v >= 35 ? { l: 'Moyen', c: 'avg' } : { l: 'Faible', c: 'low' }
export const sprintLevel = (t) => t <= 4.0 ? { l: 'Excellent', c: 'good' } : t <= 4.5 ? { l: 'Bon', c: 'good' } : t <= 5.0 ? { l: 'Moyen', c: 'avg' } : { l: 'Faible', c: 'low' }

export const getAge = (born) => {
  if (!born) return '—'
  const d = new Date(born), n = new Date()
  let a = n.getFullYear() - d.getFullYear()
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}
// Age at next birthday (for birthday display only)
export const getAgeNext = (born) => {
  if (!born) return '—'
  return getAge(born) + 1
}

export const nextBday = (born) => {
  if (!born) return 999
  const d = new Date(born), n = new Date()
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate())
  let nx = new Date(n.getFullYear(), d.getMonth(), d.getDate())
  if (nx.getTime() === today.getTime()) return 0
  if (nx < today) nx = new Date(n.getFullYear() + 1, d.getMonth(), d.getDate())
  return Math.ceil((nx - today) / 86400000)
}

export const GROUPS = ['+30', '+40', '+50']

// Rufname-Helper: Rufname (nickname) wenn gesetzt, sonst Vorname
export const displayFirst = (player) => player?.nickname || player?.first_name || ''
export const displayName = (player) => `${displayFirst(player)} ${player?.last_name || ''}`.trim()
