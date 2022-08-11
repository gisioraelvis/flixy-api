/*
  Warnings:

  - You are about to drop the column `likeDislikeId` on the `SingleMovie` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `PrivateFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PublicFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentCreatorId` to the `SingleMovie` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PackageName" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'PLATINUM');

-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "stack" TEXT;

-- AlterTable
ALTER TABLE "PrivateFile" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PublicFile" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SingleMovie" DROP COLUMN "likeDislikeId",
ADD COLUMN     "contentCreatorId" INTEGER NOT NULL,
ALTER COLUMN "filesFolder" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ContentCreator" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesMovie" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "trailerUrl" TEXT NOT NULL,
    "isPremiering" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "contentCreatorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeriesMovie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "trailerUrl" TEXT NOT NULL,
    "isPremiering" BOOLEAN NOT NULL DEFAULT false,
    "price" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "seriesMovieId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "trailerUrl" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "seasonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMovieWatchLater" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "singleMovieId" INTEGER NOT NULL,
    "seriesMovieId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMovieWatchLater_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPremieringMoviePurchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "singleMovieId" INTEGER NOT NULL,
    "seriesMovieSeasonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPremieringMoviePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPackage" (
    "id" SERIAL NOT NULL,
    "name" "PackageName" NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "price" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscriptionPackage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subscriptionPackageId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscriptionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GenreToSeriesMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_LanguageToSeriesMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentCreator_userId_key" ON "ContentCreator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscriptionPackage_userId_key" ON "UserSubscriptionPackage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_GenreToSeriesMovie_AB_unique" ON "_GenreToSeriesMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_GenreToSeriesMovie_B_index" ON "_GenreToSeriesMovie"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LanguageToSeriesMovie_AB_unique" ON "_LanguageToSeriesMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_LanguageToSeriesMovie_B_index" ON "_LanguageToSeriesMovie"("B");

-- AddForeignKey
ALTER TABLE "ContentCreator" ADD CONSTRAINT "ContentCreator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SingleMovie" ADD CONSTRAINT "SingleMovie_contentCreatorId_fkey" FOREIGN KEY ("contentCreatorId") REFERENCES "ContentCreator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesMovie" ADD CONSTRAINT "SeriesMovie_contentCreatorId_fkey" FOREIGN KEY ("contentCreatorId") REFERENCES "ContentCreator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_seriesMovieId_fkey" FOREIGN KEY ("seriesMovieId") REFERENCES "SeriesMovie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMovieWatchLater" ADD CONSTRAINT "UserMovieWatchLater_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMovieWatchLater" ADD CONSTRAINT "UserMovieWatchLater_singleMovieId_fkey" FOREIGN KEY ("singleMovieId") REFERENCES "SingleMovie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMovieWatchLater" ADD CONSTRAINT "UserMovieWatchLater_seriesMovieId_fkey" FOREIGN KEY ("seriesMovieId") REFERENCES "SeriesMovie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPremieringMoviePurchase" ADD CONSTRAINT "UserPremieringMoviePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPremieringMoviePurchase" ADD CONSTRAINT "UserPremieringMoviePurchase_singleMovieId_fkey" FOREIGN KEY ("singleMovieId") REFERENCES "SingleMovie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPremieringMoviePurchase" ADD CONSTRAINT "UserPremieringMoviePurchase_seriesMovieSeasonId_fkey" FOREIGN KEY ("seriesMovieSeasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptionPackage" ADD CONSTRAINT "UserSubscriptionPackage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptionPackage" ADD CONSTRAINT "UserSubscriptionPackage_subscriptionPackageId_fkey" FOREIGN KEY ("subscriptionPackageId") REFERENCES "SubscriptionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToSeriesMovie" ADD CONSTRAINT "_GenreToSeriesMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToSeriesMovie" ADD CONSTRAINT "_GenreToSeriesMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "SeriesMovie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToSeriesMovie" ADD CONSTRAINT "_LanguageToSeriesMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToSeriesMovie" ADD CONSTRAINT "_LanguageToSeriesMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "SeriesMovie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
