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
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePlayer, setInvitePlayer] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

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

  const handleInvite = () => {
    if (!invitePlayer || !inviteEmail) return
    const p = players.find(x => x.id === invitePlayer)
    const sql = `-- Joueur: ${p?.first_name} ${p?.last_name} — Email: ${inviteEmail}
--
-- ÉTAPES:
-- 1. Supabase → Authentication → Users → "Add user" → email: ${inviteEmail} + mot de passe temporaire
-- 2. Clique sur le nouvel utilisateur → copie son UUID
-- 3. Remplace COLLER_UUID_ICI par l'UUID copié
-- 4. Exécute ce SQL

INSERT INTO user_roles (user_id, role, player_id)
VALUES ('COLLER_UUID_ICI', 'player', '${invitePlayer}')
ON CONFLICT (user_id) DO UPDATE SET role = 'player', player_id = '${invitePlayer}';

UPDATE players SET 
  user_id = 'COLLER_UUID_ICI',
  pw_changed = false,
  consent_given = false
WHERE id = '${invitePlayer}';

-- Vérification
SELECT p.first_name, p.last_name, p.pw_changed, p.consent_given, ur.role
FROM players p
LEFT JOIN user_roles ur ON ur.player_id = p.id
WHERE p.id = '${invitePlayer}';`

    setInviteSuccess(sql)
    setInviteError('')
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
        <div className="card-title">✉️ Inviter un joueur</div>
        <p style={{fontSize:13,color:'var(--gray-4)',marginBottom:14,lineHeight:1.6}}>
          Procédure :<br/>
          1. Entre l'email du joueur et sélectionne son profil<br/>
          2. Copie le SQL généré et exécute-le dans Supabase<br/>
          3. Dans Supabase → Authentication → Users → "Invite User" avec la même email<br/>
          4. Envoie le lien Magic Link au joueur via WhatsApp
        </p>
        <div className="form-group">
          <label className="form-label">Email du joueur</label>
          <input className="form-input" type="email" placeholder="joueur@email.com"
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Joueur à lier</label>
          <select className="form-input" value={invitePlayer} onChange={e => setInvitePlayer(e.target.value)}>
            <option value="">Sélectionner un joueur</option>
            {players.filter(p => !p.user_id).map(p => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.group_name})</option>
            ))}
          </select>
        </div>
        <button className="btn-red" onClick={handleInvite} disabled={!invitePlayer || !inviteEmail}>
          Générer le SQL
        </button>
        {inviteSuccess && (
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--gray-5)',marginBottom:6}}>
              SQL à exécuter dans Supabase → SQL Editor :
            </div>
            <pre style={{fontSize:11,background:'var(--gray-1)',padding:12,borderRadius:8,
              whiteSpace:'pre-wrap',color:'var(--gray-5)',border:'1px solid var(--gray-3)',
              cursor:'pointer',userSelect:'all'}}
              onClick={e => {
                const range = document.createRange()
                range.selectNode(e.target)
                window.getSelection().removeAllRanges()
                window.getSelection().addRange(range)
              }}
              title="Cliquer pour sélectionner tout"
            >{inviteSuccess}</pre>
            <p style={{fontSize:11,color:'var(--gray-4)',marginTop:6}}>
              Clique sur le SQL pour tout sélectionner, puis copie-le.
            </p>
          </div>
        )}
        {inviteError && <div className="error-msg" style={{marginTop:8}}>{inviteError}</div>}
      </div>    </div>
  )
}
