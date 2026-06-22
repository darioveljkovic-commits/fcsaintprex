import { useState, useEffect } from 'react'
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
    const { data: roleData } = await supabase.from('user_roles').select('*, players(*)').eq('user_id', user.id).single()
    if (roleData) {
      setIsAdmin(roleData.role === 'admin')
      setCurrentPlayer(roleData.players || null)
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
    if (newPw.length < 6) { setPwMsg('Minimum 6 caractères'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) {
      setPwMsg('Erreur: ' + error.message)
    } else {
      setPwMsg('Mot de passe mis à jour!')
      setTimeout(() => { setShowChangePw(false); setNewPw(''); setPwMsg('') }, 1500)
    }
  }

  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}>Chargement...</div>
  if (!session) return <Login />

  // Show consent screen if player hasn't accepted yet
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
        <div className="topbar-right">
          <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button style={{background:'rgba(255,255,255,0.15)',border:'none',color:'white',padding:'5px 10px',borderRadius:6,fontSize:12,cursor:'pointer'}}
            onClick={() => setShowChangePw(true)}>
            🔒 PW
          </button>
          <button style={{background:'none',border:'1.5px solid rgba(255,255,255,0.4)',color:'white',padding:'5px 10px',borderRadius:6,fontSize:12,cursor:'pointer'}}
            onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
    
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

      {activeTab === 'joueurs' && <Joueurs currentPlayer={currentPlayer} isAdmin={isAdmin} />}
      {activeTab === 'fitness' && <Fitness currentPlayer={currentPlayer} isAdmin={isAdmin} />}
      {activeTab === 'anniversaires' && <Anniversaires />}
      {activeTab === 'postes' && <Postes currentPlayer={currentPlayer} isAdmin={isAdmin} />}
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
              <input className="form-input" type="password" placeholder="Minimum 6 caractères" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" required style={{marginBottom:12}} />
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
