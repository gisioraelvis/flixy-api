-- CreateTable
CREATE TABLE "genre" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_0285d4f1655d080cfcf7d1ab141" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_cc0a99e710eb3733f6fb42b1d4c" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" VARCHAR NOT NULL DEFAULT 'debug',
    "message" VARCHAR NOT NULL,
    "level" VARCHAR NOT NULL,

    CONSTRAINT "PK_350604cbdf991d5930d9e618fbd" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_file" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR NOT NULL,
    "ownerId" INTEGER,

    CONSTRAINT "PK_6ef35c8eae2d9df2959ef4227de" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_file" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR NOT NULL,
    "key" VARCHAR NOT NULL,

    CONSTRAINT "PK_bf2f5ba5aa6e3453b04cb4e4720" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "single_movie" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL,
    "duration" VARCHAR NOT NULL,
    "poster_url" VARCHAR NOT NULL,
    "trailer_url" VARCHAR NOT NULL,
    "video_url" VARCHAR NOT NULL,
    "files_folder" VARCHAR NOT NULL,
    "is_premiering" BOOLEAN NOT NULL DEFAULT false,
    "price" VARCHAR NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "like_dislike_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PK_fda5fa70e002b98a4f6f12f37c0" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "single_movie_genres_genre" (
    "singleMovieId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "PK_212796c042ded71f1843665316f" PRIMARY KEY ("singleMovieId","genreId")
);

-- CreateTable
CREATE TABLE "single_movie_languages_language" (
    "singleMovieId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,

    CONSTRAINT "PK_da6162452fbcad5a15a8ce06608" PRIMARY KEY ("singleMovieId","languageId")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR NOT NULL,
    "isEmailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" VARCHAR NOT NULL,
    "isPhoneNumberConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "password" VARCHAR NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "googleId" VARCHAR,
    "facebookId" VARCHAR,
    "verificationToken" VARCHAR,
    "isAdult" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isContentCreator" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDX_97ae92558104bdb34b75c399d4" ON "single_movie_genres_genre"("genreId");

-- CreateIndex
CREATE INDEX "IDX_b9b6d53323f4c3b8cf0d2438e3" ON "single_movie_genres_genre"("singleMovieId");

-- CreateIndex
CREATE INDEX "IDX_29331259e6d340526fc090eceb" ON "single_movie_languages_language"("languageId");

-- CreateIndex
CREATE INDEX "IDX_cff71e694193e7a3710c6e155f" ON "single_movie_languages_language"("singleMovieId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e22" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_f2578043e491921209f5dadd080" ON "user"("phoneNumber");

-- AddForeignKey
ALTER TABLE "private_file" ADD CONSTRAINT "FK_8be88cd116f2dd3f4fe7e10302c" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "single_movie_genres_genre" ADD CONSTRAINT "FK_97ae92558104bdb34b75c399d45" FOREIGN KEY ("genreId") REFERENCES "genre"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "single_movie_genres_genre" ADD CONSTRAINT "FK_b9b6d53323f4c3b8cf0d2438e3a" FOREIGN KEY ("singleMovieId") REFERENCES "single_movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "single_movie_languages_language" ADD CONSTRAINT "FK_29331259e6d340526fc090ecebf" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "single_movie_languages_language" ADD CONSTRAINT "FK_cff71e694193e7a3710c6e155fa" FOREIGN KEY ("singleMovieId") REFERENCES "single_movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
