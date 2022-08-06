-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "isEmailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT NOT NULL,
    "isPhoneNumberConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isContentCreator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateFile" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicFile" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SingleMovie" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "trailerUrl" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "filesFolder" TEXT NOT NULL,
    "isPremiering" BOOLEAN NOT NULL DEFAULT false,
    "price" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likeDislikeId" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SingleMovie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'debug',
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GenreToSingleMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_LanguageToSingleMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateFile_key_key" ON "PrivateFile"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PublicFile_url_key" ON "PublicFile"("url");

-- CreateIndex
CREATE UNIQUE INDEX "PublicFile_key_key" ON "PublicFile"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_GenreToSingleMovie_AB_unique" ON "_GenreToSingleMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_GenreToSingleMovie_B_index" ON "_GenreToSingleMovie"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LanguageToSingleMovie_AB_unique" ON "_LanguageToSingleMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_LanguageToSingleMovie_B_index" ON "_LanguageToSingleMovie"("B");

-- AddForeignKey
ALTER TABLE "PrivateFile" ADD CONSTRAINT "PrivateFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicFile" ADD CONSTRAINT "PublicFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToSingleMovie" ADD CONSTRAINT "_GenreToSingleMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToSingleMovie" ADD CONSTRAINT "_GenreToSingleMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "SingleMovie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToSingleMovie" ADD CONSTRAINT "_LanguageToSingleMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToSingleMovie" ADD CONSTRAINT "_LanguageToSingleMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "SingleMovie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
