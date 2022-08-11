// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { subscriptionPackages } from './subscriptionpackages.seed';
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
  console.log('\n 🌰  Seeding Users...');

  // create admin user
  const adminUser = await generateAdminUser();
  await prisma.user.create({ data: adminUser });

  // create content creator users
  await prisma.user.createMany({
    data: generateContentCreators,
    skipDuplicates: true,
  });

  // create users
  await prisma.user.createMany({
    data: generateUsers,
    skipDuplicates: true,
  });

  console.log(`Seeded ${await prisma.user.count()} users`);

  await prisma.subscriptionPackage.deleteMany({});
  console.log('\n 🌰  Seeding Subscription Packages...');
  // create subscription packages
  await prisma.subscriptionPackage.createMany({
    data: subscriptionPackages,
  });

  console.log(
    `Seeded ${await prisma.subscriptionPackage.count()} subscription packages`,
  );
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
