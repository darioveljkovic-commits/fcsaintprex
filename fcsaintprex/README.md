# FC Saint-Prex App

Application de gestion d'équipe pour les Seniors du FC Saint-Prex.

## Setup

### 1. Supabase
- Créer un projet sur supabase.com
- Exécuter le script `supabase_setup.sql` dans le SQL Editor
- Copier l'URL et la clé anon dans `src/lib/supabase.js`

### 2. Ajouter des utilisateurs
Dans Supabase → Authentication → Users → Invite User:
- Créer un compte pour chaque joueur
- Dans la table `user_roles`, lier chaque user_id à son player_id et son rôle

### 3. Déploiement Vercel
```bash
npm install
npm run build
```
Ou connecter le repo GitHub à Vercel pour déploiement automatique.

## Structure
- `src/pages/Login.jsx` — Page de connexion
- `src/pages/Joueurs.jsx` — Liste des joueurs
- `src/pages/Fitness.jsx` — Tests fitness et classements
- `src/pages/Anniversaires.jsx` — Anniversaires de l'équipe
- `src/pages/Admin.jsx` — Panel admin (Coach uniquement)
- `src/components/PlayerModal.jsx` — Modal profil joueur
- `src/lib/supabase.js` — Configuration Supabase + utilitaires
