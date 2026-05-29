import { prisma } from './prisma';
import { AppError } from '../middleware/errorHandler';

export class RewardsService {
  async listGiftCards(userId?: string) {
    const cards = await prisma.giftCard.findMany({
      where: { active: true, stock: { gt: 0 } },
      orderBy: { cost: 'asc' },
    });
    const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } }) : null;
    return { cards, userCoins: user?.coins ?? 0 };
  }

  async redeem(userId: string, giftCardId: string) {
    const [user, card] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.giftCard.findUnique({ where: { id: giftCardId } }),
    ]);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    if (!card) throw new AppError(404, 'Gift card not found', 'GIFT_CARD_NOT_FOUND');
    if (!card.active) throw new AppError(400, 'Gift card is no longer available', 'GIFT_CARD_INACTIVE');
    if (card.stock <= 0) throw new AppError(400, 'Out of stock', 'OUT_OF_STOCK');
    if (user.coins < card.cost) throw new AppError(400, 'Not enough coins', 'INSUFFICIENT_COINS');

    const results = await prisma.$transaction([
      prisma.redemption.create({
        data: {
          userId,
          giftCardId,
          coinsSpent: card.cost,
          status: 'PROCESSING',
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: card.cost } },
      }),
      prisma.giftCard.update({
        where: { id: giftCardId },
        data: { stock: { decrement: 1 } },
      }),
    ]);

    return { success: true, redemption: results[0], message: `🎉 You redeemed ${card.name}! The code will be sent to your email.` };
  }

  async history(userId: string) {
    return prisma.redemption.findMany({
      where: { userId },
      include: { giftCard: { select: { name: true, description: true, cost: true, provider: true } } },
      orderBy: { redeemedAt: 'desc' },
    });
  }
}

export const rewardsService = new RewardsService();
