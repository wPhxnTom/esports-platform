# Esports Arena

Plateforme esports compétitive inspirée de Gamby, dédiée aux jeux vidéo.

## Stack Technique

- **Backend**: Node.js + Express 5 + Prisma ORM + SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React Native + Expo (mobile & web)
- **Auth**: JWT (JSON Web Tokens)
- **Realtime**: Socket.io (notifications, live match updates)

## Structure du Projet

```
esports-platform/
├── backend/
│   ├── prisma/schema.prisma      # Modèle de données
│   ├── src/
│   │   ├── config/               # Configuration (env, constants)
│   │   ├── controllers/          # Handlers des routes
│   │   ├── middleware/           # Auth, validation, erreurs
│   │   ├── routes/               # Définition des endpoints
│   │   ├── services/             # Logique métier
│   │   ├── index.ts              # Point d'entrée serveur
│   │   └── seed.ts               # Données initiales
│   └── .env
├── mobile/
│   ├── app/                      # Expo Router (file-based routing)
│   │   ├── (tabs)/               # Navigation par onglets
│   │   ├── match/[id].tsx        # Détail d'un match
│   │   └── ...
│   ├── src/
│   │   ├── api/client.ts         # Client Axios avec intercepteurs
│   │   ├── context/AuthContext.tsx# Contexte d'authentification
│   │   ├── screens/              # Écrans de l'application
│   │   └── utils/theme.ts        # Thème sombre global
│   └── app.json
└── shared/
    └── types.ts                  # Types TypeScript partagés
```

## MVP - Fonctionnalités Implémentées

### Authentification
- Inscription (pseudo, email, password)
- Connexion (email, password)
- JWT stocké dans SecureStore
- Routes protégées côté backend

### Profils Utilisateurs
- Pseudo, avatar, email
- XP, rang (BRONZE → GRANDMASTER)
- Coins virtuels
- Statistiques (victoires, défaites, matchs)

### Modes de Jeu
| Mode | Description | Joueurs |
|------|------------|---------|
| Killrace | Premier au kill target | 2-8 |
| Resurgence | Respawn activé, score basé kills + placement | 4-40 |
| Battle Royale | Last standing wins, high risk/reward | 10-100 |

### Matchs
- Création de match dans un mode choisi
- Rejoindre un match en attente
- Démarrage par le créateur
- Soumission des scores (kills, deaths, score, position)
- Détection automatique de fin (tous les scores soumis)
- Attribution des points et XP en fin de match

### Classement
- Classement global (XP total)
- Classement par mode de jeu
- Calcul du win rate

### Badges
8 badges débloquables automatiquement :
- First Win, Warrior (10W), Veteran (50W), Legend (100W)
- Rising Star (1000XP), Elite (10000XP)
- Dedicated (50 matchs), Addicted (200 matchs)

### Notifications
- Notification de victoire/défaite
- Notification de badge débloqué
- Marquer comme lu / tout marquer comme lu

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion |
| GET | /api/auth/me | Profil connecté |
| GET | /api/profile | Voir son profil |
| PUT | /api/profile | Modifier son profil |
| GET | /api/matches | Matchs disponibles |
| POST | /api/matches | Créer un match |
| GET | /api/matches/history | Historique |
| GET | /api/matches/:id | Détail d'un match |
| POST | /api/matches/:id/join | Rejoindre |
| POST | /api/matches/:id/start | Démarrer |
| POST | /api/matches/:id/score | Soumettre score |
| GET | /api/leaderboard/global | Classement global |
| GET | /api/leaderboard/:gameMode | Classement par mode |
| GET | /api/notifications | Notifications |
| PUT | /api/notifications/:id/read | Marquer lue |
| PUT | /api/notifications/read-all | Tout marquer lu |
| GET | /api/badges | Badges du joueur |

## Démarrer le Projet

### Backend
```bash
cd backend
npm install
npm run db:push    # Crée la BDD SQLite
npm run db:seed    # Ajoute les données initiales
npm run dev        # Lance le serveur sur http://localhost:3000
```

### Mobile
```bash
cd mobile
npm install --legacy-peer-deps
npx expo start     # Lance Expo (scan QR code ou ouvrir dans le navigateur)
```

### Web
```bash
cd mobile
npx expo start --web
```

## Prochaines Étapes (Post-MVP)

- [ ] Système d'amis et challenges
- [ ] Tournois programmés
- [ ] Chat en temps réel dans les matchs
- [ ] Avatars personnalisables
- [ ] Animations et transitions
- [ ] Push notifications
- [ ] Mode hors-ligne
- [ ] Paiements / conversion coins (phase 2)
- [ ] Support multi-langue (FR/EN)
- [ ] Tests unitaires et E2E
- [ ] CI/CD avec GitHub Actions
- [ ] Déploiement Docker / VPS
