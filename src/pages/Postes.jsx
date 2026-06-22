import { useState, useEffect } from 'react'
import { supabase, GROUPS } from '../lib/supabase'

// Strict position mapping - exact normalized strings only
const POSITION_COORDS = {
  'gardien':                        { x: 50, y: 91 },
  'but':                            { x: 50, y: 91 },
  'defense laterale droite':        { x: 82, y: 75 },
  'defense lat droite':             { x: 82, y: 75 },
  'defense laterale gauche':        { x: 18, y: 75 },
  'defense lat gauche':             { x: 18, y: 75 },
  'libero':                         { x: 50, y: 76 },
  'stopper':                        { x: 35, y: 74 },
  'defense avant':                  { x: 35, y: 68 },
  'demi defensif':                  { x: 50, y: 60 },
  'demi droit interieur':           { x: 72, y: 54 },
  'demi gauche interieur':          { x: 28, y: 54 },
  'demi droit exterieur':           { x: 82, y: 43 },
  'demi gauche exterieur':          { x: 18, y: 43 },
  'demi gauche':                    { x: 28, y: 50 },
  'demi droit':                     { x: 72, y: 50 },
  'milieu':                         { x: 50, y: 50 },
  'milieu defensif':                { x: 50, y: 56 },
  'milieu offensif':                { x: 50, y: 44 },
  'milieu droite':                  { x: 72, y: 50 },
  'milieu gauche':                  { x: 28, y: 50 },
  'milieu droite gauche':           { x: 50, y: 50 },
  'attaque centrale':               { x: 50, y: 22 },
  'attaque de pointe':              { x: 50, y: 18 },
  'attaquant':                      { x: 50, y: 22 },
  'pointe attaque droite':          { x: 68, y: 24 },
  'ailier droit':                   { x: 82, y: 28 },
  'ailier gauche':                  { x: 18, y: 28 },
  'remplacement':                   null,
  'entraineur':                     null,
  'assistant entraineur':           null,
  'lateral droit':                  { x: 82, y: 75 },
  'lateral gauche':                 { x: 18, y: 75 },
  'defenseur central':              { x: 50, y: 76 },
  'milieu central':                 { x: 50, y: 50 },
  'avant-centre':                   { x: 50, y: 18 },
  'avant centre':                   { x: 50, y: 18 },
}

// Positions that should NEVER match as goalkeeper
const NOT_GK = ['demi', 'milieu', 'defense', 'defenseur', 'attaque', 'attaquant', 'ailier', 'libero', 'stopper', 'lateral', 'remplacement', 'entraineur']

function norm(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9 ]/g, '')      // remove special chars
    .replace(/\s+/g, ' ')             // normalize spaces
    .trim()
}

function getCoords(position) {
  if (!position || position === '—') return null
  const n = norm(position)
  
  // Skip null positions
  if (['remplacement', 'entraineur', 'coach', 'assistant entraineur'].some(s => n === s || n.startsWith(s + ' '))) return null

  // Try exact match first
  if (POSITION_COORDS[n] !== undefined) return POSITION_COORDS[n]

  // Try contains match - but STRICT: full key must be contained in position
  for (const [key, val] of Object.entries(POSITION_COORDS)) {
    if (key === 'but' || key === 'gardien') {
      // Goalkeeper: only match if position explicitly says gardien/but
      // AND does not contain any field player word
      if (n.includes(key) && !NOT_GK.some(s => n.includes(s))) {
        return val
      }
    } else if (key.length > 4 && n.includes(key)) {
      return val
    }
  }
  
  // milieu with droite/gauche
  if (n.includes('milieu')) {
    if (n.includes('droit')) return { x: 72, y: 50 }
    if (n.includes('gauche')) return { x: 28, y: 50 }
    return { x: 50, y: 50 }
  }

  // Generic fallback for unknown positions - put on sidebar
  return null
}

function placeOnField(players, getPos) {
  const onField = []
  const sidebar = []
  const groups = {}

  players.forEach(p => {
    const pos = getPos(p)
    if (!pos) { sidebar.push(p); return }
    const key = `${Math.round(pos.x)}_${Math.round(pos.y)}`
    if (!groups[key]) groups[key] = { pos, list: [] }
    groups[key].list.push(p)
  })

  Object.values(groups).forEach(({ pos, list }) => {
    const n = list.length
    const spacing = 13
    const totalWidth = (n - 1) * spacing
    const startX = pos.x - totalWidth / 2
    list.forEach((p, i) => {
      const x = Math.max(8, Math.min(92, startX + i * spacing))
      onField.push({ ...p, _x: x, _y: pos.y })
    })
  })

  return { onField, sidebar }
}

function isGoalie(p, view) {
  const pos = view === 'poste' ? p.position : (p.preferred_position || p.position)
  if (!pos) return false
  const n = norm(pos)
  return (n.includes('gardien') || n === 'but') && !NOT_GK.some(s => n.includes(s))
}

