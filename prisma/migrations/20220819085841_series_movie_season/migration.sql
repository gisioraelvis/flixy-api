/*
  Warnings:

  - You are about to drop the column `number` on the `SeasonEpisode` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `SeriesSeason` table. All the data in the column will be lost.
  - Added the required column `episodeNumber` to the `SeasonEpisode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seasonNumber` to the `SeriesSeason` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SeasonEpisode" DROP COLUMN "number",
ADD COLUMN     "episodeNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SeriesSeason" DROP COLUMN "number",
ADD COLUMN     "seasonNumber" INTEGER NOT NULL;
