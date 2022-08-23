/*
  Warnings:

  - You are about to drop the column `trailerUrl` on the `SeasonEpisode` table. All the data in the column will be lost.
  - You are about to drop the column `trailerUrl` on the `SeriesMovie` table. All the data in the column will be lost.
  - You are about to drop the column `trailerUrl` on the `SeriesSeason` table. All the data in the column will be lost.
  - You are about to drop the column `trailerUrl` on the `SingleMovie` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SeasonEpisode" DROP COLUMN "trailerUrl";

-- AlterTable
ALTER TABLE "SeriesMovie" DROP COLUMN "trailerUrl",
ADD COLUMN     "trailerKey" TEXT;

-- AlterTable
ALTER TABLE "SeriesSeason" DROP COLUMN "trailerUrl",
ADD COLUMN     "trailerKey" TEXT;

-- AlterTable
ALTER TABLE "SingleMovie" DROP COLUMN "trailerUrl",
ADD COLUMN     "trailerKey" TEXT;
