import { prisma } from './services/prisma';

async function seed() {
  console.log('Seeding database...');

  const modes = [
    {
      name: 'KILLRACE' as const,
      displayName: 'Killrace',
      description: 'First player to reach the kill target wins. Every kill counts.',
      rules: 'Reach the target kills before anyone else. Points per kill: 10, win bonus: 50.',
      minPlayers: 2,
      maxPlayers: 8,
      pointsPerKill: 10,
      winBonus: 50,
      xpPerKill: 5,
      xpWinBonus: 25,
    },
    {
      name: 'RESURGENCE' as const,
      displayName: 'Resurgence',
      description: 'Respawn and fight. Score is based on eliminations and placement.',
      rules: 'Respawn enabled. Points per kill: 15, placement bonus scales with position.',
      minPlayers: 4,
      maxPlayers: 40,
      pointsPerKill: 15,
      winBonus: 100,
      xpPerKill: 8,
      xpWinBonus: 40,
    },
    {
      name: 'BATTLE_ROYALE' as const,
      displayName: 'Battle Royale',
      description: 'Last player standing wins. High risk, high reward.',
      rules: 'No respawns. Last alive wins. Points per kill: 20, win bonus: 200.',
      minPlayers: 10,
      maxPlayers: 100,
      pointsPerKill: 20,
      winBonus: 200,
      xpPerKill: 10,
      xpWinBonus: 75,
    },
  ];

  for (const mode of modes) {
    await prisma.gameModeConfig.upsert({
      where: { name: mode.name },
      update: mode,
      create: mode,
    });
  }

  const badges = [
    { name: 'First Win', description: 'Win your first match', imageUrl: '/badges/first-win.png', condition: 'WINS:1' },
    { name: 'Warrior', description: 'Win 10 matches', imageUrl: '/badges/warrior.png', condition: 'WINS:10' },
    { name: 'Veteran', description: 'Win 50 matches', imageUrl: '/badges/veteran.png', condition: 'WINS:50' },
    { name: 'Legend', description: 'Win 100 matches', imageUrl: '/badges/legend.png', condition: 'WINS:100' },
    { name: 'Rising Star', description: 'Earn 1000 XP', imageUrl: '/badges/rising-star.png', condition: 'XP:1000' },
    { name: 'Elite', description: 'Earn 10000 XP', imageUrl: '/badges/elite.png', condition: 'XP:10000' },
    { name: 'Dedicated', description: 'Play 50 matches', imageUrl: '/badges/dedicated.png', condition: 'MATCHES:50' },
    { name: 'Addicted', description: 'Play 200 matches', imageUrl: '/badges/addicted.png', condition: 'MATCHES:200' },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }

  console.log('Seed completed!');
}

async function seedGiftCards() {
  const cards = [
    { code: 'AMAZON_10', name: '10€ Amazon', description: 'Carte cadeau Amazon.fr - 10€', cost: 500, provider: 'Amazon', stock: 50 },
    { code: 'PSN_25', name: '25€ PlayStation', description: 'Crédit PlayStation Store - 25€', cost: 1200, provider: 'PlayStation', stock: 30 },
    { code: 'STEAM_10', name: '10€ Steam', description: 'Crédit Steam Wallet - 10€', cost: 500, provider: 'Steam', stock: 40 },
    { code: 'NETFLIX_5', name: '5€ Netflix', description: 'Carte cadeau Netflix - 5€', cost: 250, provider: 'Netflix', stock: 100 },
    { code: 'SPOTIFY_15', name: '15€ Spotify', description: 'Spotify Premium 1 mois', cost: 700, provider: 'Spotify', stock: 25 },
    { code: 'UBEREATS_20', name: '20€ Uber Eats', description: 'Crédit Uber Eats - 20€', cost: 1000, provider: 'Uber Eats', stock: 20 },
  ];

  for (const card of cards) {
    await prisma.giftCard.upsert({
      where: { code: card.code },
      update: card,
      create: card,
    });
  }
  console.log('Gift cards seeded!');
}

seed()
  .then(seedGiftCards)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
