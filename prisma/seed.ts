// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();

  console.log('Seeding...');

  // create users - admin, content creator and user

  const user1 = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      isEmailConfirmed: true,
      phoneNumber: '+123456789',
      isPhoneNumberConfirmed: true,
      password: 'admin',
      status: 'ACTIVE',
      isAdmin: true,
      isContentCreator: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'contentcreator@gmail.com',
      isEmailConfirmed: true,
      phoneNumber: '+123845679',
      isPhoneNumberConfirmed: true,
      password: 'contentcreator',
      status: 'ACTIVE',
      isAdmin: false,
      isContentCreator: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'user@gmail.com',
      isEmailConfirmed: true,
      phoneNumber: '+123489567',
      isPhoneNumberConfirmed: true,
      password: 'customer',
      status: 'ACTIVE',
      isAdmin: false,
      isContentCreator: false,
    },
  });

  console.log({ user1, user2, user3 });
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });