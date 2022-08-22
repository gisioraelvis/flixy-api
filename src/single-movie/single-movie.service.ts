import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import {
  commaSeparatedStringToArray,
  stripAndHyphenate,
} from 'src/utils/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieFileType, Prisma, SingleMovie } from '@prisma/client';
import { PrivateFileService } from 'src/s3-private-file/private-file.service';
import { PublicFileService } from 'src/s3-public-file/public-file.service';
import { S3 } from 'aws-sdk';

@Injectable()
export class SingleMovieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privateFileService: PrivateFileService,
    private readonly publicFileService: PublicFileService,
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
   * Create a new singleMovie
   * @param createSingleMovieDto - new singleMovie
   * @returns {Promise<any>} - created singleMovie
   */
  async create(
    userId: number,
    createSingleMovieDto: CreateSingleMovieDto,
    files: any[],
  ): Promise<any> {
    // TODO: Authorization check - Admin/ContentCreator

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

    // get for movie files
    const poster = files.find((file) => file.fieldname === 'poster');
    const trailer = files.find((file) => file.fieldname === 'trailer');
    const video = files.find((file) => file.fieldname === 'video');

    // movie files urls
    let posterUploadResult: S3.ManagedUpload.SendData,
      trailerUploadResult: S3.ManagedUpload.SendData,
      videoUploadResult: S3.ManagedUpload.SendData;
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

      // video is provided
      if (video) {
        const videoOriginalname = stripAndHyphenate(video.originalname);
        videoUploadResult = await this.privateFileService.uploadMovieFile(
          videoOriginalname,
          video.buffer,
        );
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Error saving single movie files: ${e.message}`,
      );
    }

    // parse genres from string to array
    const genresArray = commaSeparatedStringToArray(
      createSingleMovieDto.genres,
    );

    // save genres
    const genresArrayObj = await Promise.all(
      genresArray.map((name) => this.preloadGenresByName(name)),
    );

    // parse languages from string to array
    const languagesArray = commaSeparatedStringToArray(
      createSingleMovieDto.languages,
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
    const videoS3Key = videoUploadResult ? videoUploadResult.Key : undefined;

    // create and save the new singleMovie
    const newSingleMovie = await this.prisma.singleMovie.create({
      data: {
        ...createSingleMovieDto,
        genres: { connect: genresArrayObj.map((genre) => ({ id: genre.id })) },
        languages: {
          connect: languagesArrayObj.map((lang) => ({ id: lang.id })),
        },
        posterUrl: posterS3Url,
        trailerUrl: trailerS3Url,
        videoKey: videoS3Key,
        contentCreator: { connect: { id: contentCreator.id } },
      },
      include: { genres: true, languages: true },
    });

    // if the poster was uploaded save the s3 key to db
    if (poster) {
      await this.prisma.singleMovieFiles.create({
        data: {
          singleMovieId: newSingleMovie.id,
          fileKey: posterUploadResult.Key,
          fileType: MovieFileType.POSTER,
        },
      });
    }

    // if the trailer was uploaded save the s3 key to db
    if (trailer) {
      await this.prisma.singleMovieFiles.create({
        data: {
          singleMovieId: newSingleMovie.id,
          fileKey: trailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
        },
      });
    }

    // if the video was uploaded save the s3 key to db
    if (video) {
      await this.prisma.singleMovieFiles.create({
        data: {
          singleMovieId: newSingleMovie.id,
          fileKey: videoUploadResult.Key,
          fileType: MovieFileType.VIDEO,
        },
      });
    }

    return newSingleMovie;
  }

  /**
   * Return all SingleMovies or paginated
   * @param paginationQuery - pagination query
   * @returns {Promise<any[]>} - all SingleMovies
   */
  async findAll(paginationQuery: {
    offset?: number;
    limit?: number;
    cursor?: Prisma.SingleMovieWhereUniqueInput;
    where?: Prisma.SingleMovieScalarWhereInput;
    orderBy?: Prisma.SingleMovieOrderByWithRelationInput;
  }): Promise<SingleMovie[]> {
    const { offset, limit, cursor, where, orderBy } = paginationQuery;

    return await this.prisma.singleMovie.findMany({
      skip: offset,
      take: limit,
      cursor,
      where,
      orderBy,
      include: { genres: true, languages: true },
    });
  }

  /**
   * Find a singleMovie by id
   * @param singleMovieId
   * @returns {Promise<any>} - SingleMovie
   */
  async findOne(singleMovieId: number): Promise<any> {
    const singleMovie = await this.prisma.singleMovie.findUnique({
      where: { id: singleMovieId },
      include: { genres: true, languages: true },
    });
    if (!singleMovie) {
      throw new NotFoundException(`SingleMovie id #${singleMovieId} not found`);
    }
    return singleMovie;
  }

  /**
   * Find singleMovie by title
   * @param title - singleMovie title
   * @returns {Promise<any>} - SingleMovie
   */
  async findByTitle(title: string): Promise<SingleMovie[]> {
    const singleMovie = await this.prisma.singleMovie.findMany({
      where: { title: { contains: title } },
    });
    if (!singleMovie) {
      throw new NotFoundException(`No Movie with title "${title}" was found`);
    }
    return singleMovie;
  }

  /**
   * Update singleMovie details
   * @param singleMovieId
   * @param updateSingleMovieDto
   * @returns {Promise<any>} - updated singleMovie
   *
   * For both :-
   * 1. Incremental movie upload i.e upload the movie files individually
   * If this is a new movie incremental upload,
   * i.e the movie files poster, trailer, video are being uploaded individualy
   * then the files don't exist yet in s3. Hence no deletes are needed.
   *
   * 2. Update movie details
   * If this is an update to an already existing movie,
   * the movie files(poster, trailer, video) should be deleted from s3 before uploading any new one.
   */
  async update(
    singleMovieId: number,
    updateSingleMovieDto: UpdateSingleMovieDto,
    files: any[],
  ): Promise<SingleMovie> {
    const singleMovie = await this.prisma.singleMovie.findUnique({
      where: { id: singleMovieId },
      include: { genres: true, languages: true, singleMovieFiles: true },
    });
    if (!singleMovie) {
      throw new NotFoundException(
        `SingleMovie id #${singleMovieId} does not exist`,
      );
    }

    const { genres, languages } = updateSingleMovieDto;

    // if genres are updated
    if (genres) {
      const genresArray = commaSeparatedStringToArray(genres);
      const genresArrayObj =
        updateSingleMovieDto.genres &&
        (await Promise.all(
          genresArray.map((name) => this.preloadGenresByName(name)),
        ));

      updateSingleMovieDto.genres = genresArrayObj;
    }

    // if languages are updated
    if (languages) {
      const languagesArray = commaSeparatedStringToArray(languages);
      const languagesArrayObj =
        updateSingleMovieDto.languages &&
        (await Promise.all(
          languagesArray.map((name) => this.preloadLanguagesByName(name)),
        ));

      updateSingleMovieDto.languages = languagesArrayObj;
    }

    // if newposter is provided
    // delete the old poster and save the new one
    const poster = files.find((file) => file.fieldname === 'poster');
    let newPosterUploadResult: S3.ManagedUpload.SendData;
    if (poster) {
      // find the current poster key
      const currentPoster = singleMovie.singleMovieFiles.find(
        (file) => file.fileType === MovieFileType.POSTER,
      );
      try {
        // For movie update case
        // If exists delete current poster from db and s3.
        if (currentPoster) {
          await this.prisma.singleMovieFiles.delete({
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
      updateSingleMovieDto.posterUrl = newPosterUploadResult.Location;
    }

    // if newtrailer is provided
    // delete the old trailer and save the new one
    const trailer = files.find((file) => file.fieldname === 'trailer');
    let newTrailerUploadResult: S3.ManagedUpload.SendData;
    if (trailer) {
      const currentTrailer = singleMovie.singleMovieFiles.find(
        (file) => file.fileType === MovieFileType.TRAILER,
      );
      try {
        // For movie update case
        // If exists delete current trailer from db and s3
        if (currentTrailer) {
          await this.prisma.singleMovieFiles.delete({
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
      updateSingleMovieDto.trailerUrl = newTrailerUploadResult.Location;
    }

    // if new video is provided
    // delete the old video and save the new one
    const video = files.find((file) => file.fieldname === 'video');
    let newVideoUploadResult: S3.ManagedUpload.SendData;
    if (video) {
      const currentVideoKey = singleMovie.videoKey;
      try {
        // For movie update case
        // If exists delete current video from s3
        if (currentVideoKey) {
          await this.prisma.singleMovieFiles.delete({
            where: { fileKey: currentVideoKey },
          });

          await this.privateFileService.deleteMovieFile(currentVideoKey);
        }
      } catch (e) {
        throw new InternalServerErrorException(
          `Error deleting current video from s3: ${e.message}`,
        );
      }

      const newVideo = files.find((file) => file.fieldname === 'video');
      const newVideoOriginalname = stripAndHyphenate(newVideo.originalname);
      try {
        // the video is stored as a private s3 file
        newVideoUploadResult = await this.privateFileService.uploadMovieFile(
          newVideoOriginalname,
          newVideo.buffer,
        );
      } catch (e) {
        throw new InternalServerErrorException(
          `Error saving new video to disk: ${e.message}`,
        );
      }
      updateSingleMovieDto.videoKey = newVideoUploadResult.Key;
    }

    // get the current movie genres
    const currentGenres = singleMovie.genres.map((genre) => genre.id);

    // if any of the curent genre is removed, disconnect it from the movie
    if (currentGenres) {
      const genreIdsToRemove = currentGenres.filter(
        (genre) =>
          !updateSingleMovieDto.genres.map((genre) => genre.id).includes(genre),
      );

      if (genreIdsToRemove.length > 0) {
        await this.prisma.singleMovie.update({
          where: { id: singleMovie.id },
          data: {
            genres: {
              disconnect: genreIdsToRemove.map((id) => ({ id })), // Transorms array of ids to array of objects with id property e.g [{ id: 1 },{ id: 3 }, { id: 2 }]
            },
          },
        });
      }
    }

    // get the current movie languages
    const currentLanguages = singleMovie.languages.map((lang) => lang.id);

    // if any of the curent language is removed, disconnect it from the movie
    if (currentLanguages) {
      const languageIdsToRemove = currentLanguages.filter(
        (lang) =>
          !updateSingleMovieDto.languages.map((lang) => lang.id).includes(lang),
      );

      if (languageIdsToRemove.length > 0) {
        await this.prisma.singleMovie.update({
          where: { id: singleMovie.id },
          data: {
            languages: {
              disconnect: languageIdsToRemove.map((id) => ({ id })),
            },
          },
        });
      }
    }

    const updatedSingleMovie = await this.prisma.singleMovie.update({
      where: { id: singleMovie.id },
      data: {
        ...updateSingleMovieDto,
        genres: {
          connect: updateSingleMovieDto.genres.map((genre) => ({
            id: genre.id,
          })),
        },
        languages: {
          connect: updateSingleMovieDto.languages.map((lang) => ({
            id: lang.id,
          })),
        },
      },
      include: { genres: true, languages: true },
    });

    // if the poster was uploaded save the s3 key to db
    if (poster) {
      await this.prisma.singleMovieFiles.create({
        data: {
          singleMovieId: updatedSingleMovie.id,
          fileKey: newPosterUploadResult.Key,
          fileType: MovieFileType.POSTER,
        },
      });
    }

    // if the trailer was uploaded save the s3 key to db
    if (trailer) {
      await this.prisma.singleMovieFiles.create({
        data: {
          singleMovieId: updatedSingleMovie.id,
          fileKey: newTrailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
        },
      });
    }

    // if the video was uploaded save the s3 key to db
    if (video) {
      await this.prisma.singleMovieFiles.create({
        data: {
          singleMovieId: updatedSingleMovie.id,
          fileKey: newVideoUploadResult.Key,
          fileType: MovieFileType.VIDEO,
        },
      });
    }

    return updatedSingleMovie;
  }

  /**
   * Delete SingleMovie
   * @param singleMovieId
   * @returns {Promise<any>} - deleted SingleMovie title
   */
  async remove(singleMovieId: number): Promise<any> {
    // TODO: Restrict to only Admin & Content creator(ownerId)
    //  Only admin and movie owner(content creator) should be allowed to delete a movie
    const singleMovie = await this.prisma.singleMovie.findUnique({
      where: { id: singleMovieId },
      include: { singleMovieFiles: true },
    });
    if (!singleMovie) {
      throw new NotFoundException(
        `SingleMovie id #${singleMovieId} does not exist`,
      );
    }

    // get the public movie files i.e poster and trailer
    // Exclude video, because it is not public
    const publicMovieFiles = singleMovie.singleMovieFiles.filter(
      (file) => file.fileType !== MovieFileType.VIDEO,
    );

    try {
      // It's possible that the movie has no public files yet, hence need to check
      // delete all the single movies files from s3
      if (publicMovieFiles.length > 0) {
        await Promise.all(
          publicMovieFiles.map((file) =>
            this.publicFileService.deleteMovieFile(file.fileKey),
          ),
        );
      }

      // It's possible that the movie has no video file yet, hence need to check
      // delete the video file, a private file from s3
      if (singleMovie.videoKey) {
        await this.privateFileService.deleteMovieFile(singleMovie.videoKey);
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Error deleting single movie files from s3: ${e.message}`,
      );
    }

    // delete singleMovie and all its associations from db
    await this.prisma.singleMovie.delete({
      where: { id: singleMovieId },
    });

    return {
      statusCode: 200,
      message: `SingleMovie id #${singleMovieId} deleted successfully`,
    };
  }
}
