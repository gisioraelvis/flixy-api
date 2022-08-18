/*
  Warnings:

  - You are about to drop the `Episode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Season` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Episode" DROP CONSTRAINT "Episode_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "Season" DROP CONSTRAINT "Season_seriesMovieId_fkey";

-- DropForeignKey
ALTER TABLE "UserPremieringMoviePurchase" DROP CONSTRAINT "UserPremieringMoviePurchase_seriesMovieSeasonId_fkey";

-- AlterTable
ALTER TABLE "SeriesMovie" ADD COLUMN     "filesFolder" TEXT,
ADD COLUMN     "isReleased" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "posterUrl" DROP NOT NULL,
ALTER COLUMN "trailerUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SingleMovie" ALTER COLUMN "isPremiering" SET DEFAULT true,
ALTER COLUMN "price" DROP NOT NULL;

-- DropTable
DROP TABLE "Episode";

-- DropTable
DROP TABLE "Season";

-- CreateTable
CREATE TABLE "SeriesMovieFiles" (
    "id" SERIAL NOT NULL,
    "seriesMovieId" INTEGER NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileType" "MovieFileType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeriesMovieFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesSeason" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "posterUrl" TEXT,
    "trailerUrl" TEXT,
    "filesFolder" TEXT,
    "isPremiering" BOOLEAN NOT NULL DEFAULT false,
    "price" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "seriesMovieId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeriesSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesSeasonFiles" (
    "id" SERIAL NOT NULL,
    "seriesSeasonId" INTEGER NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileType" "MovieFileType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeriesSeasonFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonEpisode" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "posterUrl" TEXT,
    "trailerUrl" TEXT,
    "videoKey" TEXT,
    "filesFolder" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "seasonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonEpisodeFiles" (
    "id" SERIAL NOT NULL,
    "seasonEpisodeId" INTEGER NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileType" "MovieFileType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonEpisodeFiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeriesMovieFiles_fileKey_key" ON "SeriesMovieFiles"("fileKey");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesSeasonFiles_fileKey_key" ON "SeriesSeasonFiles"("fileKey");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonEpisodeFiles_fileKey_key" ON "SeasonEpisodeFiles"("fileKey");

-- AddForeignKey
ALTER TABLE "SeriesMovieFiles" ADD CONSTRAINT "SeriesMovieFiles_seriesMovieId_fkey" FOREIGN KEY ("seriesMovieId") REFERENCES "SeriesMovie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesSeason" ADD CONSTRAINT "SeriesSeason_seriesMovieId_fkey" FOREIGN KEY ("seriesMovieId") REFERENCES "SeriesMovie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesSeasonFiles" ADD CONSTRAINT "SeriesSeasonFiles_seriesSeasonId_fkey" FOREIGN KEY ("seriesSeasonId") REFERENCES "SeriesSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonEpisode" ADD CONSTRAINT "SeasonEpisode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "SeriesSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonEpisodeFiles" ADD CONSTRAINT "SeasonEpisodeFiles_seasonEpisodeId_fkey" FOREIGN KEY ("seasonEpisodeId") REFERENCES "SeasonEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPremieringMoviePurchase" ADD CONSTRAINT "UserPremieringMoviePurchase_seriesMovieSeasonId_fkey" FOREIGN KEY ("seriesMovieSeasonId") REFERENCES "SeriesSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
