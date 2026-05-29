# PROMPT FLUTTERFLOW — Phxntom Esports Platform

## Instructions Générales
- Langue : Français (toute l'interface)
- Thème : Dark mode intense (#050508 background, accents or/rouge/cyan)
- Police : Bold, aggressive, esport-style
- Toutes les API utilisent un token JWT (Bearer) stocké localement
- Base URL API : http://localhost:3000/api (ou https://ton-domaine.com/api en prod)
- Token obtenu via POST /auth/login ou POST /auth/register

---

## 1. ÉCRAN DE CONNEXION (Login Screen)

**État :** Non authentifié = route racine par défaut

**Éléments :**
- Logo "Phxntom" + tagline "Compete. Dominate. Rise."
- Champ Email
- Champ Password (secureTextEntry)
- Bouton "SE CONNECTER" (pleine largeur, couleur primaire)
- Lien "Pas de compte ? S'inscrire" → Register Screen
- Lien "Mot de passe oublié ?" → Forgot Password Screen
- Background : image bannière battle royale floutée + overlay sombre

**API :**
- POST /auth/login → body: { email, password } → response: { token, user }
- Envoyer token reçu vers POST /auth/me pour valider

---

## 2. ÉCRAN D'INSCRIPTION (Register Screen)

**Éléments :**
- Logo + tagline
- Champ Pseudo
- Champ Email
- Champ Password (min 6 caractères)
- Bouton "S'INSCRIRE"
- Lien "Déjà un compte ? Se connecter" → Login Screen
- Même background que login

**API :**
- POST /auth/register → body: { pseudo, email, password } → response: { token, user }

---

## 3. MOT DE PASSE OUBLIÉ (Forgot Password — 3 étapes)

### Étape 1 : Saisie email
- Champ Email
- Bouton "ENVOYER LE CODE"
- Lien "Retour" → Login Screen

**API :** POST /password-reset/forgot → body: { email } → response: { message, code }

### Étape 2 : Saisie code
- 6 champs individuels pour le code à 6 chiffres (auto-jump)
- Bouton "VÉRIFIER LE CODE"
- Lien "Renvoyer le code"

**API :** POST /password-reset/verify → body: { email, code } → response: { message, valid }

### Étape 3 : Nouveau mot de passe
- Champ Nouveau mot de passe
- Champ Confirmer mot de passe
- Bouton "RÉINITIALISER"
- Animation de succès → redirection vers Login Screen

**API :** POST /password-reset/reset → body: { email, code, password } → response: { message }

---

## 4. ONBOARDING (Première utilisation)

**Déclenché si :** `onboarding_done` n'existe pas en stockage local ET pas de user

**3 slides (swipe) :**
1. "Welcome to Phxntom" — "Compete in epic battles and climb the ranks to become a legend."
2. "Choose Your Mode" — "Killrace, Resurgence or Battle Royale. Each mode has its own rules and rewards."
3. "Earn & Progress" — "Win matches, earn XP and coins, unlock badges, and dominate the leaderboard."

**Boutons :** "Next" → slide suivant, "Skip" → fin, "Get Started" → fin (dernier slide)
**Dots :** indicateur de progression

**API :** Stockage local uniquement (AsyncStorage)

---

## 5. PAGE D'ACCUEIL (Home Screen / Tab 1)

**Header :**
- Logo "PHXNTOM" à gauche
- Pièces : icône 🪙 + montant (user.coins)
- Badge de file d'attente : si queue count > 0, afficher "X en file"

**Titre :** "Quick Match" avec mode selector
- 3 modes : KILLRACE (💀 - 5 coins), RESURGENCE (🔄 - 10 coins), BATTLE ROYALE (👑 - 25 coins)
- Sélecteur visuel (puces ou chip)

**Bouton "SEARCH MATCH" :**
- Si pas assez de coins : désactivé + texte rouge
- Appelle POST /ai/queue/join → { gameMode }
- Compteur de file : GET /ai/queue/count
- État : "Searching..." avec animation pulse

**Section "Ready to Compete" :**
- Affiche les matchs disponibles (GET /matches)
- Chaque carte : gameMode, joueurs, entryFee
- Tap → Match Detail Screen

**Section "Suggested Opponents" (IA) :**
- GET /ai/suggestions?limit=3
- Cartes horizontales : pseudo, rank, win rate
- Bouton "Challenge"

**API :**
- GET /matches
- POST /ai/queue/join
- GET /ai/queue/count
- GET /ai/suggestions?limit=X

---

## 6. ÉCRAN PROFIL (Profile Screen / Tab 2)

**Carte Profil :**
- Avatar (cliquable → changer photo)
- Pseudo
- Rank (BRONZE/SILVER/GOLD/PLATINUM/DIAMOND/MASTER)
- Barre XP + montant

**Statistiques (grille 3 colonnes) :**
- Wins 🏆
- Losses 💔
- Win Rate 📊 (%)
- Coins 🪙
- Matches 🎮
- Next Rank ⬆️

**Daily Caps :** XP restante / Coins restants (GET /anti-cheat/caps)

**Trust Score :** 🛡️ X/100 (GET /auth/me → trustScore)

**Comptes Liés (Platform Links) :**
- Liste des comptes (GET /accounts)
- Chaque ligne : icône plateforme + gamertag + bouton ✕ pour délien
- Bouton "+ Link Another Account" → LinkAccountModal
- LinkAccountModal : boutons PSN 🎮, XBOX 🟢, STEAM 🖥️, BATTLE.NET ⚔️, ACTIVISION ☠️
  - Si clé API configurée → OAuth redirect (GET /platform-auth/:platform/start?userId=X)
  - Sinon → fallback manuel (POST /accounts/link → { platform, gamertag })

**Badges (GET /badges) :**
- Grille 3 colonnes
- Badges débloqués vs totaux (X/8)

**Matchs Récents (GET /matches/history?limit=5) :**
- Cartes : mode + kills/deaths + WIN/LOSS
- Lien "View Full History" → History Screen

**Actions :**
- 🎁 Rewards - Gift Cards → Rewards Screen
- 📜 Legal - CGU & Privacy → Legal Screen
- ☀️/🌙 Light/Dark Mode toggle
- ❌ Sign Out → efface token → redirige vers Login Screen

---

## 7. ÉCRAN MATCHS (Matches Screen / Tab 3)

**Liste des matchs (GET /matches) :**
- Carte par match : mode, entryFee (badge coût), joueurs X/max, status, créateur
- Bouton "JOIN" (couleur selon mode)
- Si status IN_PROGRESS → "SPECTATE"

**Badge de coût par mode :**
- KILLRACE = 5 🪙
- RESURGENCE = 10 🪙
- BATTLE ROYALE = 25 🪙

**Bouton flottant "Create Match" → Create Match Screen**

---

## 8. CRÉER UN MATCH (Create Match Screen)

**Modal / écran dédié :**
- Sélecteur de mode (3 options avec description + coût)
- Slider/input maxPlayers (2-8)
- Récapitulatif : mode, entrée, prize pool estimé
- Bouton "CREATE MATCH" → POST /matches { gameMode, maxPlayers }

**Descriptions des modes :**
- KILLRACE (5 coins) : "First to reach the kill target wins. Fast-paced action."
- RESURGENCE (10 coins) : "Earn respawns through kills. Stay alive and dominate."
- BATTLE ROYALE (25 coins) : "Last one standing. High stakes, high rewards."

---

## 9. DÉTAIL MATCH (Match Detail Screen)

**Route :** /match/:id

**Header :** Nom du mode + entryFee

**Info :** status, créateur, joueurs inscrits, date de création

**Liste des participants :** pseudo + avatar + team (ALPHA/BRAVO si assigné)

**Actions selon status :**
- WAITING + je suis le créateur → "START MATCH" (POST /matches/:id/start)
- WAITING + pas encore rejoint → "JOIN MATCH" (POST /matches/:id/join)
- IN_PROGRESS + j'ai rejoint → soumettre score (POST /matches/:id/score)
- COMPLETED → voir résultats (GET /matches/:id/results)

**Soumettre Score (modal ou inline) :**
- Champs : kills, deaths, score, position
- Bouton "SUBMIT SCORE" → POST /matches/:id/score

**Anti-Cheat :**
- Confirmer résultat (POST /anti-cheat/matches/:id/confirm)
- Signaler un joueur → modal reason + description → POST /anti-cheat/report/player

---

## 10. FILE D'ATTENTE IA (Quick Match / Matchmaking)

**Écran de recherche :**
- Animation de recherche (pulse / spinner)
- Mode sélectionné
- Temps d'attente estimé
- Nombre de joueurs dans la file
- Bouton "CANCEL" → POST /ai/queue/leave

**Match trouvé :**
- Notifié via polling GET /ai/queue/status → inQueue: false + match créé
- Transition vers Match Detail Screen

**API :**
- POST /ai/queue/join → body: { gameMode }
- GET /ai/queue/status → { inQueue, queueEntry }
- POST /ai/queue/leave
- GET /ai/queue/count → { count }

---

## 11. HISTORIQUE (Match History Screen)

**Route :** /history

**Liste paginée :** GET /matches/history

**Chaque entrée :**
- Icône mode (KILLRACE ⚔️, RESURGENCE 🔄, BATTLE ROYALE 👑)
- Mode, kills, deaths, date
- WIN (vert) / LOSS (rouge)
- Position

**Swipe to refresh**

---

## 12. CLASSEMENT (Leaderboard — section dans Home ou Tab dédiée)

**Deux onglets :**
- Global (GET /leaderboard/global)
- Par mode (GET /leaderboard/:gameMode)

**Lignes du classement :**
- Rang (🥇🥈🥉 pour top 3)
- Pseudo
- Rank icon
- XP
- Wins
- Win Rate

---

## 13. RÉCOMPENSES (Rewards / Gift Cards Screen)

**Route :** /rewards

**Cartes cadeaux disponibles (GET /rewards/gift-cards) :**
- Nom, description, coût en coins, provider
- Bouton "REDEEM" → POST /rewards/redeem/:id

**Historique des échanges (GET /rewards/history) :**
- Date, carte, coins dépensés, status

---

## 14. ADMIN PANEL (Admin Screen)

**Route :** /admin
**Visibilité :** uniquement si user.isAdmin === true

**Matchs signalés (GET /anti-cheat/flagged) :**
- Liste des matchs flaggés
- Détails : joueurs, raison, statut
- Bouton "RESOLVE" → POST /anti-cheat/flagged/:id/resolve

---

## 15. LOADOUTS (section intégrée au Profil ou Tab dédiée)

**Liste (GET /loadouts) :**
- Mes loadouts (GET /loadouts/mine) : weaponName, category, attachments
- Tous les loadouts (GET /loadouts) avec filtre ?weaponName=, ?category=

**Créer (POST /loadouts) :**
- weaponName, category, attachments, description

**Review (POST /loadouts/:id/review) :**
- rating (1-5), comment

---

## 16. LÉGAL (CGU & Privacy Screen)

**Route :** /legal

**Sections :**
- Conditions Générales d'Utilisation
- Politique de Confidentialité
- Règles des tournois

Contenu statique ou chargé depuis une source distante.

---

## 17. NOTIFICATIONS

**Accessible depuis header ou tab :**

**Liste (GET /notifications) :**
- type, message, date, read status
- Swipe to refresh

**Actions :**
- Marquer comme lue (PUT /notifications/:id/read)
- Tout marquer comme lu (PUT /notifications/read-all)

---

## 18. COMPTES LIÉS — FLUX OAuth

**Implémentation :**
1. Ouvrir un WebView / navigateur externe vers :
   GET /api/platform-auth/:platform/start?userId={userId}
2. Backend redirige vers la plateforme (PSN, XBOX, STEAM, BATTLE_NET, ACTIVISION)
3. Callback → backend lie le compte → redirige vers l'app
4. Lister (GET /accounts), délien (DELETE /accounts/:id)

**Fallback si pas de clés API :**
POST /accounts/link → { platform, gamertag }

---

## 19. ANTI-CHEAT INTÉGRATIONS

**Match :**
- Soumettre preuve (POST /anti-cheat/proof) : matchId, proofUrl, notes
- Confirmer résultat (POST /anti-cheat/matches/:id/confirm)
- Signaler joueur (POST /anti-cheat/report/player)
- Signaler match suspect (POST /anti-cheat/report/match)
- Voir caps (GET /anti-cheat/caps)

---

## 20. AUTHENTIFICATION — GESTION DU TOKEN

**Store :**
- Login → POST /auth/login → { token, user } → stocker token localement
- Register → POST /auth/register → { token, user } → stocker token
- Chaque requête API : header Authorization: Bearer {token}
- Si 401 → effacer token → rediriger vers Login
- Logout : effacer token → Login Screen

---

## 21. DESIGN SYSTEM

**Couleurs :**
- Background: #050508
- Surface: #141419
- SurfaceLight: #1E1E26
- Primary: #FF6B35 (orange)
- Secondary: #A855F7 (violet)
- Error: #EF4444 (rouge)
- Success: #22C55E (vert)
- Gold: #F59E0B (or)
- Text: #FFFFFF
- TextSecondary: #9CA3AF
- TextMuted: #6B7280
- Border: rgba(255,255,255,0.1)

**Typographie :**
- Titres: 26px, weight 900, letterSpacing -0.5
- Sous-titres: 16px, weight 800
- Corps: 15px, weight 400
- Labels: 11px, weight 800, uppercase, letterSpacing 1.5
- Chiffres: weight 800

**Grades/Ranks (couleurs) :**
- BRONZE: #d97706
- SILVER: #9ca3af
- GOLD: #fbbf24
- PLATINUM: #14b8a6
- DIAMOND: #06b6d4
- MASTER: #a78bfa

**Espaces :**
- Padding standard: 16px
- Border radius: 12px (cartes), 14px (boutons), 8px (inputs)
- Gaps: 8-12px

**Animations :**
- Fade sur les transitions d'écran
- Scale sur les boutons pressés
- Pulse sur la recherche de match

---

## 22. API COMPLETE — RÉFÉRENCE RAPIDE

### Authentification (pas de token)
```
POST /auth/register      { pseudo, email, password }
POST /auth/login          { email, password }
```

### Mot de passe oublié (pas de token)
```
POST /password-reset/forgot   { email }
POST /password-reset/verify   { email, code }
POST /password-reset/reset    { email, code, password }
```

### Authentifié (header: Authorization Bearer {token})
```
GET  /auth/me
GET  /profile
PUT  /profile                   { pseudo?, avatar? }
GET  /matches
POST /matches                   { gameMode, maxPlayers? }
GET  /matches/history
GET  /matches/:id
POST /matches/:id/join
POST /matches/:id/start
POST /matches/:id/score         { score, kills, deaths, position }
GET  /matches/:id/results
GET  /leaderboard/global
GET  /leaderboard/:gameMode
GET  /notifications
PUT  /notifications/:id/read
PUT  /notifications/read-all
GET  /badges
GET  /accounts
POST /accounts/link             { platform, gamertag }
DELETE /accounts/:id
GET  /loadouts
GET  /loadouts/mine
GET  /loadouts/:id
POST /loadouts                  { weaponName, category, attachments, description? }
DELETE /loadouts/:id
POST /loadouts/:id/review       { rating, comment? }
GET  /rewards/gift-cards
POST /rewards/redeem/:id
GET  /rewards/history
POST /anti-cheat/proof          { matchId, proofUrl, notes? }
POST /anti-cheat/matches/:id/confirm
POST /anti-cheat/report/player  { targetId, reason, description?, matchId? }
POST /anti-cheat/report/match   { matchId, targetId, reason, description? }
GET  /anti-cheat/verification/:id
GET  /anti-cheat/caps
GET  /anti-cheat/flagged        (admin only)
POST /anti-cheat/flagged/:id/resolve (admin only)
```

### Matchmaking IA (authentifié)
```
POST /ai/queue/join     { gameMode? }
POST /ai/queue/leave
GET  /ai/queue/status
GET  /ai/queue/count
POST /ai/queue/process  { gameMode }
GET  /ai/suggestions    ?limit=5
```

### Statistiques (pas de token)
```
GET  /health
GET  /stats/online
GET  /stats/db
```

---

## 23. POINTS CLÉS À NE PAS OUBLIER

1. Les nouveaux utilisateurs commencent avec 100 coins
2. Entry fees : KILLRACE=5, RESURGENCE=10, BATTLE_ROYALE=25
3. Prize pool = entryFee × nombre de joueurs, distribué 60%/25%/15% top 3
4. Le matchmaking IA groupe par même rang, crée un match quand ≥2 joueurs, balance les équipes (ALPHA/BRAVO)
5. Le token JWT expire (par défaut 7 jours)
6. Les notifications arrivent via polling GET /notifications
7. Les comptes liés peuvent être liés par OAuth ou manuellement si pas de clés API
8. L'admin panel est accessible uniquement si isAdmin === true
9. Loadouts : weaponName, category, attachments (string JSON), avgRating
10. Les matchs ont des statuts : WAITING → IN_PROGRESS → COMPLETED
11. Onboarding ne s'affiche qu'une fois (flag local `onboarding_done`)
12. Thème dark/light stocké localement et persisté

---

## 24. STRUCTURE DES DONNÉES (modèles Prisma / API)

### User
```
id, pseudo, email, avatar?, xp, rank, coins, wins, losses, totalMatches,
trustScore, reportCount, dailyXp, dailyCoins, lastDailyReset, isAdmin, createdAt
```

### Match
```
id, gameMode (via GameModeConfig), entryFee (calculé), status, maxPlayers,
creator { id, pseudo, avatar }, players [ { userId, pseudo, avatar, team, score, kills, position } ],
winner?, createdAt, startedAt?, endedAt?
```

### PlatformLink
```
id, platform (PSN/XBOX/STEAM/BATTLE_NET/ACTIVISION), gamertag, platformId?, linkedAt
```

### QueueEntry
```
userId, pseudo, gameMode, rank, trustScore, status (WAITING/MATCHED)
```

### LeaderboardEntry
```
rank, userId, pseudo, avatar?, rankTitle, xp, wins, matchesPlayed, winRate
```

---

## CONFIGURATION FLUTTERFLOW

1. **API :** Importer `backend/api-spec.json` (OpenAPI 3.0) dans FlutterFlow
2. **Auth :** Créer un Custom Auth avec API Key header `Authorization: Bearer {token}`
3. **Stockage local :** token, onboarding_done, theme preference
4. **Navigation :** Stack avec tabs (Home, Matches, Profile) + modales (Create Match, Link Account, Score)
5. **Backend URL :** variable d'environnement (localhost:3000 en dev, domaine en prod)
