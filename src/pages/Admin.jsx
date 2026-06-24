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
  const [newPlayer, setNewPlayer] = useState({ first_name: '', last_name: '', born: '', group_name: '+40', position: '', preferred_position: '', job: '', tel: '', city: '', status: 'actif', captain: false })
  const [positions, setPositions] = useState([])
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [playerSuccess, setPlayerSuccess] = useState('')
  const [invitePlayer, setInvitePlayer] = useState('')
  const [inviteUuid, setInviteUuid] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    supabase.from('players').select('*').neq('status', 'sorti').order('last_name').then(({ data }) => setPlayers(data || []))
    supabase.from('positions').select('*').order('name').then(({ data }) => setPositions(data || []))
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
    } else {
      setSuccess('Erreur: ' + error.message)
      setTimeout(() => setSuccess(''), 4000)
    }
  }

  const handleAddPlayer = async () => {
    if (!newPlayer.first_name || !newPlayer.last_name) return
    setAddingPlayer(true)
    const { error } = await supabase.from('players').insert(newPlayer)
    setAddingPlayer(false)
    if (!error) {
      setPlayerSuccess('Joueur ajouté!')
      setNewPlayer({ first_name: '', last_name: '', born: '', group_name: '+40', position: '', preferred_position: '', job: '', tel: '', city: '', status: 'actif', captain: false })
      const { data } = await supabase.from('players').select('*').neq('status', 'sorti').order('last_name')
      setPlayers(data || [])
      setTimeout(() => setPlayerSuccess(''), 3000)
    } else {
      setPlayerSuccess('Erreur: ' + error.message)
      setTimeout(() => setPlayerSuccess(''), 4000)
    }
  }

  const handleInvite = async () => {
    if (!invitePlayer || !inviteUuid.trim()) return
    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess('')

    const uuid = inviteUuid.trim()

    // 1. user_roles eintragen
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: uuid, role: 'player', player_id: invitePlayer }, { onConflict: 'user_id' })

    if (roleError) {
      setInviteError('Erreur user_roles: ' + roleError.message)
      setInviteLoading(false)
      return
    }

    // 2. player aktualisieren
    const { error: playerError } = await supabase
      .from('players')
      .update({ user_id: uuid, pw_changed: false, consent_given: false })
      .eq('id', invitePlayer)

    setInviteLoading(false)
    if (playerError) {
      setInviteError('Erreur player update: ' + playerError.message)
    } else {
      const p = players.find(x => x.id === invitePlayer)
      setInviteSuccess(`✅ ${p?.first_name} ${p?.last_name} est lié à l'UUID. Il peut maintenant se connecter.`)
      setInviteUuid('')
      setInvitePlayer('')
      // Spielerliste neu laden
      const { data } = await supabase.from('players').select('*').neq('status', 'sorti').order('last_name')
      setPlayers(data || [])
      setTimeout(() => setInviteSuccess(''), 5000)
    }
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
          <input className="form-input" type="date" value={testDate} onChange={e => setTestDate(e.target.value)} style={{maxWidth:160}} />
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
            <select className="form-input" value={newPlayer.position} onChange={e => setNewPlayer({ ...newPlayer, position: e.target.value })}>
              <option value="">— Sélectionner —</option>
              {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div>
            <label className="form-label">Préférence poste</label>
            <select className="form-input" value={newPlayer.preferred_position} onChange={e => setNewPlayer({ ...newPlayer, preferred_position: e.target.value })}>
              <option value="">— Préférence —</option>
              {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Statut</label>
            <select className="form-input" value={newPlayer.status} onChange={e => setNewPlayer({ ...newPlayer, status: e.target.value })}>
              <option value="actif">Actif</option>
              <option value="pause">En pause</option>
              <option value="sorti">Sorti du club</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 10 }}>
          <label className="form-label">Profession</label>
          <input className="form-input" value={newPlayer.job} onChange={e => setNewPlayer({ ...newPlayer, job: e.target.value })} placeholder="Mécanicien, Médecin..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div>
            <label className="form-label">Téléphone</label>
            <input className="form-input" value={newPlayer.tel} onChange={e => setNewPlayer({ ...newPlayer, tel: e.target.value })} placeholder="+41 79 000 00 00" />
          </div>
          <div>
            <label className="form-label">Ville</label>
            <input className="form-input" value={newPlayer.city} onChange={e => setNewPlayer({ ...newPlayer, city: e.target.value })} placeholder="Saint-Prex, Morges..." />
          </div>
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
        <div className="card-title">✉️ Lier un joueur à un compte</div>
        <p style={{fontSize:13,color:'var(--gray-4)',marginBottom:14,lineHeight:1.6}}>
          1. Crée le compte dans Supabase → Authentication → Users → Add user<br/>
          2. Copie l'UUID du nouvel utilisateur<br/>
          3. Sélectionne le joueur et colle l'UUID ci-dessous
        </p>
        <div className="form-group">
          <label className="form-label">Joueur à lier</label>
          <select className="form-input" value={invitePlayer} onChange={e => setInvitePlayer(e.target.value)}>
            <option value="">Sélectionner un joueur</option>
            {players.filter(p => !p.user_id).map(p => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.group_name})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">UUID Supabase</label>
          <input className="form-input" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={inviteUuid} onChange={e => setInviteUuid(e.target.value)} />
        </div>
        <button className="btn-red" onClick={handleInvite} disabled={inviteLoading || !invitePlayer || !inviteUuid.trim()}>
          {inviteLoading ? 'Liaison en cours...' : 'Lier le joueur'}
        </button>
        {inviteSuccess && <div className="success-msg" style={{marginTop:8}}>{inviteSuccess}</div>}
        {inviteError && <div className="error-msg" style={{marginTop:8}}>{inviteError}</div>}
      </div>    </div>
  )
}
