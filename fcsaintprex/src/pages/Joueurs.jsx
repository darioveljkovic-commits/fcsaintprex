import { useState, useEffect } from 'react'
import { supabase, GROUPS } from '../lib/supabase'
import PlayerModal from '../components/PlayerModal'

export default function Joueurs({ currentPlayer, isAdmin }) {
  const [players, setPlayers] = useState([])
  const [tests, setTests] = useState([])
  const [activeGroup, setActiveGroup] = useState(currentPlayer?.group_name || '+30')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const { data: pData } = await supabase.from('players').select('*').eq('active', true).order('last_name')
    const { data: tData } = await supabase.from('fitness_tests').select('*')
    setPlayers(pData || [])
    setTests(tData || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const initials = (p) => `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase()

  const filtered = search.trim()
    ? players.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        (p.position || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.job || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.passions || '').toLowerCase().includes(search.toLowerCase()) ||
        p.group_name.includes(search)
      )
    : players.filter(p => p.group_name === activeGroup)

  if (loading) return <div className="loading">Chargement...</div>

  return (
    <>
      <div className="search-wrap">
        <input
          className="search-input"
          type="text"
          placeholder="🔍 Rechercher nom, poste, passion, groupe..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="content">
        {!search.trim() && (
          <div className="group-tabs">
            {GROUPS.map(g => (
              <div key={g} className={`group-tab${g === activeGroup ? ' active' : ''}`} onClick={() => setActiveGroup(g)}>
                {g}
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="no-results">Aucun joueur trouvé</div>
        ) : (
          <div className="player-grid">
            {filtered.map(p => (
              <div key={p.id} className="player-card" onClick={() => setSelected(p)}>
                {p.photo_url
                  ? <img src={p.photo_url} className="player-photo" alt={p.last_name} />
                  : <div className="player-avatar">{initials(p)}</div>
                }
                <div className="player-name">
                  {p.first_name} {p.last_name}
                  {p.captain && <span className="captain-tag">C</span>}
                </div>
                <div className="player-pos">{p.preferred_position || p.position || '—'}</div>
                <span className="player-group-tag">Seniors {p.group_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PlayerModal
          player={selected}
          tests={tests.filter(t => t.player_id === selected.id)}
          isOwn={currentPlayer?.id === selected.id}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onUpdate={() => { fetchData(); setSelected(prev => players.find(p => p.id === prev?.id) || prev) }}
        />
      )}
    </>
  )
}
