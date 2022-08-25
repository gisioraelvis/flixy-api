/*
  Warnings:

  - The `price` column on the `SeriesSeason` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `price` column on the `SingleMovie` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `UserPremieringMoviePurchase` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `price` on the `SubscriptionPackage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "UserPremieringMoviePurchase" DROP CONSTRAINT "UserPremieringMoviePurchase_seriesMovieSeasonId_fkey";

-- DropForeignKey
ALTER TABLE "UserPremieringMoviePurchase" DROP CONSTRAINT "UserPremieringMoviePurchase_singleMovieId_fkey";

-- DropForeignKey
ALTER TABLE "UserPremieringMoviePurchase" DROP CONSTRAINT "UserPremieringMoviePurchase_userId_fkey";

-- AlterTable
ALTER TABLE "SeriesSeason" DROP COLUMN "price",
ADD COLUMN     "price" INTEGER;

-- AlterTable
ALTER TABLE "SingleMovie" DROP COLUMN "price",
ADD COLUMN     "price" INTEGER;

-- AlterTable
ALTER TABLE "SubscriptionPackage" DROP COLUMN "price",
ADD COLUMN     "price" INTEGER NOT NULL;

-- DropTable
DROP TABLE "UserPremieringMoviePurchase";

-- CreateTable
CREATE TABLE "UserPremieringSingleMoviePurchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "singleMovieId" INTEGER NOT NULL,
    "mpesaReceiptNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPremieringSingleMoviePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPremieringSeriesMovieSeasonPurchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "seriesMovieSeasonId" INTEGER NOT NULL,
    "mpesaReceiptNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPremieringSeriesMovieSeasonPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPremieringSingleMoviePurchase" ADD CONSTRAINT "UserPremieringSingleMoviePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPremieringSingleMoviePurchase" ADD CONSTRAINT "UserPremieringSingleMoviePurchase_singleMovieId_fkey" FOREIGN KEY ("singleMovieId") REFERENCES "SingleMovie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPremieringSeriesMovieSeasonPurchase" ADD CONSTRAINT "UserPremieringSeriesMovieSeasonPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPremieringSeriesMovieSeasonPurchase" ADD CONSTRAINT "UserPremieringSeriesMovieSeasonPurchase_seriesMovieSeasonI_fkey" FOREIGN KEY ("seriesMovieSeasonId") REFERENCES "SeriesSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
