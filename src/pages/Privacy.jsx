export default function Privacy({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Politique de confidentialité</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{fontSize:13,lineHeight:1.7,color:'var(--gray-5)'}}>
          <p style={{marginBottom:12}}><strong>FC Amical Saint-Prex — Seniors</strong></p>

          <p style={{marginBottom:8,fontWeight:600}}>Données collectées</p>
          <p style={{marginBottom:12}}>Dans le cadre de la gestion de l'équipe, nous collectons les données suivantes : nom et prénom, date de naissance, photo de profil, numéro de téléphone, ville de résidence, poste sur le terrain, profession, passions, et résultats des tests fitness (Cooper, sprint 30m).</p>

          <p style={{marginBottom:8,fontWeight:600}}>Finalité</p>
          <p style={{marginBottom:12}}>Ces données sont utilisées exclusivement pour la gestion interne des équipes Seniors du FC Amical Saint-Prex. Elles ne sont pas transmises à des tiers.</p>

          <p style={{marginBottom:8,fontWeight:600}}>Accès aux données</p>
          <p style={{marginBottom:12}}>Chaque joueur accède uniquement à son propre profil complet. Les membres de l'équipe voient les informations de base des autres joueurs (nom, poste, photo). Les coachs et administrateurs ont accès à l'ensemble des données.</p>

          <p style={{marginBottom:8,fontWeight:600}}>Hébergement</p>
          <p style={{marginBottom:12}}>Les données sont hébergées sur Supabase (serveurs UE) et Vercel, deux plateformes conformes au RGPD.</p>

          <p style={{marginBottom:8,fontWeight:600}}>Durée de conservation</p>
          <p style={{marginBottom:12}}>Les données sont conservées pendant la durée de l'affiliation au club. En cas de départ, le statut est mis à jour. Sur demande explicite, les données peuvent être supprimées définitivement.</p>

          <p style={{marginBottom:8,fontWeight:600}}>Vos droits</p>
          <p style={{marginBottom:12}}>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour toute demande, contactez les administrateurs du club via l'application.</p>

          <p style={{marginBottom:8,fontWeight:600}}>Responsable du traitement</p>
          <p>FC Amical Saint-Prex — Équipes Seniors. Contact via les administrateurs du club enregistrés dans l'application.</p>
        </div>
      </div>
    </div>
  )
}
