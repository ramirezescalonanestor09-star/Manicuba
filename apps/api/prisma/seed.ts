import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('manicuba123');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'salon-demo' },
    update: {},
    create: {
      slug: 'salon-demo',
      businessName: 'Salon Demo',
      ownerName: 'Yamila Perez',
      phoneE164: '+5355551234',
      email: 'demo@manicuba.app',
      defaultCurrency: 'CUP',
      bio: 'Manicuri profesional con 5 anos de experiencia. Disenos personalizados.',
      users: {
        create: {
          email: 'demo@manicuba.app',
          phoneE164: '+5355551234',
          passwordHash,
          name: 'Yamila Perez',
          role: 'OWNER',
        },
      },
      services: {
        create: [
          {
            name: 'Manicure clasico',
            description: 'Limado, cuticulas y esmaltado simple.',
            durationMin: 45,
            priceCUP: 1500,
            priceMLC: 8,
            priceUSD: 10,
          },
          {
            name: 'Diseno personalizado',
            description: 'Trae tu inspiracion y la hacemos realidad.',
            durationMin: 90,
            priceCUP: 3500,
            priceMLC: 18,
            priceUSD: 22,
          },
          {
            name: 'Acrilicas + arte',
            description: 'Unas acrilicas con arte 3D.',
            durationMin: 150,
            priceCUP: 6000,
            priceMLC: 30,
            priceUSD: 35,
          },
        ],
      },
      availabilityWindows: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '20:00' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' },
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Tenant demo creado: ${tenant.slug}`);
  // eslint-disable-next-line no-console
  console.log('Login: demo@manicuba.app / manicuba123');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
