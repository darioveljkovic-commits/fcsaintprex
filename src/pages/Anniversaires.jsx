import { useState, useEffect } from 'react'
import { supabase, getAge, nextBday } from '../lib/supabase'

export default function Anniversaires() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('players').select('*').eq('active', true).then(({ data }) => {
      setPlayers((data || []).map(p => ({ ...p, days: nextBday(p.born) })).sort((a, b) => a.days - b.days))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading">Chargement...</div>

  return (
    <div className="content">
      <div className="card">
        <div className="card-title">🎂 Anniversaires de l'équipe</div>
        <div className="bday-list">
          {players.map(p => {
            if (!p.born) return null
            const d = new Date(p.born)
            const lbl = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} — ${getAge(p.born)} ans`
            const cls = p.days === 0 ? 'today' : p.days <= 14 ? 'soon' : ''
            const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase()
            return (
              <div key={p.id} className={`bday-row ${cls}`}>
                <div className="bday-avatar">{initials}</div>
                <div style={{ flex: 1 }}>
                  <div className="bday-name">
                    {p.first_name} {p.last_name}
                    <span style={{ fontSize: 11, color: 'var(--gray-4)', marginLeft: 4 }}>({p.group_name})</span>
                  </div>
                  <div className="bday-date">{lbl}</div>
                </div>
                {p.days === 0
                  ? <span className="bday-today-badge">🎂 Aujourd'hui!</span>
                  : p.days <= 14
                    ? <span className="bday-soon-badge">dans {p.days}j</span>
                    : <span style={{ fontSize: 11, color: 'var(--gray-4)' }}>dans {p.days}j</span>
                }
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
