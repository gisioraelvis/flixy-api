// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import {
  generateAdminUser,
  generateContentCreators,
  generateUsers,
} from './users.seed';

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  // delete all existing tables
  await prisma.user.deleteMany({});
  console.log('\n 🌰  Seeding Users...\n');

  // create admin user
  const adminUser = await generateAdminUser();
  await prisma.user.create({ data: adminUser });

  // create content creator users
  await prisma.user.createMany({ data: generateContentCreators });

  // create users
  await prisma.user.createMany({ data: generateUsers });

  console.log(`Seeded ${await prisma.user.count()} users`);
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
