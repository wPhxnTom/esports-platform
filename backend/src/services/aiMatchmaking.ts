import { prisma } from './prisma';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../socket';

const TIER_SCORE: Record<string, number> = {
  BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4, DIAMOND: 5, MASTER: 6, GRANDMASTER: 7,
};

const RANK_TOLERANCE = 1;

export class AiMatchmakingService {
  async joinQueue(userId: string, gameMode: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const existing = await prisma.matchmakingQueue.findUnique({ where: { userId } });
    if (existing) {
      if (existing.status === 'WAITING') throw new AppError(400, 'Already in queue');
      await prisma.matchmakingQueue.delete({ where: { userId } });
    }

    await prisma.matchmakingQueue.create({
      data: { userId, pseudo: user.pseudo, gameMode, rank: user.rank, trustScore: user.trustScore },
    });

    const matched = await this.processQueue(gameMode);
    return { queued: true, matched: matched ?? undefined };
  }

  async leaveQueue(userId: string) {
    await prisma.matchmakingQueue.delete({ where: { userId } }).catch(() => {});
    return { left: true };
  }

  async getQueueStatus(userId: string) {
    const entry = await prisma.matchmakingQueue.findUnique({ where: { userId } });
    if (!entry) return { inQueue: false };
    return { inQueue: true, gameMode: entry.gameMode, rank: entry.rank, status: entry.status, queuedAt: entry.createdAt };
  }

  async getQueueCount(): Promise<number> {
    return prisma.matchmakingQueue.count({ where: { status: 'WAITING' } });
  }

  async processQueue(gameMode?: string): Promise<{ matchId: string; players: any[] } | null> {
    const where: any = { status: 'WAITING' };
    if (gameMode) where.gameMode = gameMode;

    const queue = await prisma.matchmakingQueue.findMany({ where, orderBy: { createdAt: 'asc' } });
    if (queue.length < 2) return null;

    const groups = this.groupByRank(queue);

    for (const group of groups) {
      if (group.length >= 2) {
        return this.createMatchFromQueue(group, gameMode);
      }
    }

    for (let i = 0; i < queue.length; i++) {
      for (let j = i + 1; j < queue.length; j++) {
        if (this.ranksMatch(queue[i].rank, queue[j].rank)) {
          return this.createMatchFromQueue([queue[i], queue[j]], gameMode);
        }
      }
    }

    return null;
  }

  private groupByRank(queue: any[]): any[][] {
    const groups: Map<string, any[]> = new Map();
    for (const entry of queue) {
      const tier = TIER_SCORE[entry.rank] || 1;
      const key = `${tier}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return Array.from(groups.values());
  }

  private ranksMatch(rankA: string, rankB: string): boolean {
    const scoreA = TIER_SCORE[rankA] || 1;
    const scoreB = TIER_SCORE[rankB] || 1;
    return Math.abs(scoreA - scoreB) <= RANK_TOLERANCE;
  }

  private async createMatchFromQueue(queueEntries: any[], gameMode?: string) {
    const gm = gameMode || queueEntries[0].gameMode;
    const creator = queueEntries[0];

    const match = await prisma.match.create({
      data: {
        creatorId: creator.userId,
        gameModeId: (await prisma.gameModeConfig.findUnique({ where: { name: gm as any } }))!.id,
        maxPlayers: queueEntries.length,
        status: 'WAITING',
      },
      include: {
        gameMode: true,
        creator: { select: { id: true, pseudo: true, avatar: true } },
        participants: { include: { user: { select: { id: true, pseudo: true, avatar: true } } } },
      },
    });

    for (const entry of queueEntries) {
      await prisma.matchParticipant.create({
        data: { matchId: match.id, userId: entry.userId },
      });
    }

    const balanced = this.balanceTeams(queueEntries);
    for (const b of balanced) {
      await prisma.matchParticipant.updateMany({
        where: { matchId: match.id, userId: b.userId },
        data: { team: b.team },
      });
    }

    await prisma.matchmakingQueue.deleteMany({
      where: { userId: { in: queueEntries.map(e => e.userId) } },
    });

    for (const entry of queueEntries) {
      await prisma.notification.create({
        data: {
          userId: entry.userId,
          type: 'MATCH_FOUND',
          message: `Match found! AI has balanced teams. Join match ${match.id} now.`,
        },
      });
    }

    const io = getIO();
    for (const entry of queueEntries) {
      io.to(`user:${entry.userId}`).emit('queue:matched', { matchId: match.id });
    }

    return {
      matchId: match.id,
      players: queueEntries.map(e => ({ userId: e.userId, pseudo: e.pseudo })),
    };
  }

  balanceTeams(queueEntries: any[]): { userId: string; team: string }[] {
    const sorted = [...queueEntries].sort((a, b) => {
      const scoreA = (TIER_SCORE[a.rank] || 1) * (a.trustScore / 100);
      const scoreB = (TIER_SCORE[b.rank] || 1) * (b.trustScore / 100);
      return scoreB - scoreA;
    });

    const result: { userId: string; team: string }[] = [];
    let teamAscore = 0;
    let teamBscore = 0;

    for (const entry of sorted) {
      const power = (TIER_SCORE[entry.rank] || 1) * (entry.trustScore / 100);
      if (teamAscore <= teamBscore) {
        result.push({ userId: entry.userId, team: 'ALPHA' });
        teamAscore += power;
      } else {
        result.push({ userId: entry.userId, team: 'BRAVO' });
        teamBscore += power;
      }
    }

    return result;
  }

  async suggestMatchups(userId: string, limit = 5) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const userTier = TIER_SCORE[user.rank] || 1;

    const candidates = await prisma.user.findMany({
      where: {
        id: { not: userId },
        rank: {
          in: Object.entries(TIER_SCORE)
            .filter(([, s]) => Math.abs(s - userTier) <= RANK_TOLERANCE)
            .map(([r]) => r),
        },
      },
      select: {
        id: true, pseudo: true, rank: true, wins: true, losses: true,
        totalMatches: true, trustScore: true, avatar: true,
      },
      take: limit * 3,
      orderBy: { totalMatches: 'desc' },
    });

    const scored = candidates.map(c => {
      const winRate = c.totalMatches > 0 ? c.wins / c.totalMatches : 0;
      const score = Math.abs(winRate - (user.totalMatches > 0 ? user.wins / user.totalMatches : 0));
      return { ...c, score };
    });

    scored.sort((a, b) => a.score - b.score);

    return scored.slice(0, limit).map(c => ({
      userId: c.id, pseudo: c.pseudo, rank: c.rank,
      wins: c.wins, losses: c.losses, totalMatches: c.totalMatches,
      trustScore: c.trustScore, avatar: c.avatar,
      suggested1v1: true,
    }));
  }

  getRankScore(rank: string): number {
    return TIER_SCORE[rank] || 1;
  }
}

export const aiMatchmakingService = new AiMatchmakingService();
