import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Consent({ currentPlayer, onAccept }) {
  const [loading, setLoading] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    if (currentPlayer?.id) {
      await supabase.from('players').update({
        consent_given: true,
        consent_date: new Date().toISOString()
      }).eq('id', currentPlayer.id)
    }
    onAccept()
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#8b0f12,#c0161a)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'white',borderRadius:18,padding:'28px 24px',width:360,maxWidth:'100%',boxShadow:'0 24px 64px rgba(0,0,0,0.4)'}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:8}}>👋</div>
          <h2 style={{fontSize:18,fontWeight:700,color:'var(--red)',marginBottom:6}}>Bienvenue sur l'appli</h2>
          <p style={{fontSize:13,color:'var(--gray-4)'}}>FC St-Prex Seniors</p>
        </div>

        <p style={{fontSize:13,color:'var(--gray-5)',lineHeight:1.6,marginBottom:16}}>
          Avant de continuer, nous avons besoin de ton accord pour utiliser tes données personnelles (nom, photo, date de naissance, résultats fitness) dans le cadre de la gestion de l'équipe.
        </p>

        <div style={{background:'var(--gray-1)',borderRadius:8,padding:'10px 14px',marginBottom:20,fontSize:12,color:'var(--gray-4)',lineHeight:1.6}}>
          Tes données sont utilisées uniquement en interne par le FC Amical Saint-Prex, ne sont pas transmises à des tiers, et sont hébergées sur des serveurs situés en Europe (UE).
          <span style={{color:'var(--red)',cursor:'pointer',marginLeft:4,fontWeight:600}} onClick={() => setShowPrivacy(true)}>
            Lire la politique complète →
          </span>
        </div>

        <button
          onClick={handleAccept}
          disabled={loading}
          style={{width:'100%',background:'var(--red)',color:'white',border:'none',padding:'14px',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer',marginBottom:10}}
        >
          {loading ? 'Enregistrement...' : "J'accepte et je continue"}
        </button>

        <p style={{fontSize:11,color:'var(--gray-4)',textAlign:'center',lineHeight:1.5}}>
          En acceptant, tu confirmes avoir lu et compris la politique de confidentialité. Tu peux retirer ton accord à tout moment en contactant un administrateur.
        </p>
      </div>

      {showPrivacy && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:14,width:400,maxWidth:'100%',maxHeight:'80vh',overflow:'auto'}}>
            <div style={{background:'var(--red)',padding:'14px 18px',borderRadius:'14px 14px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'white',fontWeight:700,fontSize:15}}>Politique de confidentialité</span>
              <button onClick={() => setShowPrivacy(false)} style={{background:'none',border:'none',color:'white',fontSize:24,cursor:'pointer'}}>×</button>
            </div>
            <div style={{padding:20,fontSize:13,lineHeight:1.7,color:'var(--gray-5)'}}>
              <p style={{marginBottom:12}}><strong>FC Amical Saint-Prex — Seniors</strong></p>
              <p style={{marginBottom:8,fontWeight:600}}>Données collectées</p>
              <p style={{marginBottom:12}}>Nom, prénom, date de naissance, photo, téléphone, ville, poste, profession, passions et résultats fitness.</p>
              <p style={{marginBottom:8,fontWeight:600}}>Finalité</p>
              <p style={{marginBottom:12}}>Gestion interne des équipes Seniors uniquement. Aucune transmission à des tiers.</p>
              <p style={{marginBottom:8,fontWeight:600}}>Accès</p>
              <p style={{marginBottom:12}}>Chaque joueur voit son propre profil. Les membres voient les infos de base des autres. Les admins ont accès complet.</p>
              <p style={{marginBottom:8,fontWeight:600}}>Hébergement</p>
              <p style={{marginBottom:12}}>Supabase (serveurs UE, Irlande) et Vercel, tous deux conformes au RGPD et à la LPD révisée (Suisse, en vigueur depuis le 1er septembre 2023).</p>
              <p style={{marginBottom:8,fontWeight:600}}>Conservation</p>
              <p style={{marginBottom:12}}>Durée de l'affiliation. Suppression sur demande explicite.</p>
              <p style={{marginBottom:8,fontWeight:600}}>Vos droits</p>
              <p style={{marginBottom:12}}>Accès, rectification et suppression via les administrateurs de l'application.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
