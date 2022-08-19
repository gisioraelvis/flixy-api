import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSeriesMovieDto } from './dto/create-series-movie.dto';
import { UpdateSeriesMovieDto } from './dto/update-series-movie.dto';
import {
  commaSeparatedStringToArray,
  stripAndHyphenate,
} from 'src/utils/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieFileType, Prisma, SeriesMovie } from '@prisma/client';
import { PublicFileService } from 'src/s3-public-file/public-file.service';
import { PrivateFileService } from 'src/s3-private-file/private-file.service';
import { S3 } from 'aws-sdk';

@Injectable()
export class SeriesMovieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicFileService: PublicFileService,
    private readonly privateFileService: PrivateFileService,
  ) {}

  /**
   * Save Genre if it doesn't already exist
   * @param name - genre name
   * @returns {Promise<Genre>} - Genre
   */
  private async preloadGenresByName(name: string): Promise<any> {
    const existingGenre = await this.prisma.genre.findFirst({
      where: { name },
    });
    if (existingGenre) {
      return existingGenre;
    }
    const newGenre = await this.prisma.genre.create({
      data: { name },
    });
    return newGenre;
  }

  /**
   * Save Language if it doesn't already exist
   * @param name - language name
   * @returns {Promise<any>} - Language
   */
  private async preloadLanguagesByName(name: string): Promise<any> {
    const existingLanguage = await this.prisma.language.findFirst({
      where: { name },
    });
    if (existingLanguage) {
      return existingLanguage;
    }

    const newLanguage = await this.prisma.language.create({
      data: { name },
    });
    return newLanguage;
  }

  /**
   * Create a new series movie
   * @param createSeriesMovieDto
   * @returns {Promise<any>}
   */
  async create(
    userId: number,
    createSeriesMovieDto: CreateSeriesMovieDto,
    files: any[],
  ): Promise<any> {
    // get the contentCreatorId using the userId
    const contentCreator = await this.prisma.contentCreator.findUnique({
      where: { userId },
      select: { id: true },
    });

    // check if user is an admin or a content creator - i.e allowed to upload movies
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user.isContentCreator) {
      throw new UnauthorizedException(
        `User id #${userId} is not authorized to upload movies`,
      );
    }

    // check for movie files
    const poster = files.find((file) => file.fieldname === 'poster');
    const trailer = files.find((file) => file.fieldname === 'trailer');

    // movie files urls
    let posterUploadResult: S3.ManagedUpload.SendData,
      trailerUploadResult: S3.ManagedUpload.SendData;
    try {
      // poster is provided
      if (poster) {
        const posterOriginalname = stripAndHyphenate(poster.originalname);
        posterUploadResult = await this.publicFileService.uploadMovieFile(
          posterOriginalname,
          poster.buffer,
        );
      }

      // trailer is provided
      if (trailer) {
        const trailerOriginalname = stripAndHyphenate(trailer.originalname);
        trailerUploadResult = await this.publicFileService.uploadMovieFile(
          trailerOriginalname,
          trailer.buffer,
        );
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Error saving series movie files: ${e.message}`,
      );
    }

    // parse genres from string to array
    const genresArray = commaSeparatedStringToArray(
      createSeriesMovieDto.genres,
    );

    // save genres
    const genresArrayObj = await Promise.all(
      genresArray.map((name) => this.preloadGenresByName(name)),
    );

    // parse languages from string to array
    const languagesArray = commaSeparatedStringToArray(
      createSeriesMovieDto.languages,
    );
    // save languages
    const languagesArrayObj = await Promise.all(
      languagesArray.map((name) => this.preloadLanguagesByName(name)),
    );

    // if any of the files was provided and uploaded successfully get the appropriate value
    // otherwise set to undefined
    const posterS3Url = posterUploadResult ? posterUploadResult.Location : null;

    const trailerS3Url = trailerUploadResult
      ? trailerUploadResult.Location
      : null;

    // create and save the new movie
    const newSeriesMovie = await this.prisma.seriesMovie.create({
      data: {
        ...createSeriesMovieDto,
        genres: { connect: genresArrayObj.map((genre) => ({ id: genre.id })) },
        languages: {
          connect: languagesArrayObj.map((lang) => ({ id: lang.id })),
        },
        posterUrl: posterS3Url,
        trailerUrl: trailerS3Url,
        contentCreator: { connect: { id: contentCreator.id } },
      },
      include: { genres: true, languages: true },
    });

    // if the poster was uploaded save the s3 key to db
    if (poster) {
      await this.prisma.seriesMovieFiles.create({
        data: {
          fileKey: posterUploadResult.Key,
          fileType: MovieFileType.POSTER,
          seriesMovie: { connect: { id: newSeriesMovie.id } },
        },
      });
    }

    // if the trailer was uploaded save the s3 key to db
    if (trailer) {
      await this.prisma.seriesMovieFiles.create({
        data: {
          fileKey: trailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
          seriesMovie: { connect: { id: newSeriesMovie.id } },
        },
      });
    }

    return newSeriesMovie;
  }

  /**
   * Return all SeriesMovies, takes pagination and search parameters
   * @param paginationQuery - pagination query
   * @returns {Promise<any[]>}
   */
  // TODO: filter based on isReleased
  async findAll(paginationQuery: {
    offset?: number;
    limit?: number;
    cursor?: Prisma.SeriesMovieWhereUniqueInput;
    where?: Prisma.SeriesMovieScalarWhereInput;
    orderBy?: Prisma.SeriesMovieOrderByWithRelationInput;
  }): Promise<SeriesMovie[]> {
    const { offset, limit, cursor, where, orderBy } = paginationQuery;

    return await this.prisma.seriesMovie.findMany({
      skip: offset,
      take: limit,
      cursor,
      where,
      orderBy,
      include: { genres: true, languages: true },
    });
  }

  /**
   * Find a seriesMovie by id
   * @param id - seriesMovie id
   * @returns {Promise<SeriesMovie>}
   */
  async findOneById(id: number): Promise<SeriesMovie> {
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id },
      include: { genres: true, languages: true, seasons: true },
    });
    if (!seriesMovie) {
      throw new NotFoundException(`SeriesMovie with id #${id} does not exist`);
    }
    return seriesMovie;
  }

  /**
   * Find seriesMovie by title
   * @param title - seriesMovie title
   * @returns {Promise<SeriesMovie[]>}
   */
  async findByTitle(title: string): Promise<SeriesMovie[]> {
    const seriesMovie = await this.prisma.seriesMovie.findMany({
      where: { title: { contains: title } },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `No Series Movie with title "${title}" was found`,
      );
    }
    return seriesMovie;
  }

  /**
   * Update seriesMovie details
   * @param id - seriesMovie id
   * @param updateSeriesMovieDto
   * @returns {Promise<SeriesMovie>} - updated seriesMovie
   *
   * For both :-
   * 1. Incremental movie upload i.e upload the movie files individually
   * If this is a new movie incremental upload,
   * i.e the movie files poster, trailer, video are being uploaded individualy
   * then the files don't exist yet in s3. Hence no deletes are needed.
   *
   * 2. Update movie details
   * If this is an update to an already existing movie,
   * the movie files(poster, trailer) should be deleted from s3 before uploading any new one.
   */
  async update(
    id: number,
    updateSeriesMovieDto: UpdateSeriesMovieDto,
    files: any[],
  ): Promise<SeriesMovie> {
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id },
      include: { genres: true, languages: true, seriesMovieFiles: true },
    });
    if (!seriesMovie) {
      throw new NotFoundException(`SeriesMovie with id #${id} does not exist`);
    }

    const { genres, languages } = updateSeriesMovieDto;

    // if genres are updated
    if (genres) {
      const genresArray = commaSeparatedStringToArray(genres);
      const genresArrayObj =
        updateSeriesMovieDto.genres &&
        (await Promise.all(
          genresArray.map((name) => this.preloadGenresByName(name)),
        ));

      updateSeriesMovieDto.genres = genresArrayObj;
    }

    // if languages are updated
    if (languages) {
      const languagesArray = commaSeparatedStringToArray(languages);
      const languagesArrayObj =
        updateSeriesMovieDto.languages &&
        (await Promise.all(
          languagesArray.map((name) => this.preloadLanguagesByName(name)),
        ));

      updateSeriesMovieDto.languages = languagesArrayObj;
    }

    // if newposter is provided
    // delete the old poster and save the new one
    const poster = files.find((file) => file.fieldname === 'poster');
    let newPosterUploadResult: S3.ManagedUpload.SendData;
    if (poster) {
      // find the current poster key
      const currentPoster = seriesMovie.seriesMovieFiles.find(
        (file) => file.fileType === MovieFileType.POSTER,
      );
      try {
        // For movie update case
        // If exists delete current poster from db and s3.
        if (currentPoster) {
          await this.prisma.seriesMovieFiles.delete({
            where: { fileKey: currentPoster.fileKey },
          });

          await this.publicFileService.deleteMovieFile(currentPoster.fileKey);
        }
      } catch (e) {
        throw new InternalServerErrorException(
          `Error deleting current poster from s3: ${e.message}`,
        );
      }

      const newPoster = files.find((file) => file.fieldname === 'poster');
      const newPosterOriginalname = stripAndHyphenate(newPoster.originalname);
      try {
        newPosterUploadResult = await this.publicFileService.uploadMovieFile(
          newPosterOriginalname,
          newPoster.buffer,
        );
      } catch (e) {
        throw new InternalServerErrorException(
          `Error uploading new poster to s3: ${e.message}`,
        );
      }
      updateSeriesMovieDto.posterUrl = newPosterUploadResult.Location;
    }

    // if newtrailer is provided
    // delete the old trailer and save the new one
    const trailer = files.find((file) => file.fieldname === 'trailer');
    let newTrailerUploadResult: S3.ManagedUpload.SendData;
    if (trailer) {
      const currentTrailer = seriesMovie.seriesMovieFiles.find(
        (file) => file.fileType === MovieFileType.TRAILER,
      );
      try {
        // For movie update case
        // If exists delete current trailer from db and s3
        if (currentTrailer) {
          await this.prisma.seriesMovieFiles.delete({
            where: { fileKey: currentTrailer.fileKey },
          });

          await this.publicFileService.deleteMovieFile(currentTrailer.fileKey);
        }
      } catch (e) {
        throw new InternalServerErrorException(
          `Error deleting current trailer from s3: ${e.message}`,
        );
      }
      const newTrailer = files.find((file) => file.fieldname === 'trailer');
      const newTrailerOriginalname = stripAndHyphenate(newTrailer.originalname);
      try {
        newTrailerUploadResult = await this.publicFileService.uploadMovieFile(
          newTrailerOriginalname,
          newTrailer.buffer,
        );
      } catch (e) {
        throw new InternalServerErrorException(
          `Error uploading new trailer to s3: ${e.message}`,
        );
      }
      updateSeriesMovieDto.trailerUrl = newTrailerUploadResult.Location;
    }

    // get the current movie genres
    const currentGenres = seriesMovie.genres.map((genre) => genre.id);

    // if any of the curent genre is removed, disconnect it from the movie
    if (currentGenres) {
      const genreIdsToRemove = currentGenres.filter(
        (genre) =>
          !updateSeriesMovieDto.genres.map((genre) => genre.id).includes(genre),
      );

      if (genreIdsToRemove.length > 0) {
        await this.prisma.seriesMovie.update({
          where: { id },
          data: {
            genres: {
              disconnect: genreIdsToRemove.map((id) => ({ id })), // Transorms array of ids to array of objects with id property e.g [{ id: 1 },{ id: 3 }, { id: 2 }]
            },
          },
        });
      }
    }

    // get the current movie languages
    const currentLanguages = seriesMovie.languages.map((lang) => lang.id);

    // if any of the curent language is removed, disconnect it from the movie
    if (currentLanguages) {
      const languageIdsToRemove = currentLanguages.filter(
        (lang) =>
          !updateSeriesMovieDto.languages.map((lang) => lang.id).includes(lang),
      );

      if (languageIdsToRemove.length > 0) {
        await this.prisma.seriesMovie.update({
          where: { id },
          data: {
            languages: {
              disconnect: languageIdsToRemove.map((id) => ({ id })),
            },
          },
        });
      }
    }

    const updatedSeriesMovie = await this.prisma.seriesMovie.update({
      where: { id },
      data: {
        ...updateSeriesMovieDto,
        genres: {
          connect: updateSeriesMovieDto.genres.map((genre) => ({
            id: genre.id,
          })),
        },
        languages: {
          connect: updateSeriesMovieDto.languages.map((lang) => ({
            id: lang.id,
          })),
        },
      },
      include: { genres: true, languages: true },
    });

    // if the poster was uploaded save the s3 key to db
    if (poster) {
      await this.prisma.seriesMovieFiles.create({
        data: {
          fileKey: newPosterUploadResult.Key,
          fileType: MovieFileType.POSTER,
          seriesMovie: { connect: { id: updatedSeriesMovie.id } },
        },
      });
    }

    // if the trailer was uploaded save the s3 key to db
    if (trailer) {
      await this.prisma.seriesMovieFiles.create({
        data: {
          fileKey: newTrailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
          seriesMovie: { connect: { id: updatedSeriesMovie.id } },
        },
      });
    }

    return updatedSeriesMovie;
  }

  /**
   * Delete SeriesMovie
   * @param seriesMovieId
   * @returns {Promise<any>}
   */
  async remove(seriesMovieId: number): Promise<any> {
    // TODO: Restrict to only Admin & Content creator(ownerId)
    //  Only admin and movie owner(content creator) should be allowed to delete a movie
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: {
        seriesMovieFiles: true,
        seasons: {
          include: {
            seriesSeasonFiles: true,
            episodes: { include: { seasonEpisodeFiles: true } },
          },
        },
      },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie id #${seriesMovieId} does not exist`,
      );
    }

    // delete all the files associated with the SeriesMovie if any exists
    // it's possible that the SeriesMovie, Seasons or Episodes don't have any files
    // associated with them so we need to check for each one
    // i.e
    // - all the SeriesMovieFiles - poster and trailer
    // - all the SeasonFiles - poster and trailer
    // - all the EpisodeFiles - poster, trailer and video

    // delete all the SeriesMovieFiles from s3 if any exists
    if (seriesMovie.seriesMovieFiles.length > 0) {
      await Promise.all(
        seriesMovie.seriesMovieFiles.map(async (file) => {
          // the files are public
          await this.publicFileService.deleteMovieFile(file.fileKey);
        }),
      );
    }

    // delete all the SeasonFiles from s3 if any exists
    if (seriesMovie.seasons.length > 0) {
      await Promise.all(
        // array of SeriesMovie seasons
        seriesMovie.seasons.map(async (season) => {
          if (season.seriesSeasonFiles.length > 0) {
            await Promise.all(
              // array of SeasonFiles
              season.seriesSeasonFiles.map(async (file) => {
                // the files are public
                await this.publicFileService.deleteMovieFile(file.fileKey);
              }),
            );
          }
        }),
      );
    }

    // delete all the EpisodeFiles from s3 - the poster and trailer are public files
    // the videos are private files, filter them and use privateFileService to delete them
    if (seriesMovie.seasons.length > 0) {
      await Promise.all(
        // array of SeriesMovie seasons
        seriesMovie.seasons.map(async (season) => {
          if (season.episodes.length > 0) {
            await Promise.all(
              // array of Episodes
              season.episodes.map(async (episode) => {
                if (episode.seasonEpisodeFiles.length > 0) {
                  await Promise.all(
                    // array of EpisodeFiles
                    episode.seasonEpisodeFiles.map(async (file) => {
                      if (file.fileType === MovieFileType.VIDEO) {
                        // the video files are private
                        await this.privateFileService.deleteMovieFile(
                          file.fileKey,
                        );
                      } else {
                        // the poster and trailer files are public
                        await this.publicFileService.deleteMovieFile(
                          file.fileKey,
                        );
                      }
                    }),
                  );
                }
              }),
            );
          }
        }),
      );
    }

    // delete SeriesMovie and all its associated tables from db
    await this.prisma.seriesMovie.delete({
      where: { id: seriesMovieId },
    });

    return {
      statusCode: 200,
      message: `SeriesMovie id #${seriesMovieId} deleted`,
    };
  }
}
