import { useState, useEffect } from 'react'
import { supabase, GROUPS } from '../lib/supabase'

const POSITION_MAP = {
  'gardien': { x: 50, y: 91 },
  'but': { x: 50, y: 91 },
  'défense latérale droite': { x: 83, y: 74 },
  'défense latérale gauche': { x: 17, y: 74 },
  'libéro': { x: 50, y: 76 },
  'défense avant': { x: 35, y: 68 },
  'demi défensif': { x: 50, y: 60 },
  'demi (défensif)': { x: 50, y: 60 },
  'demi droit intérieur': { x: 73, y: 54 },
  'demi gauche intérieur': { x: 27, y: 54 },
  'demi droit extérieur': { x: 83, y: 44 },
  'demi gauche extérieur': { x: 17, y: 44 },
  'demi gauche': { x: 25, y: 50 },
  'demi droit': { x: 75, y: 50 },
  'milieu': { x: 50, y: 50 },
  'attaque centrale': { x: 50, y: 22 },
  'attaque de pointe': { x: 50, y: 18 },
  'pointe attaque droite': { x: 68, y: 24 },
  "pointe d'attaque droite": { x: 68, y: 24 },
  'remplacement': null,
  'entraîneur': null,
}

function getCoords(position) {
  if (!position) return null
  const p = position.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  for (const [key, val] of Object.entries(POSITION_MAP)) {
    const k = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (p.includes(k) || k.includes(p)) return val
  }
  return null
}

function placePlayers(players, getPos) {
  const onField = []
  const sidebar = []
  const groups = {}

  players.forEach(p => {
    const pos = getPos(p)
    if (!pos) { sidebar.push(p); return }
    const key = `${Math.round(pos.x)}_${Math.round(pos.y)}`
    if (!groups[key]) groups[key] = { pos, players: [] }
    groups[key].players.push(p)
  })

  Object.values(groups).forEach(({ pos, players }) => {
    const n = players.length
    players.forEach((p, i) => {
      let x = pos.x
      if (n > 1) {
        const spread = (n - 1) * 12
        x = pos.x - spread / 2 + i * 12
        x = Math.max(8, Math.min(92, x))
      }
      onField.push({ ...p, _x: x, _y: pos.y })
    })
  })

  return { onField, sidebar }
}

export default function Postes({ currentPlayer, isAdmin }) {
  const [players, setPlayers] = useState([])
  const [activeGroup, setActiveGroup] = useState(currentPlayer?.group_name || '+40')
  const [activeView, setActiveView] = useState('poste')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('players').select('*').then(({ data }) => {
      setPlayers(data || [])
      setLoading(false)
    })
  }, [])

  const initials = p => `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase()

  const grouped = players.filter(p => p.group_name === activeGroup && p.position !== 'Entraîneur')

  const getPos = p => activeView === 'poste'
    ? getCoords(p.position)
    : getCoords(p.preferred_position || p.position)

  const { onField, sidebar } = placePlayers(grouped, getPos)

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

      <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
        <div className="field-outer" style={{flex:'1 1 auto'}}>
          <svg viewBox="0 0 320 480" xmlns="http://www.w3.org/2000/svg" className="field-svg">
            <rect width="320" height="480" fill="#2d7a2d"/>
            <defs>
              <pattern id="stripe3" x="0" y="0" width="40" height="480" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="480" fill="rgba(255,255,255,0.04)"/>
              </pattern>
            </defs>
            <rect width="320" height="480" fill="url(#stripe3)"/>
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

          {onField.map(p => (
            <div key={p.id} className="field-player" style={{left:`${p._x}%`, top:`${p._y}%`}} onClick={() => setSelected(selected?.id === p.id ? null : p)}>
              <div className={`field-avatar${isGk(p) ? ' field-gk' : ''}${selected?.id === p.id ? ' field-selected' : ''}`}>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.last_name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                  : initials(p)
                }
              </div>
              <div className="field-name">{p.last_name}</div>
            </div>
          ))}
        </div>

        {sidebar.length > 0 && (
          <div style={{width:90,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--gray-4)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Sans poste</div>
            {sidebar.map(p => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,cursor:'pointer'}} onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'var(--red-light)',border:'1.5px solid var(--red)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'var(--red)',flexShrink:0,overflow:'hidden'}}>
                  {p.photo_url ? <img src={p.photo_url} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} alt=""/> : initials(p)}
                </div>
                <div style={{fontSize:10,fontWeight:500,color:'var(--gray-5)',lineHeight:1.2}}>{p.last_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="card" style={{marginTop:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:48,height:48,borderRadius:'50%',background:'var(--red-light)',border:'2px solid var(--red)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'var(--red)',overflow:'hidden',flexShrink:0}}>
              {selected.photo_url ? <img src={selected.photo_url} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} alt=""/> : initials(selected)}
            </div>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>{selected.first_name} {selected.last_name}</div>
              <div style={{fontSize:12,color:'var(--gray-4)'}}>Poste: {selected.position || '—'}</div>
              <div style={{fontSize:12,color:'var(--gray-4)'}}>Préférence: {selected.preferred_position || '—'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
