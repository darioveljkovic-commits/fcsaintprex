import { useState, useEffect } from 'react'
import { supabase, calcVO2, vo2Level, sprintLevel, GROUPS } from '../lib/supabase'
import PlayerModal from '../components/PlayerModal'

export default function Fitness({ currentPlayer, isAdmin }) {
  const [players, setPlayers] = useState([])
  const [tests, setTests] = useState([])
  const [selected, setSelected] = useState(null)
  const [activeGroup, setActiveGroup] = useState(currentPlayer?.group_name || '+30')
  const [activeTest, setActiveTest] = useState('cooper')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: p } = await supabase.from('players').select('*').eq('active', true)
      const { data: t } = await supabase.from('fitness_tests').select('*')
      setPlayers(p || [])
      setTests(t || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const canSee = isAdmin || activeGroup === currentPlayer?.group_name

  const groupPlayers = players.filter(p => p.group_name === activeGroup)

  const getRanked = () => {
    return groupPlayers.map(p => {
      const playerTests = tests.filter(t => t.player_id === p.id && t.test_type === activeTest)
        .sort((a, b) => a.test_date.localeCompare(b.test_date))
      const last = playerTests[playerTests.length - 1]
      const prev = playerTests[playerTests.length - 2]
      return { p, last, prev, playerTests }
    }).filter(r => r.last)
      .sort((a, b) => activeTest === 'cooper'
        ? calcVO2(b.last.value) - calcVO2(a.last.value)
        : a.last.value - b.last.value
      )
  }

  const notTested = groupPlayers.filter(p => !tests.some(t => t.player_id === p.id && t.test_type === activeTest))

  if (loading) return <div className="loading">Chargement...</div>

  const ranked = getRanked()

  return (
    <div className="content">
      <div className="group-tabs">
        {(isAdmin ? GROUPS : [currentPlayer?.group_name]).map(g => (
          <div key={g} className={`group-tab${g === activeGroup ? ' active' : ''}`} onClick={() => setActiveGroup(g)}>
            {g}
          </div>
        ))}
      </div>

      <div className="test-tabs">
        <div className={`test-tab${activeTest === 'cooper' ? ' active' : ''}`} onClick={() => setActiveTest('cooper')}>🏃 Cooper</div>
        <div className={`test-tab${activeTest === 'sprint' ? ' active' : ''}`} onClick={() => setActiveTest('sprint')}>⚡ 30m Sprint</div>
      </div>

      {!canSee ? (
        <div className="card">
          <p className="locked-msg">🔒 Données fitness visibles uniquement pour votre groupe (Seniors {currentPlayer?.group_name})</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-title">
            {activeTest === 'cooper' ? '🏃 Cooper — VO2max' : '⚡ 30m Sprint'} — Seniors {activeGroup}
          </div>
          <table className="fitness-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Joueur</th>
                <th>{activeTest === 'cooper' ? 'Distance' : 'Temps'}</th>
                <th>{activeTest === 'cooper' ? 'VO2max' : 'Niveau'}</th>
                <th>Évolution</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ p, last, prev }, i) => {
                const rc = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : 'r0'
                let lv, display, evol

                if (activeTest === 'cooper') {
                  const vo2 = calcVO2(last.value)
                  lv = vo2Level(vo2)
                  display = `${last.value}m`
                  const pill = `${vo2.toFixed(1)} — ${lv.l}`
                  const diff = prev ? last.value - prev.value : null
                  evol = diff !== null
                    ? diff >= 0 ? <span className="evol-up">▲ +{diff}m</span> : <span className="evol-down">▼ {diff}m</span>
                    : '—'
                  return (
                    <tr key={p.id}>
                      <td><span className={`rank-num ${rc}`}>{i + 1}</span></td>
                      <td style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}{p.captain && ' 🅲'}</td>
                      <td>{display}</td>
                      <td><span className={`pill pill-${lv.c}`}>{pill}</span></td>
                      <td>{evol}</td>
                      <td style={{ color: 'var(--gray-4)', fontSize: 11 }}>{last.test_date}</td>
                    </tr>
                  )
                } else {
                  lv = sprintLevel(last.value)
                  display = `${last.value.toFixed(2)}s`
                  const diff = prev ? last.value - prev.value : null
                  evol = diff !== null
                    ? diff <= 0 ? <span className="evol-up">▲ {diff.toFixed(2)}s</span> : <span className="evol-down">▼ +{diff.toFixed(2)}s</span>
                    : '—'
                  return (
                    <tr key={p.id}>
                      <td><span className={`rank-num ${rc}`}>{i + 1}</span></td>
                      <td style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</td>
                      <td>{display}</td>
                      <td><span className={`pill pill-${lv.c}`}>{lv.l}</span></td>
                      <td>{evol}</td>
                      <td style={{ color: 'var(--gray-4)', fontSize: 11 }}>{last.test_date}</td>
                    </tr>
                  )
                }
              })}
              {notTested.map(p => (
                <tr key={p.id}>
                  <td><span className="rank-num r0">—</span></td>
                  <td>{p.first_name} {p.last_name}</td>
                  <td colSpan={4} style={{ color: 'var(--gray-4)' }}>Pas encore testé</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          onUpdate={() => {}}
        />
      )}
    </div>
  )
}
