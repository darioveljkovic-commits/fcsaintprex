# FC St-Prex Seniors App — Kontext für neuen Chat

## Projekt-Übersicht
React Web-App für FC Amical Saint-Prex Seniors (+30, +40, +50).
Entwickelt von Dario Veljkovic (Admin/Coach/Captain +40).

## Tech Stack
- Frontend: React (create-react-app)
- Backend/DB: Supabase (PostgreSQL + Auth + Storage)
- Hosting: Vercel
- URL: https://fcstprexseniors.vercel.app
- GitHub: https://github.com/darioveljkovic-commits/fcsaintprex
- Supabase: https://lymeedgkdurumfdpmitl.supabase.co
- Supabase anon key: sb_publishable_hWhfN_9K1OIR5ZqgLFi7jQ_F8SmhiLL

## Dario (Hauptbenutzer)
- UUID: 82783051-4356-44ea-aae9-8278f39a787a
- Rolle: Admin + Captain +40
- Email: via Supabase Auth

## Supabase DB Schema
### Tabellen
- players: id, first_name, last_name, born (DATE), group_name (+30/+40/+50), 
  position, preferred_position, job, tel, photo_url, captain (bool), 
  active (bool), user_id, passions, team_role, city, status (actif/pause/sorti),
  consent_given (bool), consent_date, pw_changed (bool)
- fitness_tests: id, player_id, test_type (cooper/sprint), test_date, value, notes, recorded_by
- user_roles: id, user_id, role (admin/player), player_id
- positions: id, name, sort_order (9 standard positions)
- Storage bucket: player-photos (public)

### team_role Werte
- coach: Gildas Genty (UUID: 39121970-5950-4735-a0d1-d97dbb5badeb)
- assistant_coach: Paul Nelson
- captain: Dario Veljkovic
- vice_captain: Andreas Günther

### Positionen (positions Tabelle)
1. Gardien, 2. Défenseur central, 3. Latéral droit, 4. Latéral gauche,
5. Milieu défensif, 6. Milieu offensif, 7. Ailier droit, 8. Ailier gauche, 9. Attaquant

### Status-Logik
- actif: erscheint überall
- pause: erscheint in Joueurs (grau), nicht in Postes/Fitness-Ranking
- sorti: erscheint nirgends (auch nicht Anniversaires)

## App-Struktur
```
src/
  App.jsx          — Shell, Auth, Navigation, PW-Modal, Consent-Flow
  App.css          — Styles (rot #c0161a als Hauptfarbe)
  lib/supabase.js  — Supabase Client + Utilities
  pages/
    Login.jsx      — Email/PW Login + Hintergrundbild
    Joueurs.jsx    — Spielerliste, Teamfoto Banner, Suche mit Scope-Toggle
    Postes.jsx     — Fussballfeld interaktiv, Poste/Préférence Toggle
    Fitness.jsx    — Cooper + Sprint Ranglisten, klickbare Namen
    Anniversaires.jsx — Geburtstage mit Profilfotos, Gruppenfilter
    Admin.jsx      — Fitness erfassen, Spieler hinzufügen, SQL-Generator für User-Invite
    Privacy.jsx    — Datenschutzerklärung Modal
    Consent.jsx    — Einwilligungsscreen beim ersten Login
  components/
    PlayerModal.jsx — Spielerprofil, Edit-Toggle, Admin-Felder, Foto-Upload mit Komprimierung
```

## App-Flow (Login)
1. Login mit Email + PW
2. Falls pw_changed = false: forcierter PW-Wechsel Screen
3. Falls consent_given = false: Consent Screen
4. App

## User-Erstellungsprozess
1. Admin öffnet Admin-Tab → "Inviter un joueur" → Email + Spieler wählen → SQL generieren
2. Supabase → Authentication → "Add user" → Email + temporäres PW
3. UUID des neuen Users kopieren → SQL ausführen (COLLER_UUID_ICI ersetzen)
4. Spieler per WhatsApp: URL + Email + temp PW
5. Spieler loggt ein → PW-Wechsel erzwungen → Consent → App