export default function Postes({ currentPlayer, isAdmin }) {
  const [players, setPlayers] = useState([])
  const [activeGroup, setActiveGroup] = useState(currentPlayer?.group_name || '+40')
  const [activeView, setActiveView] = useState('poste')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('players').select('*').eq('active', true).then(({ data }) => {
      setPlayers(data || [])
      setLoading(false)
    })
  }, [])

  const initials = p => `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase()

  const grouped = players.filter(p =>
    p.group_name === activeGroup &&
    norm(p.position || '') !== 'entraineur'
  )

  const getPos = p => {
    if (activeView === 'poste') {
      return getCoords(p.position)
    } else {
      const pref = p.preferred_position
      if (!pref || pref.trim() === '' || pref === '—') return null
      return getCoords(pref)
    }
  }

  const { onField, sidebar } = placeOnField(grouped, getPos)

  return (
    <div className="content">
      <div className="group-tabs">
        {GROUPS.map(g => (
          <div key={g} className={`group-tab${g === activeGroup ? ' active' : ''}`}
            onClick={() => { setActiveGroup(g); setSelected(null) }}>{g}</div>
        ))}
      </div>
      <div className="test-tabs">
        <div className={`test-tab${activeView === 'poste' ? ' active' : ''}`}
          onClick={() => { setActiveView('poste'); setSelected(null) }}>Poste</div>
        <div className={`test-tab${activeView === 'pref' ? ' active' : ''}`}
          onClick={() => { setActiveView('pref'); setSelected(null) }}>Préférence</div>
      </div>
      <div style={{fontSize:12,color:'var(--gray-4)',background:'var(--gray-1)',borderRadius:8,padding:'8px 12px',marginBottom:12,lineHeight:1.6}}>
        {activeView === 'poste'
          ? <span>🔵 <strong style={{color:'var(--gray-5)'}}>Poste</strong> — attribué par le coach selon les matchs.</span>
          : <span>🟢 <strong style={{color:'var(--gray-5)'}}>Préférence</strong> — où tu aimes jouer idéalement. À renseigner dans ton profil.</span>
        }
      </div>

      {activeView === 'pref' && onField.length === 0 && sidebar.length > 0 && (
        <div style={{background:'#fff8e1',border:'1px solid #f0c040',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#856404',marginBottom:12}}>
          Aucun joueur n'a encore renseigné sa préférence de poste. Les joueurs peuvent le faire dans leur profil.
        </div>
      )}

      <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
        <div className="field-outer" style={{flex:'1 1 auto'}}>
          <svg viewBox="0 0 320 480" xmlns="http://www.w3.org/2000/svg" className="field-svg">
            <rect width="320" height="480" fill="#2d7a2d"/>
            <defs>
              <pattern id="strp" x="0" y="0" width="40" height="480" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="480" fill="rgba(255,255,255,0.04)"/>
              </pattern>
            </defs>
            <rect width="320" height="480" fill="url(#strp)"/>
            <rect x="10" y="10" width="300" height="460" fill="none" stroke="white" strokeWidth="2" opacity="0.9"/>
            <line x1="10" y1="240" x2="310" y2="240" stroke="white" strokeWidth="1" opacity="0.8"/>
            <circle cx="160" cy="240" r="40" fill="none" stroke="white" strokeWidth="1" opacity="0.8"/>
            <circle cx="160" cy="240" r="3" fill="white" opacity="0.8"/>
            <rect x="90" y="10" width="140" height="55" fill="none" stroke="white" strokeWidth="1" opacity="0.8"/>
            <rect x="115" y="10" width="90" height="25" fill="none" stroke="white" strokeWidth="1" opacity="0.8"/>
            <rect x="90" y="415" width="140" height="55" fill="none" stroke="white" strokeWidth="1" opacity="0.8"/>
            <rect x="115" y="445" width="90" height="25" fill="none" stroke="white" strokeWidth="1" opacity="0.8"/>
            <circle cx="160" cy="390" r="3" fill="white" opacity="0.8"/>
            <circle cx="160" cy="90" r="3" fill="white" opacity="0.8"/>
          </svg>

          {onField.map(p => (
            <div key={p.id} className="field-player"
              style={{left:`${p._x}%`, top:`${p._y}%`}}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}>
              <div className={`field-avatar${isGoalie(p, activeView) ? ' field-gk' : ''}${selected?.id === p.id ? ' field-selected' : ''}`}>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.last_name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                  : initials(p)}
              </div>
              <div className="field-name">{p.last_name}</div>
            </div>
          ))}
        </div>

        {sidebar.length > 0 && (
          <div style={{width:90, flexShrink:0, paddingTop:4}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--gray-4)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>
              {activeView === 'pref' ? 'Sans préf.' : 'Sans poste'}
            </div>
            {sidebar.map(p => (
              <div key={p.id}
                style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,cursor:'pointer',opacity:p.active===false?0.5:1}}
                onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                <div style={{width:28,height:28,borderRadius:'50%',
                  background:p.active===false?'var(--gray-2)':'var(--red-light)',
                  border:`1.5px solid ${p.active===false?'var(--gray-3)':'var(--red)'}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:9,fontWeight:700,
                  color:p.active===false?'var(--gray-4)':'var(--red)',
                  flexShrink:0,overflow:'hidden'}}>
                  {p.photo_url
                    ? <img src={p.photo_url} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} alt=""/>
                    : initials(p)}
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
            <div style={{width:52,height:52,borderRadius:'50%',background:'var(--red-light)',border:'2px solid var(--red)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'var(--red)',
              overflow:'hidden',flexShrink:0}}>
              {selected.photo_url
                ? <img src={selected.photo_url} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} alt=""/>
                : initials(selected)}
            </div>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>{selected.first_name} {selected.last_name}</div>
              <div style={{fontSize:12,color:'var(--gray-4)',marginTop:2}}>
                <span style={{marginRight:12}}>Poste: <strong style={{color:'var(--gray-5)'}}>{selected.position || '—'}</strong></span>
                <span>Préférence: <strong style={{color:'var(--gray-5)'}}>{selected.preferred_position || 'non renseigné'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="loading">Chargement...</div>}
    </div>
  )
}
