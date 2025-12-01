import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.integration.deleteMany({
    where: {
      NOT: {
        name: {
          in: ['Gmail', 'Google Calendar'],
        },
      },
    },
  });

  const integrations = [
    {
      name: 'Gmail',
      description: 'Czytaj i wysyłaj emaile',
      icon: 'mail',
      category: 'communication',
      isActive: false,
    },
    {
      name: 'Google Calendar',
      description: 'Zarządzaj swoim kalendarzem',
      icon: 'calendar',
      category: 'productivity',
      isActive: false,
    },
  ];

  await prisma.integration.createMany({
    data: integrations,
    skipDuplicates: true,
  });

  console.log(
    `✅ Created/Updated ${integrations.length} integrations (skipDuplicates enabled)`,
  );

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
