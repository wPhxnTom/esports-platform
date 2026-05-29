import { MatchParticipant, Match, GameModeConfig } from '@prisma/client';
import { prisma } from './prisma';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../socket';
import { antiCheatService } from './antiCheat';

const ENTRY_FEES: Record<string, number> = {
  KILLRACE: 5,
  RESURGENCE: 10,
  BATTLE_ROYALE: 25,
};

const POOL_DISTRIBUTION = [0.6, 0.25, 0.15];

interface ParticipantWithUser extends MatchParticipant {
  user: { id: string; pseudo: string; avatar: string | null };
}

interface MatchWithRelations extends Match {
  gameMode: GameModeConfig;
  creator: { id: string; pseudo: string; avatar: string | null };
  winner: { id: string; pseudo: string } | null;
  participants: ParticipantWithUser[];
}

export class MatchService {
  async createMatch(creatorId: string, gameModeName: string, maxPlayers: number) {
    const gameMode = await prisma.gameModeConfig.findUnique({
      where: { name: gameModeName as any },
    });
    if (!gameMode) {
      throw new AppError(400, 'Invalid game mode', 'INVALID_GAME_MODE');
    }

    const entryFee = ENTRY_FEES[gameModeName] || 0;
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator) throw new AppError(404, 'User not found');
    if (creator.coins < entryFee) {
      throw new AppError(400, `Not enough coins. ${gameModeName} costs ${entryFee} coins.`, 'INSUFFICIENT_COINS');
    }

