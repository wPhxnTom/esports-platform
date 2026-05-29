import { prisma } from './prisma';
import { AppError } from '../middleware/errorHandler';

const DAILY_XP_CAP = 500;
const DAILY_COINS_CAP = 1000;
const MIN_MATCH_DURATION_SEC = 30;
const REPEAT_PLAYER_THRESHOLD = 3;
const TRUST_SCORE_REPORT_PENALTY = 10;
const MATCHES_BEFORE_CAP = 20;

export class AntiCheatService {
  async checkDailyCaps(userId: string): Promise<{ xpRemaining: number; coinsRemaining: number }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const now = new Date();
    const lastReset = new Date(user.lastDailyReset);
    const isNewDay = now.getDate() !== lastReset.getDate()
      || now.getMonth() !== lastReset.getMonth()
      || now.getFullYear() !== lastReset.getFullYear();

    if (isNewDay) {
      await prisma.user.update({
        where: { id: userId },
        data: { dailyXp: 0, dailyCoins: 0, lastDailyReset: now },
      });
      return { xpRemaining: DAILY_XP_CAP, coinsRemaining: DAILY_COINS_CAP };
    }

    return {
      xpRemaining: Math.max(0, DAILY_XP_CAP - user.dailyXp),
      coinsRemaining: Math.max(0, DAILY_COINS_CAP - user.dailyCoins),
    };
  }

  async checkMatchDuration(matchId: string): Promise<boolean> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { gameMode: true },
    });
    if (!match || !match.startedAt || !match.endedAt) return false;
    const duration = (match.endedAt.getTime() - match.startedAt.getTime()) / 1000;
    const minDuration = match.gameMode.minMatchDurationSec || MIN_MATCH_DURATION_SEC;
    return duration >= minDuration;
  }

  async detectFarming(matchId: string): Promise<boolean> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true },
    });
    if (!match || match.participants.length < 2) return false;

    const userIds = match.participants.map(p => p.userId);

    const recentMatches = await prisma.matchParticipant.findMany({
      where: {
        userId: { in: userIds },
        match: { status: 'COMPLETED' },
      },
      include: { match: { include: { participants: true } } },
      orderBy: { joinedAt: 'desc' },
      take: MATCHES_BEFORE_CAP * userIds.length,
    });

    const matchCounts = new Map<string, number>();
    for (const mp of recentMatches) {
      const otherIds = mp.match.participants
        .filter(p => p.userId !== mp.userId)
        .map(p => p.userId)
        .sort()
        .join(',');
      matchCounts.set(otherIds, (matchCounts.get(otherIds) || 0) + 1);
    }

    for (const [, count] of matchCounts) {
      if (count >= REPEAT_PLAYER_THRESHOLD) return true;
    }

    return false;
  }

  async applyRewardsWithCaps(
    userId: string, xpEarned: number, coinsEarned: number
  ): Promise<{ xpAwarded: number; coinsAwarded: number }> {
    const caps = await this.checkDailyCaps(userId);

    const xpAwarded = Math.min(xpEarned, caps.xpRemaining);
    const coinsAwarded = Math.min(coinsEarned, caps.coinsRemaining);

    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyXp: { increment: xpAwarded },
        dailyCoins: { increment: coinsAwarded },
      },
    });

    return { xpAwarded, coinsAwarded };
  }

  async flagMatch(matchId: string, reason: string): Promise<void> {
    await prisma.match.update({
      where: { id: matchId },
      data: { flagged: true, flagReason: reason },
    });
  }

  async submitProof(matchId: string, userId: string, proofUrl: string, notes?: string) {
    const participant = await prisma.matchParticipant.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    if (!participant) throw new AppError(403, 'Not a participant');

    await prisma.matchParticipant.update({
      where: { matchId_userId: { matchId, userId } },
      data: { proofUrl },
    });

    await prisma.matchVerification.create({
      data: { matchId, userId, proofUrl, notes, status: 'PENDING' },
    });
  }

  async confirmMatchResult(matchId: string, userId: string) {
    const participant = await prisma.matchParticipant.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    if (!participant) throw new AppError(403, 'Not a participant');

    await prisma.matchParticipant.update({
      where: { matchId_userId: { matchId, userId } },
      data: { confirmed: true },
    });

    const allParticipants = await prisma.matchParticipant.findMany({
      where: { matchId },
    });
    const allConfirmed = allParticipants.every(p => p.confirmed);

    if (allConfirmed) {
      await prisma.match.update({
        where: { id: matchId },
        data: { verification: 'CONFIRMED' },
      });
      return { matchVerified: true };
    }

    return { matchVerified: false };
  }

  async reportPlayer(reporterId: string, targetId: string, reason: string, description?: string, matchId?: string) {
    if (reporterId === targetId) throw new AppError(400, 'Cannot report yourself');

    await prisma.userReport.create({
      data: { reporterId, targetId, reason, description, matchId },
    });

    await prisma.user.update({
      where: { id: targetId },
      data: { reportCount: { increment: 1 }, trustScore: { decrement: TRUST_SCORE_REPORT_PENALTY } },
    });

    await prisma.notification.create({
      data: {
        userId: targetId,
        type: 'REPORT',
        message: `You have been reported for: ${reason}. Repeated violations may result in penalties.`,
      },
    });

    return { success: true };
  }

  async reportMatch(matchId: string, reporterId: string, targetId: string, reason: string, description?: string) {
    await prisma.matchReport.create({
      data: { matchId, reporterId, targetId, reason, description },
    });

    await prisma.match.update({
      where: { id: matchId },
      data: { flagged: true, flagReason: reason },
    });

    return { success: true };
  }

  async getMatchVerificationStatus(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        verifications: true,
        participants: { select: { userId: true, confirmed: true, proofUrl: true } },
      },
    });
    return match;
  }

  async getFlaggedMatches() {
    return prisma.match.findMany({
      where: { flagged: true },
      include: {
        gameMode: { select: { name: true } },
        creator: { select: { pseudo: true } },
        participants: { include: { user: { select: { pseudo: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async resolveFlaggedMatch(matchId: string, action: 'APPROVE' | 'REJECT' | 'VOID') {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new AppError(404, 'Match not found');

    if (action === 'VOID') {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'VOIDED', flagged: false, flagReason: null },
      });

      const participants = await prisma.matchParticipant.findMany({ where: { matchId } });
      for (const p of participants) {
        await prisma.user.update({
          where: { id: p.userId },
          data: {
            totalMatches: { decrement: 1 },
            wins: { decrement: match.winnerId === p.userId ? 1 : 0 },
            losses: { decrement: match.winnerId !== p.userId && match.winnerId ? 1 : 0 },
          },
        });
      }
    } else {
      await prisma.match.update({
        where: { id: matchId },
        data: { flagged: false, flagReason: null, verification: action === 'APPROVE' ? 'CONFIRMED' : 'REJECTED' },
      });
    }

    return { success: true };
  }
}

export const antiCheatService = new AntiCheatService();
