import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const seedEmail = process.env.SEED_USER_EMAIL || 'admin@voynichcodex.com';
  const seedPassword = process.env.SEED_USER_PASSWORD || 'admin123456';

  // 1. Admin user
  const admin = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {},
    create: {
      email: seedEmail,
      password: await bcrypt.hash(seedPassword, 12),
      name: 'Gran Escriba',
      username: 'gran_escriba',
      systemRole: 'GRAN_ESCRIBA',
      emailVerified: true
    }
  });

  console.log(`[seed] user ready: ${admin.email}`);

  // 2. World
  let world = await prisma.world.findFirst({ where: { name: 'Aetheria' } });
  if (!world) {
    world = await prisma.world.create({
      data: {
        name: 'Aetheria',
        description: 'Mundo de semillas de cristal y tormentas perpetuas.',
        createdBy: admin.id,
        visibility: 'PUBLIC',
        members: { create: { userId: admin.id, role: 'OWNER' } }
      }
    });
    console.log(`[seed] world created: ${world.name}`);
  } else {
    console.log(`[seed] world already exists: ${world.name}`);
  }

  // 3. Manuscript
  let manuscript = await prisma.manuscript.findFirst({
    where: { title: 'Las Semillas del Cielo' }
  });
  if (!manuscript) {
    manuscript = await prisma.manuscript.create({
      data: {
        worldId: world.id,
        title: 'Las Semillas del Cielo',
        subtitle: 'Novela de fantasía en tres actos',
        genre: 'Fantasy',
        synopsis: 'Una cosechadora descubre que las semillas que planta nacen de las estrellas.',
        visibility: 'PUBLIC',
        createdBy: admin.id,
        members: { create: { userId: admin.id, role: 'ESCRITOR' } }
      }
    });
    console.log(`[seed] manuscript created: ${manuscript.title}`);
  } else {
    console.log(`[seed] manuscript already exists: ${manuscript.title}`);
  }

  // 4. Chapter
  let chapter = await prisma.chapter.findFirst({
    where: { manuscriptId: manuscript.id, title: 'La Cosecha de Estrellas' }
  });
  if (!chapter) {
    chapter = await prisma.chapter.create({
      data: {
        manuscriptId: manuscript.id,
        title: 'La Cosecha de Estrellas',
        number: 1,
        order: 1,
        content: '<p>El viento traía olor a tormenta cuando Lira abrió el granero.</p>',
        status: 'PUBLISHED',
        isPublished: true,
        publishedAt: new Date(),
        wordCount: 18
      }
    });

    await prisma.manuscript.update({
      where: { id: manuscript.id },
      data: { totalChapters: 1, publishedChapters: 1, wordCount: 18, readTimeMinutes: 1 }
    });
    console.log(`[seed] chapter created: ${chapter.title}`);
  } else {
    console.log(`[seed] chapter already exists: ${chapter.title}`);
  }

  // 5. Bestiary entry
  const creatureCount = await prisma.bestiaryEntry.count({ where: { worldId: world.id } });
  if (creatureCount === 0) {
    await prisma.bestiaryEntry.create({
      data: {
        worldId: world.id,
        name: 'Cosechador Luminoso',
        species: 'CRIATURA_MITICA',
        dangerLevel: 'INOFENSIVA',
        habitat: 'Llanuras de cristal',
        diet: 'Luz solar condensada',
        description: 'Criatura que germina bajo la lluvia y florece en noches despejadas.',
        characteristics: { humores: ['tranquilo', 'curioso'] }
      }
    });
    console.log('[seed] bestiary entry created');
  } else {
    console.log('[seed] bestiary already populated');
  }

  // 6. Timeline event
  const eventCount = await prisma.timelineEvent.count({ where: { worldId: world.id } });
  if (eventCount === 0) {
    await prisma.timelineEvent.create({
      data: {
        worldId: world.id,
        title: 'La Primera Lluvia',
        description: 'La tormenta que sembró los primeros cristales en la llanura.',
        dateInWorld: 'Año 1, primavera',
        era: 'ERA_ACTUAL',
        importance: 5
      }
    });
    console.log('[seed] timeline event created');
  }

  console.log('\n[seed] done. Login with:');
  console.log(`  email:    ${seedEmail}`);
  console.log(`  password: ${seedPassword}`);
}

main()
  .catch((e) => {
    console.error('[seed] error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });