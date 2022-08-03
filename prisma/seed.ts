// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();

  console.log('Seeding...');

  // create users - admin, content creator and customer
  /*
  CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR NOT NULL,
    "isEmailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" VARCHAR NOT NULL,
    "isPhoneNumberConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "password" VARCHAR NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "googleId" VARCHAR,
    "facebookId" VARCHAR,
    "verificationToken" VARCHAR,
    "isAdult" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isContentCreator" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);
*/

  const user1 = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      isEmailConfirmed: true,
      phoneNumber: '+123456789',
      isPhoneNumberConfirmed: true,
      password: 'admin',
      status: 'ACTIVE',
      isAdult: true,
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
      isAdult: true,
      isAdmin: false,
      isContentCreator: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'customer@gmail.com',
      isEmailConfirmed: true,
      phoneNumber: '+123489567',
      isPhoneNumberConfirmed: true,
      password: 'customer',
      status: 'ACTIVE',
      isAdult: true,
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
