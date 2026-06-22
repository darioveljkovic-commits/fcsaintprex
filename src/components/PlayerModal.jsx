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
    city: player.city || '',
    status: player.status || 'actif',
    group_name: player.group_name || '+40',
  })

  // Sync form when player prop updates after save
  useEffect(() => {
    setForm({
      job: player.job || '',
      tel: player.tel || '',
      passions: player.passions || '',
      preferred_position: player.preferred_position || '',
      position: player.position || '',
      status: player.status || 'actif',
      group_name: player.group_name || '+40',
    })
  }, [player])
  const [positions, setPositions] = useState([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    supabase.from('positions').select('*').order('sort_order').then(({ data }) => setPositions(data || []))
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const initials = `${player.first_name?.[0] || ''}${player.last_name?.[0] || ''}`.toUpperCase()
  const fullName = `${player.first_name} ${player.last_name}`




  const handleSave = async () => {
    setSaving(true)
    const updateData = {
      job: form.job || null,
      tel: form.tel || null,
      passions: form.passions || null,
      preferred_position: form.preferred_position || null,
      city: form.city || null,
      status: form.status,
      group_name: form.group_name,
    }
    if (isAdmin) updateData.position = form.position || null
    const { error } = await supabase.from('players').update(updateData).eq('id', player.id)
    setSaving(false)
    if (!error) {
      setSuccess('Profil mis à jour!')
      setEditing(false)
      onUpdate()
      // Update local form state to reflect saved values
      setForm(f => ({...f}))
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      // Compress image before upload
      const compressed = await compressImage(file, 1200, 0.8)
      const path = `${player.id}.jpg`
      const { error: upErr } = await supabase.storage.from('player-photos').upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
      if (!upErr) {
        const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
        await supabase.from('players').update({ photo_url: data.publicUrl + '?t=' + Date.now() }).eq('id', player.id)
        onUpdate()
      }
    } catch(err) {
      console.error('Upload error:', err)
    }
    setUploading(false)
  }

  const compressImage = (file, maxWidth, quality) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let w = img.width, h = img.height
          if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth }
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
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
          <div className="info-row"><span className="info-label">Né le</span><span className="info-value">
            {player.born ? player.born.split('-').reverse().join('.') : '—'}
          </span></div>
          <div className="info-row"><span className="info-label">Âge</span><span className="info-value">{getAge(player.born)} ans</span></div>
          <div className="info-row"><span className="info-label">Ville</span><span className="info-value">{player.city || '—'}</span></div>



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
              <label className="form-label">Ville</label>
              <input className="edit-field" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Saint-Prex, Morges..." />

              <div style={{background:'var(--gray-1)',borderRadius:8,padding:'10px 12px',marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--gray-4)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Mes informations</div>
                <label className="form-label">Préférence de poste</label>
                <select className="edit-field" value={form.preferred_position || ''} onChange={e => setForm({ ...form, preferred_position: e.target.value })}>
                  <option value="">— Sélectionner une préférence —</option>
                  {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              {isAdmin && <div style={{background:'#fdecea',borderRadius:8,padding:'10px 12px',marginBottom:12,border:'1px solid #f5c6c6'}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--red)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>⚙️ Admin uniquement</div>
                <label className="form-label">Poste (attribué par le coach)</label>
                <select className="edit-field" value={form.position || ''} onChange={e => setForm({ ...form, position: e.target.value })}>
                  <option value="">— Sélectionner un poste —</option>
                  {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>

              {isAdmin && <>
                <label className="form-label">Catégorie d'âge</label>
                <select className="edit-field" value={form.group_name} onChange={e => setForm({ ...form, group_name: e.target.value })}>
                  <option value="+30">Seniors +30</option>
                  <option value="+40">Seniors +40</option>
                  <option value="+50">Seniors +50</option>
                </select>
                <label className="form-label">Statut</label>
                <select className="edit-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="actif">Actif — joue régulièrement</option>
                  <option value="pause">En pause — blessé ou pause temporaire</option>
                  <option value="sorti">Sorti du club</option>
                </select>
              </>}
              </div>}

              {success && <div className="success-msg">{success}</div>}
              <button className="btn-red" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>


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