import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Joueurs from './pages/Joueurs'
import Fitness from './pages/Fitness'
import Anniversaires from './pages/Anniversaires'
import Admin from './pages/Admin'
import Postes from './pages/Postes'
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

  if (showChangePw) return (
    <div className="login-screen" style={{background:'linear-gradient(160deg,#8b0f12,#c0161a)'}}>
      <div style={{background:'white',borderRadius:18,padding:'32px 28px',width:320,maxWidth:'90vw',boxShadow:'0 24px 64px rgba(0,0,0,0.4)',textAlign:'center'}}>
        <h1 style={{fontSize:17,fontWeight:800,color:'var(--red)',marginBottom:6}}>FC St-Prex Seniors</h1>
        <p style={{fontSize:13,color:'var(--gray-4)',marginBottom:22}}>Choisissez votre nouveau mot de passe</p>
        <form onSubmit={handleChangePw}>
          <label className="form-label" style={{textAlign:'left',display:'block'}}>Nouveau mot de passe</label>
          <input className="form-input" type="password" placeholder="Minimum 6 caractères" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" required />
          {pwMsg && <p style={{fontSize:13,color:pwMsg.includes('jour') ? 'var(--green)' : 'var(--red)',marginBottom:8}}>{pwMsg}</p>}
          <button className="btn-primary" type="submit" disabled={pwLoading} style={{marginTop:8}}>
            {pwLoading ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </form>
      </div>
    </div>
  )

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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:5,verticalAlign:-2}}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a10 10 0 0 1 6.56 2.45L12 12 5.44 4.45A10 10 0 0 1 12 2z" fill="currentColor" opacity=".3"/>
            <path d="m12 12 6.56 7.55A10 10 0 0 1 5.44 19.55L12 12z" fill="currentColor" opacity=".3"/>
          </svg>Joueurs
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
    </>
  )
}
