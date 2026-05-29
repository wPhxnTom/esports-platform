import { prisma } from './prisma';

interface LeaderboardUser {
  id: string;
  pseudo: string;
  avatar: string | null;
  rank: string;
  xp: number;
  wins: number;
  totalMatches: number;
}

interface LeaderboardEntryWithUser {
  score: number;
  user: {
    id: string;
    pseudo: string;
    avatar: string | null;
    rank: string;
  };
}

export class LeaderboardService {
  async getGlobalLeaderboard(limit = 50) {
    const users = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true,
        pseudo: true,
        avatar: true,
        rank: true,
        xp: true,
        wins: true,
        totalMatches: true,
      },
    });

    return users.map((u: LeaderboardUser, i: number) => ({
      rank: i + 1,
      userId: u.id,
      pseudo: u.pseudo,
      avatar: u.avatar,
      rankTitle: u.rank,
      xp: u.xp,
      wins: u.wins,
      matchesPlayed: u.totalMatches,
      winRate: u.totalMatches > 0 ? Math.round((u.wins / u.totalMatches) * 100) : 0,
    }));
  }

  async getGameModeLeaderboard(gameModeName: string, limit = 50) {
    const gameMode = await prisma.gameModeConfig.findUnique({
      where: { name: gameModeName as any },
    });
    if (!gameMode) return [];

    const entries = await prisma.leaderboard.findMany({
      where: { gameModeId: gameMode.id },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, pseudo: true, avatar: true, rank: true },
        },
      },
    });

    return entries.map((e: LeaderboardEntryWithUser, i: number) => ({
      rank: i + 1,
      userId: e.user.id,
      pseudo: e.user.pseudo,
      avatar: e.user.avatar,
      rankTitle: e.user.rank,
      score: e.score,
    }));
  }
}

export const leaderboardService = new LeaderboardService();
