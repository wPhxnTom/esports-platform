import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { authenticate, AuthRequest } from '../middleware/auth';
import { config } from '../config';
import { prisma } from '../services/prisma';

const router = Router();

const PACKAGES: Record<string, { coins: number; price: number; label: string }> = {
  p1: { coins: 100, price: 0.99, label: 'Starter Pack' },
  p2: { coins: 500, price: 3.99, label: 'Competitor Pack' },
  p3: { coins: 1200, price: 7.99, label: 'Warrior Pack' },
  p4: { coins: 3000, price: 14.99, label: 'Elite Pack' },
  p5: { coins: 8000, price: 34.99, label: 'Legend Pack' },
  p6: { coins: 20000, price: 69.99, label: 'Phxntom Pack' },
};

router.post('/create-checkout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!config.stripeSecretKey) {
      res.json({ fallback: true, message: 'Stripe not configured. Request submitted for manual processing.' });
      return;
    }
    const { packageId } = z.object({ packageId: z.string() }).parse(req.body);
    const pkg = PACKAGES[packageId];
    if (!pkg) { res.status(400).json({ message: 'Invalid package' }); return; }

    const stripe = new Stripe(config.stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `${pkg.label} - ${pkg.coins} Phxntom Coins` },
          unit_amount: Math.round(pkg.price * 100),
        },
        quantity: 1,
      }],
      metadata: { userId: req.userId!, coins: pkg.coins.toString(), packageId },
      success_url: `${config.appUrl}/recharge?success=true&coins=${pkg.coins}`,
      cancel_url: `${config.appUrl}/recharge?canceled=true`,
    });

    await prisma.topUp.create({
      data: {
        userId: req.userId!,
        coins: pkg.coins,
        paymentAmount: pkg.price,
        paymentMethod: 'STRIPE',
        status: 'PENDING',
        stripeSessionId: session.id,
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) { next(err); }
});

export async function handleWebhook(req: Request, res: Response) {
  if (!config.stripeWebhookSecret || !config.stripeSecretKey) {
    res.status(200).json({ received: true });
    return;
  }
  const stripe = new Stripe(config.stripeSecretKey);
  const sig = req.headers['stripe-signature'] as string;
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
  } catch {
    res.status(400).json({ message: 'Invalid signature' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const coins = parseInt(session.metadata?.coins || '0');
    if (userId && coins > 0) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } }),
        prisma.topUp.update({
          where: { stripeSessionId: session.id },
          data: { status: 'COMPLETED' },
        }),
      ]);
    }
  }

  res.json({ received: true });
}

export default router;
