# Esports Platform - Checkpoint

## State
- Backend: Running on http://localhost:3000 (Node.js + Express + Prisma + SQLite)
- Frontend: Compiles with 0 TypeScript errors (Expo web)

## Backend
- Location: `backend/`
- Start: `cd backend && node dist/index.js`
- Compile: `cd backend && npx tsc`
- DB: SQLite at `backend/dev.db`, Prisma schema at `backend/prisma/schema.prisma`
- Seed: `cd backend && npx tsx src/seed.ts`
- JWT secret: `dev-secret-key-change-in-prod`
- CORS: `*`

## Mobile
- Location: `mobile/`
- Dev: `cd mobile && npx expo start --web`
- TypeScript check: `cd mobile && npx tsc --noEmit`
- Port: 8082 (Expo web)

## Key Features Implemented
- Auth (register/login/JWT)
- Profile with stats, badges, rank, XP bar
- Platform account linking (PSN, Xbox, Steam, Battle.net)
- 3 game modes (KILLRACE, RESURGENCE, BATTLE_ROYALE)
- Match creation, joining, score submission
- Real-time Socket.io (match rooms, results)
- Leaderboard (global + per-mode)
- Notifications
- Anti-cheat: daily caps, farming detection, proof submission, match confirmation, reporting, flagging
- Admin panel: flagged match review (approve/void)
- Rewards: 6 gift cards, coin exchange, redemption history
- Legal pages: CGU, Privacy, Fair Play, Mentions Légales
- BO7 / Warzone Meta weapons tab (12 meta weapons, tier S/A/B, attachment builds)
- Dark/light theme toggle
- PWA config
- CoD-inspired UI (orange accent, dark military)
- Animated cards and modals
- Match results modal
- Stats endpoints: `/api/stats/online`, `/api/stats/db`

## API Routes
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Profile (auth)
- `PUT /api/profile` - Update profile
- `GET /api/accounts` - List linked platform accounts
- `POST /api/accounts/link` - Link a platform account
- `DELETE /api/accounts/:id` - Unlink a platform account
- `GET /api/matches` - List matches
- `POST /api/matches` - Create match
- `POST /api/matches/:id/join` - Join match
- `POST /api/matches/:id/score` - Submit score
- `GET /api/matches/:id` - Match detail
- `GET /api/matches/:id/results` - Match results
- `GET /api/matches/history` - Match history
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/:gameMode` - Per-mode leaderboard
- `GET /api/notifications` - Notifications
- `PUT /api/notifications/read-all` - Mark all read
- `PUT /api/notifications/:id/read` - Mark one read
- `GET /api/badges` - Badges
- `GET /api/anti-cheat/caps` - Daily caps
- `POST /api/anti-cheat/proof` - Submit proof
- `POST /api/anti-cheat/matches/:id/confirm` - Confirm result
- `POST /api/anti-cheat/report/player` - Report player
- `POST /api/anti-cheat/report/match` - Report match
- `GET /api/anti-cheat/flagged` - Flagged matches (admin)
- `POST /api/anti-cheat/flagged/:id/resolve` - Resolve flag (admin)
- `GET /api/stats/online` - Connected clients
- `GET /api/stats/db` - DB stats
- `GET /api/rewards/gift-cards` - List gift cards
- `POST /api/rewards/redeem/:id` - Redeem gift card
- `GET /api/rewards/history` - Redemption history

## Data Model
- `User` - Core player (pseudo, email, XP, coins, rank, trust score, daily caps, admin flag)
- `PlatformLink` - Linked gaming accounts (platform: PSN|XBOX|STEAM|BATTLE_NET, gamertag)
- `GameModeConfig` - Mode definitions (KILLRACE, RESURGENCE, BATTLE_ROYALE)
- `Match` - Match with participants, status, verification, flagging
- `MatchParticipant` - Per-user score, kills, deaths, proof URL
- `MatchVerification` - Proof submissions for verification
- `MatchReport` - Match-level reports (cheating, etc.)
- `UserReport` - Player-level reports
- `Leaderboard` - Per-mode rankings
- `Badge` / `UserBadge` - Achievement badges
- `Notification` - In-app notifications
- `GiftCard` / `Redemption` - Rewards catalog and redemption history

## Last Updated
2026-05-28
