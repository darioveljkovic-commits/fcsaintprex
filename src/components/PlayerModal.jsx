import { useState, useEffect } from 'react'
import { supabase, calcVO2, vo2Level, sprintLevel, getAge } from '../lib/supabase'

export default function PlayerModal({ player, tests, isOwn, isAdmin, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    job: player.job || '',
    tel: player.tel || '',
    passions: player.passions || '',
    preferred_position: player.preferred_position || '',
    position: player.position || '',
    active: player.active !== false,
    group_name: player.group_name || '+40',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const initials = `${player.first_name?.[0] || ''}${player.last_name?.[0] || ''}`.toUpperCase()
  const fullName = `${player.first_name} ${player.last_name}`

  const cooperTests = tests.filter(t => t.test_type === 'cooper').sort((a, b) => a.test_date.localeCompare(b.test_date))
  const sprintTests = tests.filter(t => t.test_type === 'sprint').sort((a, b) => a.test_date.localeCompare(b.test_date))

  const handleChangePw = async () => {
    if (newPw.length < 6) { setPwMsg('Minimum 6 caractères'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) {
      setPwMsg('Erreur: ' + error.message)
    } else {
      setPwMsg('Mot de passe mis à jour!')
      setNewPw('')
      setTimeout(() => setPwMsg(''), 3000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const updateData = {
      job: form.job || null,
      tel: form.tel || null,
      passions: form.passions || null,
      preferred_position: form.preferred_position || null,
      active: form.active,
      group_name: form.group_name,
    }
    if (isAdmin) updateData.position = form.position || null
    const { error } = await supabase.from('players').update(updateData).eq('id', player.id)
    setSaving(false)
    if (!error) {
      setSuccess('Profil mis à jour!')
      setEditing(false)
      onUpdate()
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${player.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('player-photos').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
      await supabase.from('players').update({ photo_url: data.publicUrl }).eq('id', player.id)
      onUpdate()
    }
    setUploading(false)
  }

  const renderMiniChart = (testList, isCooper) => {
    if (!testList.length) return null
    const vals = testList.map(t => isCooper ? calcVO2(t.value) : t.value)
    const maxVal = isCooper ? Math.max(...vals) : Math.min(...vals)
    return (
      <div className="mini-chart">
        {testList.map((t, i) => {
          const v = vals[i]
          const h = isCooper ? Math.round((v / maxVal) * 55) : Math.round((maxVal / v) * 55)
          return (
            <div className="mini-bar-wrap" key={t.id}>
              <div className="mini-bar-val">{isCooper ? v.toFixed(0) : v.toFixed(2)}</div>
              <div className="mini-bar" style={{ height: `${h}px`, opacity: isCooper ? 0.85 : 0.75 }} />
              <div className="mini-bar-label">{t.test_date.slice(0, 7)}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const lastCooper = cooperTests[cooperTests.length - 1]
  const lastSprint = sprintTests[sprintTests.length - 1]

  const modal = (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isOwn ? 'Mon profil' : 'Profil joueur'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="profile-header">
            {player.photo_url
              ? <img src={player.photo_url} className="profile-photo-lg" alt={fullName} style={{cursor:'pointer'}} onClick={() => setLightbox(true)} />
              : <div className="profile-avatar-lg">{initials}</div>
            }
            <div className="profile-info">
              <h4>{fullName}{player.captain && <span className="captain-tag">Capitaine</span>}</h4>
              <p>Seniors {player.group_name}</p>
            </div>
          </div>

          <div className="info-row"><span className="info-label">Poste</span><span className="info-value">{player.position || '—'}</span></div>
          <div className="info-row"><span className="info-label">Préférence poste</span><span className="info-value">{player.preferred_position || '—'}</span></div>
          <div className="info-row"><span className="info-label">Profession</span><span className="info-value">{player.job || '—'}</span></div>
          <div className="info-row"><span className="info-label">Passions</span><span className="info-value">{player.passions || '—'}</span></div>
          <div className="info-row"><span className="info-label">Téléphone</span>
            <span className="info-value">
              {player.tel ? <a href={`tel:${player.tel}`} style={{ color: 'var(--red)', fontWeight: 600 }}>{player.tel}</a> : '—'}
            </span>
          </div>
          <div className="info-row"><span className="info-label">Né le</span><span className="info-value">{player.born || '—'}</span></div>
          <div className="info-row"><span className="info-label">Âge</span><span className="info-value">{getAge(player.born)} ans</span></div>

          {/* FITNESS */}
          {tests.length > 0 ? (
            <>
              {cooperTests.length > 0 && (
                <>
                  <div className="section-title">🏃 Cooper — VO2max</div>
                  {renderMiniChart(cooperTests, true)}
                  {lastCooper && (() => {
                    const lv = vo2Level(calcVO2(lastCooper.value))
                    return <span className={`pill pill-${lv.c}`}>VO2max: {calcVO2(lastCooper.value).toFixed(1)} — {lv.l}</span>
                  })()}
                </>
              )}
              {sprintTests.length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: 14 }}>⚡ 30m Sprint</div>
                  {renderMiniChart(sprintTests, false)}
                  {lastSprint && (() => {
                    const lv = sprintLevel(lastSprint.value)
                    return <span className={`pill pill-${lv.c}`}>Dernier: {lastSprint.value.toFixed(2)}s — {lv.l}</span>
                  })()}
                </>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--gray-4)', fontSize: 13, marginTop: 12 }}>Aucun test enregistré.</p>
          )}

          {/* EDIT SECTION - own profile only */}
          {(isOwn || isAdmin) && (
            <div className="edit-section">
              <button
                className="btn-red"
                style={{width:'100%',marginBottom:12,background:editing?'var(--gray-5)':'var(--red)'}}
                onClick={() => setEditing(!editing)}
              >
                {editing ? '✕ Fermer la modification' : '✏️ Modifier le profil'}
              </button>
              {editing && <div>
              <div className="card-title" style={{ marginBottom: 10 }}>✏️ Modifier le profil</div>

              {(isOwn || isAdmin) && (
                <>
                  <label className="form-label">Photo</label>
                  <label className="photo-upload-label">
                    {uploading ? 'Upload...' : '📷 Choisir une photo'}
                    <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  </label>
                  <div className="photo-hint">Photo enregistrée dans le cloud</div>
                </>
              )}

              <label className="form-label">Profession</label>
              <input className="edit-field" value={form.job} onChange={e => setForm({ ...form, job: e.target.value })} placeholder="Votre profession" />

              <label className="form-label">Téléphone</label>
              <input className="edit-field" value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} placeholder="+41 79 000 00 00" />

              <label className="form-label">Passions / Hobbies</label>
              <input className="edit-field" value={form.passions} onChange={e => setForm({ ...form, passions: e.target.value })} placeholder="Tennis, cuisine, voyages..." />

              {isAdmin && <>
                <label className="form-label">Poste (attribué par le coach)</label>
                <input className="edit-field" value={form.position || ''} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="Gardien, Libéro, Milieu..." />
              </>}

              <label className="form-label">Préférence de poste sur le terrain</label>
              <input className="edit-field" value={form.preferred_position} onChange={e => setForm({ ...form, preferred_position: e.target.value })} placeholder="Milieu défensif, ailier droit..." />

              <label className="form-label">Catégorie d'âge</label>
              <select className="edit-field" value={form.group_name} onChange={e => setForm({ ...form, group_name: e.target.value })}>
                <option value="+30">Seniors +30</option>
                <option value="+40">Seniors +40</option>
                <option value="+50">Seniors +50</option>
              </select>

              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <input type="checkbox" id="active-check" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} />
                <label htmlFor="active-check" style={{fontSize:13,cursor:'pointer'}}>Joueur actif</label>
              </div>

              {success && <div className="success-msg">{success}</div>}
              <button className="btn-red" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>

              {isOwn && <div style={{marginTop:20,paddingTop:16,borderTop:'1.5px solid var(--gray-2)'}}>
                <div className="card-title" style={{marginBottom:10,fontSize:13}}>🔒 Changer mon mot de passe</div>
                <input
                  className="edit-field"
                  type="password"
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
                {pwMsg && <div style={{fontSize:12,marginBottom:8,color:pwMsg.includes('jour')?'var(--green)':'var(--red)'}}>{pwMsg}</div>}
                <button className="btn-red" onClick={handleChangePw} disabled={pwLoading || newPw.length < 6} style={{background:'var(--gray-5)'}}>
                  {pwLoading ? 'Enregistrement...' : 'Confirmer le nouveau mot de passe'}
                </button>
              </div>}
              </div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {modal}
      {lightbox && player.photo_url && (
        <div onClick={() => setLightbox(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <img src={player.photo_url} alt={fullName} style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:12,objectFit:'contain'}} />
          <div style={{position:'absolute',top:16,right:16,color:'white',fontSize:28,cursor:'pointer'}}>×</div>
        </div>
      )}
    </>
  )
}