import { useState, useEffect } from 'react'
import { supabase, calcVO2, vo2Level, sprintLevel, GROUPS } from '../lib/supabase'

export default function Admin() {
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [filterGroup, setFilterGroup] = useState('+40')
  const [playerSearch, setPlayerSearch] = useState('')
  const [testType, setTestType] = useState('cooper')
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0])
  const [value, setValue] = useState('')
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  // New player form
  const [newPlayer, setNewPlayer] = useState({ first_name: '', last_name: '', born: '', group_name: '+40', position: '', job: '', captain: false })
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [playerSuccess, setPlayerSuccess] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePlayer, setInvitePlayer] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    supabase.from('players').select('*').eq('active', true).order('last_name').then(({ data }) => setPlayers(data || []))
  }, [])

  const handleValueChange = (v) => {
    setValue(v)
    if (!v) { setPreview(null); return }
    const num = parseFloat(v)
    if (testType === 'cooper' && num > 500) {
      const vo2 = calcVO2(num)
      const lv = vo2Level(vo2)
      setPreview({ label: 'VO2max estimé', val: `${vo2.toFixed(1)} ml/kg/min`, level: lv.l })
    } else if (testType === 'sprint' && num > 2) {
      const lv = sprintLevel(num)
      setPreview({ label: 'Résultat 30m Sprint', val: `${num.toFixed(2)} secondes`, level: lv.l })
    } else {
      setPreview(null)
    }
  }

  const handleSaveTest = async () => {
    if (!selectedPlayer || !value || !testDate) return
    setSaving(true)
    const { error } = await supabase.from('fitness_tests').insert({
      player_id: selectedPlayer,
      test_type: testType,
      test_date: testDate,
      value: parseFloat(value),
    })
    setSaving(false)
    if (!error) {
      setSuccess('Résultat enregistré!')
      setValue('')
      setPreview(null)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleAddPlayer = async () => {
    if (!newPlayer.first_name || !newPlayer.last_name) return
    setAddingPlayer(true)
    const { error } = await supabase.from('players').insert(newPlayer)
    setAddingPlayer(false)
    if (!error) {
      setPlayerSuccess('Joueur ajouté!')
      setNewPlayer({ first_name: '', last_name: '', born: '', group_name: '+40', position: '', job: '', captain: false })
      const { data } = await supabase.from('players').select('*').eq('active', true).order('last_name')
      setPlayers(data || [])
      setTimeout(() => setPlayerSuccess(''), 3000)
    }
  }

  const handleInvite = async () => {
    if (!invitePlayer || !inviteEmail) return
    setInviting(true)
    setInviteSuccess('')
    setInviteError('')
    // Step 1: Find player
    const p = players.find(x => x.id === invitePlayer)
    // Step 2: Generate SQL for admin to run in Supabase after sending invite manually
    const sql = `-- Après avoir envoyé l'invitation depuis Supabase Auth:\n-- 1. Récupère l'UUID de ${p?.first_name} ${p?.last_name} dans Authentication → Users\n-- 2. Exécute ce SQL en remplaçant USER_UUID:\nINSERT INTO user_roles (user_id, role, player_id)\nVALUES ('USER_UUID', 'player', '${invitePlayer}');\nUPDATE players SET user_id = 'USER_UUID' WHERE id = '${invitePlayer}';`
    setInviteSuccess(`Envoie l'invitation depuis Supabase → Authentication → Users → Invite User avec l'email: ${inviteEmail}\n\nEnsuite exécute ce SQL:\n${sql}`)
    setInviting(false)
  }

  const filteredPlayers = players
    .filter(p => p.group_name === filterGroup)
    .filter(p => {
      if (!playerSearch) return true
      const q = playerSearch.toLowerCase()
      return p.first_name.toLowerCase().startsWith(q) || p.last_name.toLowerCase().startsWith(q)
    })

  return (
    <div className="content">

      {/* SAISIR UN TEST */}
      <div className="card">
        <div className="card-title">📊 Saisir un résultat de test</div>
        <div className="form-group">
          <label className="form-label">Groupe</label>
          <div className="group-tabs" style={{marginBottom:10}}>
            {['+30','+40','+50'].map(g => (
              <div key={g} className={`group-tab${g === filterGroup ? ' active' : ''}`}
                onClick={() => { setFilterGroup(g); setSelectedPlayer(''); setPlayerSearch('') }}>{g}</div>
            ))}
          </div>
          <label className="form-label">Joueur</label>
          <div style={{position:'relative'}}>
            <input
              className="form-input"
              type="text"
              placeholder="Taper le prénom pour filtrer..."
              value={playerSearch || (selectedPlayer ? (filteredPlayers.find(p=>p.id===selectedPlayer)||{first_name:'',last_name:''}).first_name + ' ' + (filteredPlayers.find(p=>p.id===selectedPlayer)||{first_name:'',last_name:''}).last_name : '')}
              onChange={e => { setPlayerSearch(e.target.value); setSelectedPlayer('') }}
              onFocus={e => { if(selectedPlayer) setPlayerSearch('') }}
              autoComplete="off"
            />
            {playerSearch && filteredPlayers.length > 0 && (
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:'white',border:'1.5px solid var(--gray-3)',borderRadius:8,zIndex:50,maxHeight:200,overflowY:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                {filteredPlayers.map(p => (
                  <div key={p.id}
                    style={{padding:'9px 12px',cursor:'pointer',fontSize:13,borderBottom:'0.5px solid var(--gray-2)'}}
                    onMouseDown={() => { setSelectedPlayer(p.id); setPlayerSearch('') }}>
                    {p.first_name} {p.last_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Type de test</label>
          <select className="form-input" value={testType} onChange={e => { setTestType(e.target.value); setValue(''); setPreview(null) }}>
            <option value="cooper">Cooper (12 min)</option>
            <option value="sprint">30m Sprint</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={testDate} onChange={e => setTestDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{testType === 'cooper' ? 'Distance parcourue (mètres)' : 'Temps (secondes)'}</label>
          <input className="form-input" type="number" step={testType === 'sprint' ? '0.01' : '1'} placeholder={testType === 'cooper' ? 'ex: 2650' : 'ex: 4.35'} value={value} onChange={e => handleValueChange(e.target.value)} />
        </div>
        {preview && (
          <div className="result-preview">
            <p style={{ fontSize: 12, color: 'var(--gray-5)' }}>{preview.label}</p>
            <div className="val">{preview.val}</div>
            <p style={{ fontSize: 12, color: 'var(--gray-4)' }}>{preview.level}</p>
          </div>
        )}
        {success && <div className="success-msg" style={{ marginTop: 8 }}>{success}</div>}
        <button className="btn-red" style={{ marginTop: 14 }} onClick={handleSaveTest} disabled={saving || !selectedPlayer || !value}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* AJOUTER UN JOUEUR */}
      <div className="card">
        <div className="card-title">➕ Ajouter un joueur</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="form-label">Prénom</label>
            <input className="form-input" value={newPlayer.first_name} onChange={e => setNewPlayer({ ...newPlayer, first_name: e.target.value })} placeholder="Prénom" />
          </div>
          <div>
            <label className="form-label">Nom</label>
            <input className="form-input" value={newPlayer.last_name} onChange={e => setNewPlayer({ ...newPlayer, last_name: e.target.value })} placeholder="Nom" />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 10 }}>
          <label className="form-label">Date de naissance</label>
          <input className="form-input" type="date" value={newPlayer.born} onChange={e => setNewPlayer({ ...newPlayer, born: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="form-label">Groupe</label>
            <select className="form-input" value={newPlayer.group_name} onChange={e => setNewPlayer({ ...newPlayer, group_name: e.target.value })}>
              {GROUPS.map(g => <option key={g} value={g}>Seniors {g}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Poste</label>
            <input className="form-input" value={newPlayer.position} onChange={e => setNewPlayer({ ...newPlayer, position: e.target.value })} placeholder="Milieu, Défenseur..." />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 10 }}>
          <label className="form-label">Profession</label>
          <input className="form-input" value={newPlayer.job} onChange={e => setNewPlayer({ ...newPlayer, job: e.target.value })} placeholder="Mécanicien, Médecin..." />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input type="checkbox" id="captain" checked={newPlayer.captain} onChange={e => setNewPlayer({ ...newPlayer, captain: e.target.checked })} />
          <label htmlFor="captain" style={{ fontSize: 13 }}>Capitaine</label>
        </div>
        {playerSuccess && <div className="success-msg">{playerSuccess}</div>}
        <button className="btn-red" onClick={handleAddPlayer} disabled={addingPlayer || !newPlayer.first_name || !newPlayer.last_name}>
          {addingPlayer ? 'Ajout...' : 'Ajouter le joueur'}
        </button>
      </div>

      {/* INVITER UN JOUEUR */}
      <div className="card">
        <div className="card-title">✉️ Inviter un joueur</div>
        <p style={{fontSize: 13, color: 'var(--gray-4)', marginBottom: 14}}>
          Sélectionne le joueur et entre son email. Il recevra une invitation et sera automatiquement lié à son profil.
        </p>
        <div className="form-group">
          <label className="form-label">Joueur</label>
          <select className="form-input" value={invitePlayer} onChange={e => setInvitePlayer(e.target.value)}>
            <option value="">Sélectionner un joueur</option>
            {players.filter(p => !p.user_id).map(p => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.group_name})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="joueur@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
        </div>
        {inviteSuccess && <pre style={{fontSize: 11, background: 'var(--gray-1)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', marginBottom: 10, color: 'var(--gray-5)'}}>{inviteSuccess}</pre>}
        {inviteError && <div className="error-msg">{inviteError}</div>}
        <button className="btn-red" onClick={handleInvite} disabled={inviting || !invitePlayer || !inviteEmail}>
          {inviting ? 'Envoi...' : "Envoyer l'invitation"}
        </button>
      </div>

    </div>
  )
}
