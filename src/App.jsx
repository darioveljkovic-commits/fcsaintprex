import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Joueurs from './pages/Joueurs'
import Fitness from './pages/Fitness'
import Anniversaires from './pages/Anniversaires'
import Admin from './pages/Admin'
import Postes from './pages/Postes'
import Consent from './pages/Consent'
import Privacy from './pages/Privacy'
import './App.css'

const LOGO = 'https://fcsaintprex.ch/wp-content/uploads/2021/09/cropped-logo_fc_saint_prex.jpg'



function AvatarImg({ player, displayName }) {
  const [photoUrl, setPhotoUrl] = React.useState(player?.photo_url ? player.photo_url.split('?')[0] : null)
  const [state, setState] = React.useState('init')

  React.useEffect(() => {
    if (player?.photo_url) { setPhotoUrl(player.photo_url.split('?')[0]); return }
    if (!player?.id) return
    let active = true
    supabase.from('players').select('photo_url').eq('id', player.id).single()
      .then(({ data }) => { if (active && data?.photo_url) setPhotoUrl(data.photo_url.split('?')[0]) })
    return () => { active = false }
  }, [player?.id, player?.photo_url])

  const initials = player
    ? `${player.first_name?.[0] ?? ''}${player.last_name?.[0] ?? ''}`.toUpperCase()
    : 'FC'

  // DEBUG: temporaeres Overlay, zeigt Laufzeitzustand
  const dbg = `P:${player ? 'y' : 'n'} U:${photoUrl ? photoUrl.slice(-18) : 'null'} L:${state}`

  return (
    <>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
        position: 'relative', background: 'rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ position: 'absolute', color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>{initials}</span>
        {photoUrl && (
          <img
            src={photoUrl}
            alt={displayName}
            onLoad={() => setState('onLoad')}
            onError={() => setState('onError')}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: state === 'onLoad' ? 1 : 0
            }}
          />
        )}
      </div>
      <div style={{
        position: 'absolute', top: 44, right: 0, zIndex: 999,
        background: 'black', color: 'lime', fontSize: 10, padding: '2px 6px',
        borderRadius: 4, whiteSpace: 'nowrap', fontFamily: 'monospace'
      }}>{dbg}</div>
    </>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('joueurs')
  const [loading, setLoading] = useState(true)
  const [showChangePw, setShowChangePw] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [activeGroup, setActiveGroup] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserData(session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setShowChangePw(true)
        setLoading(false)
        return
      }
      if (session) loadUserData(session.user)
      else { setCurrentPlayer(null); setIsAdmin(false); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (user) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*, players(*)')
      .eq('user_id', user.id)
      .single()
    if (roleData) {
      setIsAdmin(roleData.role === 'admin')
      const player = roleData.players || null
      setCurrentPlayer(player)
      if (player && activeGroup === null) setActiveGroup(player.group_name || 'all')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setCurrentPlayer(null)
    setIsAdmin(false)
  }

  const handleChangePw = async (e) => {
    e.preventDefault()
    if (newPw.length < 8) { setPwMsg('Minimum 8 caractères'); return }
    if (!/\d/.test(newPw)) { setPwMsg('Le mot de passe doit contenir au moins un chiffre'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) {
      setPwMsg('Erreur: ' + error.message)
    } else {
      // Mark pw as changed in DB and state
      if (currentPlayer?.id) {
        await supabase.from('players').update({ pw_changed: true }).eq('id', currentPlayer.id)
        setCurrentPlayer(prev => prev ? {...prev, pw_changed: true} : prev)
      }
      setPwMsg('Mot de passe mis à jour!')
      setNewPw('')
      setTimeout(() => { setPwMsg(''); setShowChangePw(false) }, 1500)
    }
  }

  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}>Chargement...</div>
  if (!session) return <Login />

  // Step 1: Force PW change on first login
  if (currentPlayer && currentPlayer.pw_changed === false) {
    return (
      <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#8b0f12,#c0161a)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{background:'white',borderRadius:18,padding:'28px 24px',width:360,maxWidth:'100%',boxShadow:'0 24px 64px rgba(0,0,0,0.4)'}}>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:32,marginBottom:8}}>🔒</div>
            <h2 style={{fontSize:18,fontWeight:700,color:'var(--red)',marginBottom:6}}>Choisissez votre mot de passe</h2>
            <p style={{fontSize:13,color:'var(--gray-4)',lineHeight:1.5}}>Pour sécuriser ton compte, tu dois définir ton propre mot de passe avant de continuer.</p>
          </div>
          <form onSubmit={handleChangePw}>
            <label className="form-label">Nouveau mot de passe</label>
            <input className="form-input" type="password" placeholder="Min. 8 caractères dont 1 chiffre" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" required style={{marginBottom:12}} />
            {pwMsg && <p style={{fontSize:13,color:pwMsg.includes('jour')?'var(--green)':'var(--red)',marginBottom:8}}>{pwMsg}</p>}
            <button className="btn-primary" type="submit" disabled={pwLoading}>
              {pwLoading ? 'Enregistrement...' : 'Confirmer et continuer'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Step 2: Show consent screen if player hasn't accepted yet
  if (currentPlayer && currentPlayer.consent_given === false) {
    return <Consent currentPlayer={currentPlayer} onAccept={() => {
      setCurrentPlayer(prev => ({...prev, consent_given: true}))
    }} />
  }



  const displayName = currentPlayer
    ? `${currentPlayer.first_name} ${currentPlayer.last_name}`
    : 'FC St-Prex Seniors'

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <img src={LOGO} alt="logo" onError={e => e.target.style.display='none'} />
          <h2>FC St-Prex Seniors</h2>
        </div>
        <div className="topbar-right" style={{position:'relative'}}>
          {/* Profile avatar button */}
          <button
            onClick={() => setShowProfileMenu(v => !v)}
            style={{
              background:'none',border:'2.5px solid rgba(255,255,255,0.6)',
              borderRadius:'50%',padding:0,cursor:'pointer',
              width:38,height:38,boxSizing:'border-box',overflow:'hidden',flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center'
            }}
            title={displayName}
          >
            <AvatarImg player={currentPlayer} displayName={displayName} />
          </button>

          {/* Dropdown menu */}
          {showProfileMenu && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                style={{position:'fixed',inset:0,zIndex:198}}
                onClick={() => setShowProfileMenu(false)}
              />
              <div style={{
                position:'absolute',top:46,right:0,
                background:'white',borderRadius:12,
                boxShadow:'0 8px 32px rgba(0,0,0,0.22)',
                minWidth:200,zIndex:199,overflow:'hidden'
              }}>
                {/* User info header */}
                <div style={{
                  padding:'14px 16px 10px',
                  borderBottom:'1px solid #f0f0f0'
                }}>
                  <div style={{fontWeight:700,fontSize:14,color:'var(--red)',lineHeight:1.2}}>
                    {displayName}
                  </div>
                  {isAdmin && (
                    <div style={{fontSize:11,color:'#999',marginTop:2}}>Admin</div>
                  )}
                </div>

                {/* Change PW */}
                <button
                  onClick={() => { setShowProfileMenu(false); setShowChangePw(true) }}
                  style={{
                    width:'100%',background:'none',border:'none',
                    textAlign:'left',padding:'12px 16px',
                    fontSize:13,color:'#333',cursor:'pointer',
                    display:'flex',alignItems:'center',gap:10
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <span style={{fontSize:16}}>🔒</span> Changer mon mot de passe
                </button>

                {/* Divider */}
                <div style={{height:1,background:'#f0f0f0'}} />

                {/* Logout */}
                <button
                  onClick={() => { setShowProfileMenu(false); handleLogout() }}
                  style={{
                    width:'100%',background:'none',border:'none',
                    textAlign:'left',padding:'12px 16px',
                    fontSize:13,color:'var(--red)',cursor:'pointer',
                    display:'flex',alignItems:'center',gap:10
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#fdecea'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <span style={{fontSize:16}}>🚪</span> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>


      <div className="nav-tabs">
        <div className={`nav-tab${activeTab === 'joueurs' ? ' active' : ''}`} onClick={() => setActiveTab('joueurs')}>
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAACVElEQVR4nJWTS0hUURzGv/85984dR5wZNR1HXDgq4cZnWFAUElZuglYtgzbSpseiDCqIBBdlEFQQtGzZpkWbti0iexBJLkLwEURl6jg6zni95/Fv4aNs7gSd3YH/j/Od7/99NNXehNBDBK0BwHHAHDoiypGslKhPibp6VgpE/wMLwWv5yqPHY/0DvJaHCB9zwmFmcl2npY2NhuOWkx0KE7SmRDLa2c3GiHgcxoQqD9MjiIPAzbR6mVavpc1pznCwEao8DCZirSKdPU4i6VTXeB3d5TwrgYkAoohX0dtHQgghovv2k+uCqJTfDQsBY2wuK9ONXkcnmMEc7eiWqbRdXobWf4n/4yIlFwoy1VAxMKhnZ/zJT5uv+ZMT+sts7NigbEhzoQApf6vcSpgQXCyK6uq6sYfRrp75S+fU7HTTsxew9uupE+7e9tS9R/7H9wuXz9tcjmIxWLsNE3EQyFRD3Z378UNHAASrK9+HzlQcPMxG+29epx8/icQTAFZfvVwYvmh+/iA3Amaaam8CMxy35sp1pzlDxrJWsa5e9rz54QsAUmMPyPeLEx/IdSGkmpvOjo1CaxDthISX747yxgaktCu52pHb0b4D7PsAB3Mz62/HszevikQSxpDn7fzZ2VqP1gxASghBkQgXi0sjN+Jnh6D14q1rlf0D5EY2rWaltje6Y9iuVQtIAUbj0+ew5tvpk5AOjC5NeFi22cKwXcuvvxtno20+L6qqQrtRplVCQCk19RnGwOjN8JROhcneckGJ2j1g2OxiuVaW7TMc1y4tgfCPPv8CRCn+3MDSDHUAAAAASUVORK5CYII=" style={{width:16,height:16,objectFit:'contain',marginRight:5,verticalAlign:-2}} alt="" />Joueurs
        </div>
        <div className={`nav-tab${activeTab === 'postes' ? ' active' : ''}`} onClick={() => setActiveTab('postes')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:5,verticalAlign:-2}}>
            <rect x="2" y="3" width="20" height="18" rx="1"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="8" y1="3" x2="8" y2="21"/>
            <line x1="16" y1="3" x2="16" y2="21"/>
          </svg>Postes
        </div>
        <div className={`nav-tab${activeTab === 'fitness' ? ' active' : ''}`} onClick={() => setActiveTab('fitness')}>
          <span className="nav-icon">📈</span> Fitness
        </div>
        <div className={`nav-tab${activeTab === 'anniversaires' ? ' active' : ''}`} onClick={() => setActiveTab('anniversaires')}>
          <span className="nav-icon">🎂</span> Anniversaires
        </div>
        {isAdmin && <div className={`nav-tab${activeTab === 'admin' ? ' active' : ''}`} onClick={() => setActiveTab('admin')}>
          <span className="nav-icon">⚙️</span> Admin
        </div>}
      </div>

      {activeTab === 'joueurs' && <Joueurs currentPlayer={currentPlayer} isAdmin={isAdmin} activeGroup={activeGroup} setActiveGroup={setActiveGroup} onPlayerUpdate={setCurrentPlayer} />}
      {activeTab === 'fitness' && <Fitness currentPlayer={currentPlayer} isAdmin={isAdmin} activeGroup={activeGroup} setActiveGroup={setActiveGroup} />}
      {activeTab === 'anniversaires' && <Anniversaires activeGroup={activeGroup} setActiveGroup={setActiveGroup} />}
      {activeTab === 'postes' && <Postes currentPlayer={currentPlayer} isAdmin={isAdmin} activeGroup={activeGroup} setActiveGroup={setActiveGroup} />}
      {activeTab === 'admin' && isAdmin && <Admin />}
      <div style={{textAlign:'center',padding:'12px 0 4px',fontSize:11,color:'rgba(255,255,255,0.0)'}}>
        <span style={{color:'var(--gray-4)',cursor:'pointer'}} onClick={() => setShowPrivacy(true)}>
          Politique de confidentialité
        </span>
      </div>

      {showPrivacy && <Privacy onClose={() => setShowPrivacy(false)} />}

      {showChangePw && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:14,padding:'28px 24px',width:320,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--red)',marginBottom:16,textAlign:'center'}}>Changer mon mot de passe</h3>
            <form onSubmit={handleChangePw}>
              <label className="form-label">Nouveau mot de passe</label>
              <input className="form-input" type="password" placeholder="Min. 8 caractères dont 1 chiffre" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" required style={{marginBottom:12}} />
              {pwMsg && <p style={{fontSize:13,color:pwMsg.includes('jour')?'var(--green)':'var(--red)',marginBottom:8}}>{pwMsg}</p>}
              <button className="btn-primary" type="submit" disabled={pwLoading} style={{marginBottom:8}}>
                {pwLoading ? 'Enregistrement...' : 'Confirmer'}
              </button>
              <button type="button" onClick={() => {setShowChangePw(false);setNewPw('');setPwMsg('')}}
                style={{width:'100%',background:'none',border:'1.5px solid var(--gray-3)',color:'var(--gray-5)',padding:'10px',borderRadius:8,fontSize:14,cursor:'pointer'}}>
                Annuler
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