    const match = await prisma.match.create({
      data: {
        creatorId,
        gameModeId: gameMode.id,
        maxPlayers: Math.min(maxPlayers, gameMode.maxPlayers),
      },
      include: {
        gameMode: true,
        creator: { select: { id: true, pseudo: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, pseudo: true, avatar: true } } },
        },
      },
    });

    await prisma.matchParticipant.create({
      data: { matchId: match.id, userId: creatorId },
    });

    await prisma.user.update({
      where: { id: creatorId },
      data: { coins: { decrement: entryFee } },
    });

    return this.formatMatch(match as any);
  }

  async joinMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true, gameMode: true },
    });

    if (!match) throw new AppError(404, 'Match not found', 'MATCH_NOT_FOUND');
    if (match.status !== 'WAITING') {
      throw new AppError(400, 'Match is not accepting players', 'MATCH_NOT_OPEN');
    }
    if (match.participants.length >= match.maxPlayers) {
      throw new AppError(400, 'Match is full', 'MATCH_FULL');
    }

    const alreadyJoined = match.participants.some((p: MatchParticipant) => p.userId === userId);
    if (alreadyJoined) {
      throw new AppError(400, 'Already in this match', 'ALREADY_JOINED');
    }

    const entryFee = ENTRY_FEES[match.gameMode.name] || 0;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');
    if (user.coins < entryFee) {
      throw new AppError(400, `Not enough coins. This match costs ${entryFee} coins to join.`, 'INSUFFICIENT_COINS');
    }

    await prisma.matchParticipant.create({
      data: { matchId, userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { coins: { decrement: entryFee } },
    });

    const updated = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        gameMode: true,
        creator: { select: { id: true, pseudo: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, pseudo: true, avatar: true } } },
        },
      },
    });

    return this.formatMatch(updated! as any);
  }

  async startMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true },
    });

    if (!match) throw new AppError(404, 'Match not found', 'MATCH_NOT_FOUND');
    if (match.creatorId !== userId) {
      throw new AppError(403, 'Only the creator can start the match', 'FORBIDDEN');
    }
    if (match.status !== 'WAITING') {
      throw new AppError(400, 'Match already started or completed', 'MATCH_STARTED');
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      include: {
        gameMode: true,
        creator: { select: { id: true, pseudo: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, pseudo: true, avatar: true } } },
        },
      },
    });

    getIO().to(`match:${matchId}`).emit('match:started', { matchId });

    return this.formatMatch(updated as any);
  }

  async submitScore(
    matchId: string,
    userId: string,
    data: { score: number; kills: number; deaths: number; position?: number }
  ) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true, gameMode: true },
    });

    if (!match) throw new AppError(404, 'Match not found', 'MATCH_NOT_FOUND');
    if (match.status !== 'IN_PROGRESS') {
      throw new AppError(400, 'Match is not in progress', 'MATCH_NOT_ACTIVE');
    }

    const participant = match.participants.find((p: MatchParticipant) => p.userId === userId);
    if (!participant) {
      throw new AppError(403, 'You are not in this match', 'NOT_PARTICIPANT');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.matchParticipant.update({
        where: { id: participant.id },
        data: { score: data.score, kills: data.kills, deaths: data.deaths, position: data.position },
      });

      const allScores = await tx.matchParticipant.findMany({
        where: { matchId },
        orderBy: { score: 'desc' },
      });

      const allSubmitted = allScores.every((p: MatchParticipant) => p.score > 0 || p.kills > 0 || p.deaths > 0);
      if (allSubmitted) {
        const winner = allScores[0];
        await tx.match.update({
          where: { id: matchId },
          data: { status: 'COMPLETED', endedAt: new Date(), winnerId: winner.userId },
        });
        return { completed: true, allScores, winner };
      }
      return { completed: false, allScores: null, winner: null };
    });

    getIO().to(`match:${matchId}`).emit('score:submitted', { userId });

    if (result.completed) {
      const results = await this.processMatchResults(matchId, result.allScores!, match.gameMode);
      getIO().to(`match:${matchId}`).emit('match:completed', results);
    }

    return { score: data.score, kills: data.kills, deaths: data.deaths, position: data.position };
  }

  private async processMatchResults(
    matchId: string,
    scores: MatchParticipant[],
    gameMode: GameModeConfig
  ) {
    const rewards: any[] = [];
    const isFarming = await antiCheatService.detectFarming(matchId);
    const durationOk = await antiCheatService.checkMatchDuration(matchId);

    if (isFarming || !durationOk) {
      await antiCheatService.flagMatch(matchId, isFarming ? 'REPEATED_PLAYERS_FARMING' : 'MATCH_TOO_SHORT');
    }

    const gameModeName = gameMode.name;
    const entryFee = ENTRY_FEES[gameModeName] || 0;
    const prizePoolPerPlayer: number[] = new Array(scores.length).fill(0);

    if (entryFee > 0 && scores.length >= 2) {
      const totalPool = entryFee * scores.length;
      const distribution = POOL_DISTRIBUTION.slice(0, Math.min(scores.length, POOL_DISTRIBUTION.length));
      const remainingShare = distribution.reduce((a, b) => a + b, 0);
      const othersShare = (1 - remainingShare) / Math.max(1, scores.length - distribution.length);

      for (let i = 0; i < scores.length; i++) {
        const share = i < distribution.length ? distribution[i] : othersShare;
        prizePoolPerPlayer[i] = Math.floor(totalPool * share);
      }
    }

    for (let i = 0; i < scores.length; i++) {
      const s = scores[i];
      const isWinner = i === 0;
      const rawPoints = s.kills * gameMode.pointsPerKill + (isWinner ? gameMode.winBonus : 0);
      const rawXp = s.kills * gameMode.xpPerKill + (isWinner ? gameMode.xpWinBonus : 0);

      const { xpAwarded, coinsAwarded } = await antiCheatService.applyRewardsWithCaps(s.userId, rawXp, rawPoints);

      await prisma.user.update({
        where: { id: s.userId },
        data: {
          xp: { increment: xpAwarded },
          coins: { increment: coinsAwarded },
          wins: { increment: isWinner ? 1 : 0 },
          losses: { increment: isWinner ? 0 : 1 },
          totalMatches: { increment: 1 },
        },
      });

      await prisma.leaderboard.upsert({
        where: { userId: s.userId },
        create: {
          userId: s.userId,
          gameModeId: gameMode.id,
          score: coinsAwarded,
          rank: 0,
        },
        update: {
          score: { increment: coinsAwarded },
        },
      });

      const capMsg = (xpAwarded < rawXp || coinsAwarded < rawPoints)
        ? ' (daily cap reached, reduced rewards)' : '';

      const prizeStr = prizePoolPerPlayer[i] ? ` + ${prizePoolPerPlayer[i]} prize pool coins` : '';
      await prisma.notification.create({
        data: {
          userId: s.userId,
          type: isWinner ? 'MATCH_WIN' : 'MATCH_END',
          message: isWinner
            ? `You won the match! +${xpAwarded} XP, +${coinsAwarded} coins${capMsg}${prizeStr}`
            : `Match completed. You placed #${i + 1}. +${xpAwarded} XP, +${coinsAwarded} coins${capMsg}${prizeStr}`,
        },
      });

      rewards.push({
        userId: s.userId,
        pseudo: s.userId,
        xpEarned: xpAwarded,
        coinsEarned: coinsAwarded + prizePoolPerPlayer[i],
        isWinner,
        placement: i + 1,
        capped: xpAwarded < rawXp || coinsAwarded < rawPoints,
        flagged: isFarming || !durationOk,
        prizePoolShare: prizePoolPerPlayer[i],
      });
    }

    if (entryFee > 0 && scores.length >= 2) {
      for (let i = 0; i < scores.length; i++) {
        const prizeCoins = prizePoolPerPlayer[i];
        if (prizeCoins > 0) {
          await prisma.user.update({
            where: { id: scores[i].userId },
            data: { coins: { increment: prizeCoins } },
          });
        }
      }
    }

    const earnedBadges = await this.checkBadges(scores.map((s: MatchParticipant) => s.userId));

    return { rewards, earnedBadges };
  }

  private async checkBadges(userIds: string[]) {
    const allEarned: { userId: string; badgeId: string; badgeName: string }[] = [];

    for (const userId of userIds) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { badges: true },
      });
      if (!user) continue;

      const earnedBadgeIds = user.badges.map((b: { badgeId: string }) => b.badgeId);
      const badges = await prisma.badge.findMany();

      for (const badge of badges) {
        if (earnedBadgeIds.includes(badge.id)) continue;

        let earned = false;
        if (badge.condition) {
          const [type, value] = badge.condition.split(':');
          switch (type) {
            case 'WINS':
              earned = user.wins >= parseInt(value);
              break;
            case 'XP':
              earned = user.xp >= parseInt(value);
              break;
            case 'MATCHES':
              earned = user.totalMatches >= parseInt(value);
              break;
          }
        }

        if (earned) {
          await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
          await prisma.notification.create({
            data: {
              userId,
              type: 'BADGE_EARNED',
              message: `You earned the "${badge.name}" badge!`,
            },
          });
          allEarned.push({ userId, badgeId: badge.id, badgeName: badge.name });
        }
      }
    }

    return allEarned;
  }

  async getMatchHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [participations, total] = await Promise.all([
      prisma.matchParticipant.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
        include: {
          match: {
            include: {
              gameMode: true,
              winner: { select: { id: true, pseudo: true } },
            },
          },
        },
      }),
      prisma.matchParticipant.count({ where: { userId } }),
    ]);

    return {
      data: participations.map((p: any) => ({
        matchId: p.match.id,
        gameMode: p.match.gameMode.name,
        status: p.match.status,
        score: p.score,
        kills: p.kills,
        deaths: p.deaths,
        position: p.position,
        won: p.match.winnerId === userId,
        playedAt: p.joinedAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private formatMatch(match: any) {
    return {
      id: match.id,
      gameMode: match.gameMode.name,
      entryFee: ENTRY_FEES[match.gameMode.name] || 0,
      status: match.status,
      maxPlayers: match.maxPlayers,
      creator: match.creator,
      players: match.participants.map((p: any) => ({
        userId: p.user.id,
        pseudo: p.user.pseudo,
        avatar: p.user.avatar,
        team: p.team,
        score: p.score,
        kills: p.kills,
        position: p.position,
        joinedAt: p.joinedAt,
      })),
      winner: match.winner
        ? { id: match.winner.id, pseudo: match.winner.pseudo }
        : null,
      createdAt: match.createdAt,
      startedAt: match.startedAt,
      endedAt: match.endedAt,
    };
  }

  async getAvailableMatches() {
    const matches = await prisma.match.findMany({
      where: { status: 'WAITING' },
      include: {
        gameMode: true,
        creator: { select: { id: true, pseudo: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, pseudo: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return matches.map((m: any) => this.formatMatch(m));
  }

  async getMatchById(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        gameMode: true,
        creator: { select: { id: true, pseudo: true, avatar: true } },
        winner: { select: { id: true, pseudo: true } },
        participants: {
          include: { user: { select: { id: true, pseudo: true, avatar: true } } },
        },
      },
    });

    if (!match) throw new AppError(404, 'Match not found', 'MATCH_NOT_FOUND');
    return this.formatMatch(match);
  }

  async getMatchResults(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        gameMode: true,
        creator: { select: { id: true, pseudo: true, avatar: true } },
        winner: { select: { id: true, pseudo: true } },
        participants: {
          include: { user: { select: { id: true, pseudo: true, avatar: true } } },
        },
      },
    });

    if (!match) throw new AppError(404, 'Match not found', 'MATCH_NOT_FOUND');
    if (match.status !== 'COMPLETED') throw new AppError(400, 'Match not completed yet', 'MATCH_NOT_COMPLETED');

    const participants = match.participants.map((p: any) => ({
      userId: p.user.id,
      pseudo: p.user.pseudo,
      avatar: p.user.avatar,
      score: p.score,
      kills: p.kills,
      deaths: p.deaths,
      position: p.position,
      kd: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2),
    })).sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    return {
      matchId: match.id,
      gameMode: match.gameMode.name,
      gameModeDisplay: match.gameMode.displayName,
      entryFee: ENTRY_FEES[match.gameMode.name] || 0,
      pointsPerKill: match.gameMode.pointsPerKill,
      winBonus: match.gameMode.winBonus,
      xpPerKill: match.gameMode.xpPerKill,
      xpWinBonus: match.gameMode.xpWinBonus,
      status: match.status,
      startedAt: match.startedAt,
      endedAt: match.endedAt,
      duration: match.startedAt && match.endedAt
        ? Math.round((match.endedAt.getTime() - match.startedAt.getTime()) / 1000)
        : 0,
      winner: match.winner ? { id: match.winner.id, pseudo: match.winner.pseudo } : null,
      participants,
    };
  }
}

export const matchService = new MatchService();
