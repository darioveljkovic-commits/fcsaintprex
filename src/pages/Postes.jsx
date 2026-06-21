import { useState, useEffect } from 'react'
import { supabase, GROUPS } from '../lib/supabase'

const POSITION_COORDS = {
  'Gardien': { x: 50, y: 91 },
  'But': { x: 50, y: 91 },
  'Défense latérale droite': { x: 82, y: 75 },
  'Défense latérale gauche': { x: 18, y: 75 },
  'Libéro': { x: 50, y: 78 },
  'Défense avant': { x: 35, y: 70 },
  'Demi défensif': { x: 50, y: 60 },
  'Demi (défensif)': { x: 50, y: 60 },
  'Demi droit intérieur': { x: 75, y: 55 },
  'Demi gauche intérieur': { x: 25, y: 55 },
  'Demi droit extérieur': { x: 82, y: 45 },
  'Demi gauche extérieur': { x: 18, y: 45 },
  'Demi gauche': { x: 25, y: 50 },
  'Demi droit': { x: 75, y: 50 },
  'Milieu': { x: 50, y: 50 },
  'Attaque centrale': { x: 50, y: 22 },
  'Attaque de pointe': { x: 50, y: 18 },
  'Pointe attaque droite': { x: 72, y: 22 },
  'Pointe d\'attaque droite': { x: 72, y: 22 },
  'Demi droit extérieur attaque': { x: 80, y: 28 },
  'Remplacement': { x: 50, y: 50 },
  'Entraîneur': { x: 50, y: 50 },
}

const DEFAULT_POS = { x: 50, y: 50 }

function getCoords(position) {
  if (!position) return DEFAULT_POS
  for (const [key, val] of Object.entries(POSITION_COORDS)) {
    if (position.toLowerCase().includes(key.toLowerCase())) return val
  }
  return DEFAULT_POS
}

function jitter(players, getPos) {
  const placed = []
  return players.map(p => {
    let pos = getPos(p)
    let { x, y } = pos
    let attempts = 0
    while (placed.some(q => Math.abs(q.x - x) < 12 && Math.abs(q.y - y) < 10) && attempts < 20) {
      x = pos.x + (Math.random() - 0.5) * 15
      y = pos.y + (Math.random() - 0.5) * 10
      attempts++
    }
    placed.push({ x, y })
    return { ...p, _x: x, _y: y }
  })
}

export default function Postes({ currentPlayer, isAdmin }) {
  const [players, setPlayers] = useState([])
  const [activeGroup, setActiveGroup] = useState(currentPlayer?.group_name || '+40')
  const [activeView, setActiveView] = useState('poste')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('players').select('*').eq('active', true).then(({ data }) => {
      setPlayers(data || [])
      setLoading(false)
    })
  }, [])

  const initials = p => `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase()

  const grouped = players.filter(p => p.group_name === activeGroup)
    .filter(p => p.position !== 'Entraîneur')

  const getPos = p => activeView === 'poste'
    ? getCoords(p.position)
    : getCoords(p.preferred_position || p.position)

  const positioned = jitter(grouped, getPos)

  const isGk = p => {
    const pos = activeView === 'poste' ? p.position : (p.preferred_position || p.position)
    return pos && (pos.toLowerCase().includes('gardien') || pos.toLowerCase().includes('but'))
  }

  if (loading) return <div className="loading">Chargement...</div>

  return (
    <div className="content">
      <div className="group-tabs">
        {GROUPS.map(g => (
          <div key={g} className={`group-tab${g === activeGroup ? ' active' : ''}`} onClick={() => setActiveGroup(g)}>{g}</div>
        ))}
      </div>

      <div className="test-tabs">
        <div className={`test-tab${activeView === 'poste' ? ' active' : ''}`} onClick={() => setActiveView('poste')}>Poste</div>
        <div className={`test-tab${activeView === 'pref' ? ' active' : ''}`} onClick={() => setActiveView('pref')}>Préférence</div>
      </div>

      <div className="field-outer">
        <svg viewBox="0 0 320 480" xmlns="http://www.w3.org/2000/svg" className="field-svg">
          <rect width="320" height="480" fill="#2d7a2d"/>
          <defs>
            <pattern id="stripe2" x="0" y="0" width="40" height="480" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="20" height="480" fill="rgba(255,255,255,0.04)"/>
            </pattern>
          </defs>
          <rect width="320" height="480" fill="url(#stripe2)"/>
          <rect x="10" y="10" width="300" height="460" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
          <line x1="10" y1="240" x2="310" y2="240" stroke="white" stroke-width="1" opacity="0.8"/>
          <circle cx="160" cy="240" r="40" fill="none" stroke="white" stroke-width="1" opacity="0.8"/>
          <circle cx="160" cy="240" r="3" fill="white" opacity="0.8"/>
          <rect x="90" y="10" width="140" height="55" fill="none" stroke="white" stroke-width="1" opacity="0.8"/>
          <rect x="115" y="10" width="90" height="25" fill="none" stroke="white" stroke-width="1" opacity="0.8"/>
          <rect x="90" y="415" width="140" height="55" fill="none" stroke="white" stroke-width="1" opacity="0.8"/>
          <rect x="115" y="445" width="90" height="25" fill="none" stroke="white" stroke-width="1" opacity="0.8"/>
          <circle cx="160" cy="390" r="3" fill="white" opacity="0.8"/>
          <circle cx="160" cy="90" r="3" fill="white" opacity="0.8"/>
        </svg>

        {positioned.map(p => (
          <div key={p.id} className="field-player" style={{ left: `${p._x}%`, top: `${p._y}%` }}>
            <div className={`field-avatar${isGk(p) ? ' field-gk' : ''}`}>
              {p.photo_url
                ? <img src={p.photo_url} alt={p.last_name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                : initials(p)
              }
            </div>
            <div className="field-name">{p.last_name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
