import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { prisma } from './services/prisma';
import { errorHandler } from './middleware/errorHandler';
import { setIO, getIO, incrementClients, decrementClients, getConnectedCount } from './socket';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import matchRoutes from './routes/match';
import leaderboardRoutes from './routes/leaderboard';
import notificationRoutes from './routes/notification';
import badgeRoutes from './routes/badge';
import antiCheatRoutes from './routes/antiCheat';
import statsRoutes from './routes/stats';
import rewardsRoutes from './routes/rewards';
import accountsRoutes from './routes/accounts';
import loadoutRoutes from './routes/loadout';
import aiRoutes from './routes/aiMatchmaking';
import platformAuthRoutes from './routes/platformAuth';
import passwordResetRoutes from './routes/passwordReset';
import topUpRoutes from './routes/topUp';
import earlyAccessRoutes from './routes/earlyAccess';
import stripePayRoutes from './routes/stripePay';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
});
setIO(io);

app.use(cors({ origin: config.corsOrigin }));

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  const { handleWebhook } = await import('./routes/stripePay');
  try { await handleWebhook(req, res); } catch (err) { next(err); }
});

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/anti-cheat', antiCheatRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/loadouts', loadoutRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/platform-auth', platformAuthRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/top-up', topUpRoutes);
app.use('/api/early-access', earlyAccessRoutes);
app.use('/api/stripe', stripePayRoutes);

app.use(errorHandler);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    (socket as any).userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

const matchSockets = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  incrementClients();
  const uid = (socket as any).userId;
  if (uid) socket.join(`user:${uid}`);
  console.log('Client connected:', socket.id, `(${getConnectedCount()} online)`);

  socket.on('join:match', (matchId: string, userId?: string) => {
    socket.join(`match:${matchId}`);
    if (userId) {
      if (!matchSockets.has(matchId)) matchSockets.set(matchId, new Set());
      matchSockets.get(matchId)!.add(userId);
    }
    socket.to(`match:${matchId}`).emit('player:joined', { socketId: socket.id });
  });

  socket.on('leave:match', (matchId: string, userId?: string) => {
    socket.leave(`match:${matchId}`);
    if (userId) {
      const set = matchSockets.get(matchId);
      if (set) { set.delete(userId); if (set.size === 0) matchSockets.delete(matchId); }
    }
    socket.to(`match:${matchId}`).emit('player:left', { socketId: socket.id });
  });

  socket.on('match:started', (matchId: string) => {
    io.to(`match:${matchId}`).emit('match:started', { matchId });
  });

  socket.on('score:submitted', (matchId: string, userId: string) => {
    socket.to(`match:${matchId}`).emit('score:submitted', { userId });
  });

  socket.on('match:completed', (matchId: string, results: any) => {
    io.to(`match:${matchId}`).emit('match:completed', results);
  });

  socket.on('disconnect', () => {
    decrementClients();
    console.log('Client disconnected:', socket.id, `(${getConnectedCount()} online)`);
    for (const [matchId, users] of matchSockets.entries()) {
      for (const uid of users) {
        if (uid === (socket as any).userId) {
          users.delete(uid);
          socket.to(`match:${matchId}`).emit('player:left', { socketId: socket.id });
          if (users.size === 0) matchSockets.delete(matchId);
        }
      }
    }
  });
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

export { io };