## Verknüpfte User (player_id → user_id)
- Dario Veljkovic: 82783051-4356-44ea-aae9-8278f39a787a (Admin)
- Gildas Genty: 39121970-5950-4735-a0d1-d97dbb5badeb (Admin)
- Bruno De Barros Pinto: e96a8ba3-48f4-4063-a990-9b2566c0972f
- Erkan Kaplan: 4419e3c8-864f-4e7c-840a-c48da782b6ff
- Julien Favre: 7b4ec783-8512-491f-a939-300d461ee0d2

## Navigation Tabs (Reihenfolge)
1. Joueurs (FC St-Prex Logo)
2. Postes (Fussballfeld SVG Icon)
3. Fitness (📈)
4. Anniversaires (🎂)
5. Admin (⚙️) — nur für Admins

## Spieler +40 (bekannte Daten)
De Oliveira Teixeira Bruno (Gardien), Mancuso Grégoire, Rosa Dos Santos Filipe,
Dos Santos Fidalgo Carlos, Degen Steve, De Barros Pinto Bruno, Vasquez Sébastian,
Kaplan Erkan, De Oliveira Martins Luis, Veljkovic Dario (Captain), Günther Andreas (Vice-Cap),
Gerber Roger, Silva Cédric, Ferreira Dos Santos Diniz, Geiser Raphaël, Nelson Paul (Co-Coach),
Genty Gildas (Coach), Morel Vincent, Civel Pierre, Marchionno Julien, Delbarre Julien,
Jules Jean Paul Tejie, Dufey Marc, Trachsel Alexandre, Cretton Paul Mihail,
Jaquier Christophe, Mourtis Sébastian, Gomes Miguel Sousa Filipe, Parente Raymond

## Foto-Storage
Bucket: player-photos
URL Format: https://lymeedgkdurumfdpmitl.supabase.co/storage/v1/object/public/player-photos/NAME.jpg
Dateien: veljkovic_dario.jpg, genty_gildas.jpg, kaplan_erkan.jpg (eigenes Foto), 
civel_pierre.jpg, geiser_raphael.jpg, etc.
Komprimierung: 1200px / 80% beim Upload in der App

## Datenschutz / DSGVO
- Consent-Screen beim ersten Login dokumentiert Einwilligung
- Datenschutzerklärung (Privacy.jsx) erreichbar in der App
- Konform mit DSGVO und Schweizer DSG (rev. Sept. 2023)
- Hosting: Supabase EU (Irland) + Vercel
- Supabase AVV muss noch unterzeichnet werden (Settings → Legal → DPA)

## Parkplatz (zukünftige Ideen)
1. Actualités Register: Kacheln (Match, Event, Video, Info) mit Kalender-Download ICS
2. Spielerevaluation: Spinnennetz-Darstellung (nur Admin-Feedback)
3. Spielanalyse via Video (Veo-Integration)
4. KI: Matchbericht-Generator, Geburtstags-Nachrichten, Taktik-Generator

## Bekannte offene Punkte
- Supabase AVV noch nicht unterzeichnet
- +30 und +50 Spieler noch nicht vollständig erfasst (Provisoriendaten)
- Teamfotos für +30 und +50 sind eingebaut (schwarze/rote Trikots)
- Fotos von Spieler Pedro, Marchionno, Delbarre, Jules noch aus altem PDF

## Stil-Vorgaben
- Sprache: Schweizer Hochdeutsch für Antworten
- Antwortformat: 5 Optionen mit Konfidenz wenn mehrere Wege möglich
- Direkt, skeptisch, kein Schönreden
- SAP/BW4 Senior-Kontext im Hintergrund
- Französisch für App-Texte und WhatsApp-Nachrichten an Spieler

## CSS Hauptfarben
--red: #c0161a
--red-dark: #8b0f12  
--red-light: #fdecea
Coach-Badge: CP rot #c0161a
Co-Coach-Badge: CA hellrot #e05555
Captain: C gold #FFD700
Vice-Captain: C grau #aaa
