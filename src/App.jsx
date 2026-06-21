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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserData(session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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

  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}>Chargement...</div>
  if (!session) return <Login />

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
          <span className="user-badge">{displayName}{isAdmin ? ' (Coach)' : ''}</span>
          <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>

      <div className="nav-tabs">
        <div className={`nav-tab${activeTab === 'joueurs' ? ' active' : ''}`} onClick={() => setActiveTab('joueurs')}>
          <span className="nav-icon">🔴</span> Joueurs
        </div>
        <div className={`nav-tab${activeTab === 'postes' ? ' active' : ''}`} onClick={() => setActiveTab('postes')}>
          <span className="nav-icon">🟩</span> Postes
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
