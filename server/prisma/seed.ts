import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const integrations = [
    {
      name: 'Gmail',
      description: 'Czytaj i wysyłaj emaile przez Gmail',
      icon: 'mail',
      category: 'communication',
      isActive: true,
      config: {
        provider: 'google',
        scopes: ['gmail.readonly', 'gmail.send'],
      },
    },
    {
      name: 'Google Calendar',
      description: 'Zarządzaj wydarzeniami w Google Calendar',
      icon: 'calendar',
      category: 'productivity',
      isActive: true,
      config: {
        provider: 'google',
        scopes: ['calendar.readonly', 'calendar.events'],
      },
    },
  ];

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { name: integration.name },
      update: {
        description: integration.description,
        icon: integration.icon,
        category: integration.category,
        isActive: integration.isActive,
        config: integration.config,
      },
      create: integration,
    });
    console.log(
      `✅ ${integration.name} - ${integration.isActive ? 'aktywna' : 'nieaktywna'}`,
    );
  }

  console.log(
    `✨ Seeding completed! ${integrations.length} integrations processed.`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
