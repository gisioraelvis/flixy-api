-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONTENTCREATOR', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[];
