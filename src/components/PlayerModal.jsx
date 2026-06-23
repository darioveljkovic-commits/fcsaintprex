import { useState, useEffect } from 'react'
import { supabase, calcVO2, vo2Level, sprintLevel, getAge, displayFirst, displayName as dnFn } from '../lib/supabase'

// Single Source of Truth: alle editierbaren Profilfelder.
// default: Fallback im Formular. adminOnly: nur Admins duerfen speichern.
// Aenderungen hier wirken automatisch auf form-init, sync und Speicherung.
const PROFILE_FIELDS = [
  { key: 'nickname', default: '' },
  { key: 'job', default: '' },
  { key: 'tel', default: '' },
  { key: 'passions', default: '' },
  { key: 'preferred_position', default: '' },
  { key: 'position', default: '', adminOnly: true },
  { key: 'city', default: '' },
  { key: 'status', default: 'actif' },
  { key: 'group_name', default: '+40' },
  { key: 'born', default: '' },
]

const buildForm = (player) =>
  PROFILE_FIELDS.reduce((acc, f) => {
    acc[f.key] = player[f.key] ?? f.default
    return acc
  }, {})

export default function PlayerModal({ player, tests, isOwn, isAdmin, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => buildForm(player))

  // Sync form when player prop updates after save
  useEffect(() => {
    setForm(buildForm(player))
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

  const initials = `${displayFirst(player)[0] || ''}${player.last_name?.[0] || ''}`.toUpperCase()
  const fullName = dnFn(player)




  const handleSave = async () => {
    setSaving(true)
    // updateData aus PROFILE_FIELDS ableiten. Pflichtfelder (status, group_name)
    // behalten ihren Wert; optionale Felder werden bei Leer auf null gesetzt.
    const REQUIRED = ['status', 'group_name']
    const updateData = PROFILE_FIELDS.reduce((acc, f) => {
      if (f.adminOnly && !isAdmin) return acc
      const val = form[f.key]
      acc[f.key] = REQUIRED.includes(f.key) ? val : (val || null)
      return acc
    }, {})
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
              <h4>
                {displayFirst(player)}{' '}{player.last_name}
                {player.captain && <span className="captain-tag">Capitaine</span>}
              </h4>
              {player.nickname && (
                <div style={{fontSize:11,color:'#999',marginTop:1}}>{player.first_name} {player.last_name}</div>
              )}
              <p>Seniors {player.group_name}</p>
            </div>
          </div>

          {(isOwn || isAdmin) && (
            <button
              className="btn-red"
              style={{width:'100%',marginBottom:14,background:editing?'var(--gray-5)':'var(--red)'}}
              onClick={() => { if (editing) { setForm(buildForm(player)) } setEditing(!editing) }}
            >
              {editing ? '✕ Annuler' : '✏️ Modifier le profil'}
            </button>
          )}

          {editing && (isOwn || isAdmin) && (
            <>
              <label className="form-label">Photo</label>
              <label className="photo-upload-label">
                {uploading ? 'Upload...' : '📷 Choisir une photo'}
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
              <div className="photo-hint">Photo enregistrée dans le cloud</div>
              <label className="form-label" style={{marginTop:8}}>Surnom</label>
              <input className="edit-field" value={form.nickname || ''} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder={player.first_name} />
              <div style={{fontSize:10,color:'#999',marginTop:2}}>Laisser vide si identique au prénom</div>
            </>
          )}

          {/* Surnom: Anzeige nur wenn gesetzt und nicht im Edit-Modus */}
          {!editing && player.nickname && (
            <div className="info-row">
              <span className="info-label">Surnom</span>
              <span className="info-value">{player.nickname}</span>
            </div>
          )}

          {/* Poste: Anzeige immer, Edit nur Admin */}
          <div className="info-row">
            <span className="info-label">Poste</span>
            {editing && isAdmin
              ? <select className="edit-field" style={{margin:0,maxWidth:200}} value={form.position || ''} onChange={e => setForm({ ...form, position: e.target.value })}>
                  <option value="">— Sélectionner —</option>
                  {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              : <span className="info-value">{player.position || '—'}</span>
            }
          </div>

          {/* Préférence poste: Anzeige immer, Edit fuer Spieler+Admin */}
          <div className="info-row">
            <span className="info-label">Préférence poste</span>
            {editing
              ? <select className="edit-field" style={{margin:0,maxWidth:200}} value={form.preferred_position || ''} onChange={e => setForm({ ...form, preferred_position: e.target.value })}>
                  <option value="">— Préférence —</option>
                  {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              : <span className="info-value">{player.preferred_position || '—'}</span>
            }
          </div>

          <div className="info-row">
            <span className="info-label">Profession</span>
            {editing
              ? <input className="edit-field" style={{margin:0,maxWidth:200}} value={form.job} onChange={e => setForm({ ...form, job: e.target.value })} placeholder="Votre profession" />
              : <span className="info-value">{player.job || '—'}</span>
            }
          </div>

          <div className="info-row">
            <span className="info-label">Passions</span>
            {editing
              ? <input className="edit-field" style={{margin:0,maxWidth:200}} value={form.passions} onChange={e => setForm({ ...form, passions: e.target.value })} placeholder="Tennis, cuisine..." />
              : <span className="info-value">{player.passions || '—'}</span>
            }
          </div>

          <div className="info-row">
            <span className="info-label">Téléphone</span>
            {editing
              ? <input className="edit-field" style={{margin:0,maxWidth:200}} value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} placeholder="+41 79 000 00 00" />
              : <span className="info-value">{player.tel ? <a href={`tel:${player.tel}`} style={{ color: 'var(--red)', fontWeight: 600 }}>{player.tel}</a> : '—'}</span>
            }
          </div>

          <div className="info-row">
            <span className="info-label">Né le</span>
            {editing
              ? <input className="edit-field" type="date" style={{margin:0,maxWidth:200}} value={form.born || ''} onChange={e => setForm({ ...form, born: e.target.value })} />
              : <span className="info-value">{player.born ? player.born.split('-').reverse().join('.') : '—'}</span>
            }
          </div>

          {!editing && (
            <div className="info-row"><span className="info-label">Âge</span><span className="info-value">{getAge(player.born)} ans</span></div>
          )}

          <div className="info-row">
            <span className="info-label">Ville</span>
            {editing
              ? <input className="edit-field" style={{margin:0,maxWidth:200}} value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Saint-Prex, Morges..." />
              : <span className="info-value">{player.city || '—'}</span>
            }
          </div>

          {/* Admin-only Felder: nur im Edit-Modus und nur fuer Admin */}
          {editing && isAdmin && (
            <div style={{background:'#fdecea',borderRadius:8,padding:'10px 12px',margin:'12px 0',border:'1px solid #f5c6c6'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--red)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>⚙️ Admin uniquement</div>
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
            </div>
          )}

          {editing && (
            <>
              {success && <div className="success-msg">{success}</div>}
              <button className="btn-red" style={{width:'100%',marginTop:8}} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </>
          )}
          {!editing && success && <div className="success-msg">{success}</div>}
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