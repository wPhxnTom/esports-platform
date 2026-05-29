export enum GameMode {
  KILLRACE = 'KILLRACE',
  RESURGENCE = 'RESURGENCE',
  BATTLE_ROYALE = 'BATTLE_ROYALE'
}

export enum MatchStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum Rank {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  MASTER = 'MASTER',
  GRANDMASTER = 'GRANDMASTER'
}

export interface UserProfile {
  id: string;
  pseudo: string;
  email: string;
  avatar: string | null;
  xp: number;
  rank: Rank;
  coins: number;
  wins: number;
  losses: number;
  totalMatches: number;
  createdAt: string;
}

export interface Match {
  id: string;
  gameMode: GameMode;
  status: MatchStatus;
  maxPlayers: number;
  players: MatchPlayer[];
  winner: MatchPlayer | null;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface MatchPlayer {
  userId: string;
  pseudo: string;
  avatar: string | null;
  score: number;
  kills: number;
  position: number;
  joinedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  pseudo: string;
  avatar: string | null;
  rank: Rank;
  xp: number;
  wins: number;
  matchesPlayed: number;
  winRate: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface UserBadge extends Badge {
  earnedAt: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ApiError {
  message: string;
  code: string;
}
