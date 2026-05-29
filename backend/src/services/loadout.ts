import { prisma } from './prisma';
import { AppError } from '../middleware/errorHandler';

interface AttachmentInput {
  slot: string;
  name: string;
}

interface CreateLoadoutInput {
  weaponName: string;
  category: string;
  description?: string;
  attachments: AttachmentInput[];
}

interface ReviewInput {
  rating: number;
  comment?: string;
}

export class LoadoutService {
  async create(userId: string, data: CreateLoadoutInput) {
    const loadout = await prisma.loadout.create({
      data: {
        userId,
        weaponName: data.weaponName,
        category: data.category,
        description: data.description,
        attachments: JSON.stringify(data.attachments),
      },
      include: { user: { select: { id: true, pseudo: true } } },
    });
    return { ...loadout, attachments: data.attachments };
  }

  async list(weaponName?: string, category?: string) {
    const where: any = {};
    if (weaponName) where.weaponName = weaponName;
    if (category) where.category = category;

    const loadouts = await prisma.loadout.findMany({
      where,
      include: {
        user: { select: { id: true, pseudo: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return loadouts.map((l) => ({
      ...l,
      attachments: JSON.parse(l.attachments),
      avgRating: l.reviews.length > 0
        ? l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length
        : 0,
      reviewCount: l.reviews.length,
    }));
  }

  async getById(loadoutId: string) {
    const loadout = await prisma.loadout.findUnique({
      where: { id: loadoutId },
      include: {
        user: { select: { id: true, pseudo: true } },
        reviews: {
          include: { user: { select: { id: true, pseudo: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!loadout) throw new AppError(404, 'Loadout not found');
    return {
      ...loadout,
      attachments: JSON.parse(loadout.attachments),
      avgRating: loadout.reviews.length > 0
        ? loadout.reviews.reduce((s, r) => s + r.rating, 0) / loadout.reviews.length
        : 0,
    };
  }

  async delete(loadoutId: string, userId: string) {
    const loadout = await prisma.loadout.findUnique({ where: { id: loadoutId } });
    if (!loadout) throw new AppError(404, 'Loadout not found');
    if (loadout.userId !== userId) throw new AppError(403, 'Not your loadout');
    await prisma.loadout.delete({ where: { id: loadoutId } });
  }

  async addReview(loadoutId: string, userId: string, data: ReviewInput) {
    if (data.rating < 1 || data.rating > 5) {
      throw new AppError(400, 'Rating must be between 1 and 5');
    }
    const loadout = await prisma.loadout.findUnique({ where: { id: loadoutId } });
    if (!loadout) throw new AppError(404, 'Loadout not found');

    const existing = await prisma.loadoutReview.findUnique({
      where: { loadoutId_userId: { loadoutId, userId } },
    });
    if (existing) {
      await prisma.loadoutReview.update({
        where: { id: existing.id },
        data: { rating: data.rating, comment: data.comment },
      });
    } else {
      await prisma.loadoutReview.create({
        data: { loadoutId, userId, rating: data.rating, comment: data.comment },
      });
    }

    const stats = await prisma.loadoutReview.aggregate({
      where: { loadoutId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.loadout.update({
      where: { id: loadoutId },
      data: { avgRating: stats._avg.rating ?? 0, reviewCount: stats._count },
    });

    const review = await prisma.loadoutReview.findUnique({
      where: { loadoutId_userId: { loadoutId, userId } },
      include: { user: { select: { id: true, pseudo: true } } },
    });
    return review;
  }

  async myLoadouts(userId: string) {
    const loadouts = await prisma.loadout.findMany({
      where: { userId },
      include: { reviews: { select: { rating: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return loadouts.map((l) => ({
      ...l,
      attachments: JSON.parse(l.attachments),
      avgRating: l.reviews.length > 0
        ? l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length
        : 0,
      reviewCount: l.reviews.length,
    }));
  }
}

export const loadoutService = new LoadoutService();