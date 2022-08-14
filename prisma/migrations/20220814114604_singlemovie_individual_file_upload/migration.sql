/*
  Warnings:

  - You are about to drop the column `videoUrl` on the `SingleMovie` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MovieFileType" AS ENUM ('POSTER', 'TRAILER', 'VIDEO');

-- AlterTable
ALTER TABLE "SingleMovie" DROP COLUMN "videoUrl",
ADD COLUMN     "isReleased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoKey" TEXT,
ALTER COLUMN "posterUrl" DROP NOT NULL,
ALTER COLUMN "trailerUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SingleMovieFiles" (
    "id" SERIAL NOT NULL,
    "singleMovieId" INTEGER NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileType" "MovieFileType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SingleMovieFiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SingleMovieFiles_fileKey_key" ON "SingleMovieFiles"("fileKey");

-- AddForeignKey
ALTER TABLE "SingleMovieFiles" ADD CONSTRAINT "SingleMovieFiles_singleMovieId_fkey" FOREIGN KEY ("singleMovieId") REFERENCES "SingleMovie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
