import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import * as fs from 'fs/promises';
import {
  commaSeparatedStringToArray,
  stripAndHyphenate,
} from 'src/utils/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieFileType, Prisma, SingleMovie } from '@prisma/client';
import { PrivateFileService } from 'src/s3-private-files/private-files.service';
import { PublicFilesService } from 'src/s3-public-files/public-files.service';
import { S3 } from 'aws-sdk';

@Injectable()
export class SingleMovieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privateFileService: PrivateFileService,
    private readonly publicFileService: PublicFilesService,
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
        `User with id ${userId} is not a content creator hence cannot upload movies`,
      );
    }

    // check that files array is not empty or undefined
    // files must be provided
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Poster, Trailer and Video files are required',
      );
    }

    // if poster or trailer or video file is not found, throw NotFoundException
    const poster = files.find((file) => file.fieldname === 'poster');
    if (!poster) {
      throw new NotFoundException('Poster not found');
    }
    const trailer = files.find((file) => file.fieldname === 'trailer');
    if (!trailer) {
      throw new NotFoundException('Trailer not found');
    }
    const video = files.find((file) => file.fieldname === 'video');
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // movie files urls
    let posterUploadResult: S3.ManagedUpload.SendData,
      trailerUploadResult: S3.ManagedUpload.SendData,
      videoUploadResult: S3.ManagedUpload.SendData;
    try {
      posterUploadResult = await this.publicFileService.uploadMovieFile(
        poster.fieldname,
        poster.buffer,
      );

      trailerUploadResult = await this.publicFileService.uploadMovieFile(
        trailer.fieldname,
        trailer.buffer,
      );

      videoUploadResult = await this.privateFileService.uploadMovieFile(
        video.fieldname,
        video.buffer,
      );
    } catch (error) {
      throw new InternalServerErrorException('Error saving single movie files');
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

    // create and save the new singleMovie
    const newSingleMovie = await this.prisma.singleMovie.create({
      data: {
        ...createSingleMovieDto,
        genres: { connect: genresArrayObj.map((genre) => ({ id: genre.id })) },
        languages: {
          connect: languagesArrayObj.map((lang) => ({ id: lang.id })),
        },
        posterUrl: posterUploadResult.Location,
        trailerUrl: trailerUploadResult.Location,
        videoKey: videoUploadResult.Key,
        contentCreator: { connect: { id: contentCreator.id } },
      },
      include: { genres: true, languages: true },
    });

    // save the movie files keys
    await this.prisma.singleMovieFiles.createMany({
      data: [
        {
          singleMovieId: newSingleMovie.id,
          fileKey: posterUploadResult.Key,
          fileType: MovieFileType.POSTER,
        },
        {
          singleMovieId: newSingleMovie.id,
          fileKey: trailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
        },
        {
          singleMovieId: newSingleMovie.id,
          fileKey: videoUploadResult.Key,
          fileType: MovieFileType.VIDEO,
        },
      ],
    });

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
   * @param id - singleMovie id
   * @returns {Promise<any>} - SingleMovie
   */
  async findOne(id: number): Promise<any> {
    const singleMovie = await this.prisma.singleMovie.findUnique({
      where: { id },
      include: { genres: true, languages: true },
    });
    if (!singleMovie) {
      throw new NotFoundException(`SingleMovie with id ${id} not found`);
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
      take: 10,
      where: { title: { contains: title } },
    });
    if (!singleMovie) {
      throw new NotFoundException(`movie with title ${title} does not exist`);
    }
    return singleMovie;
  }

  /**
   * Update singleMovie details
   * @param id - singleMovie id
   * @param updateSingleMovieDto
   * @returns {Promise<any>} - updated singleMovie
   */
  async update(
    id: number,
    updateSingleMovieDto: UpdateSingleMovieDto,
    files: any[],
  ): Promise<SingleMovie> {
    const singleMovie = await this.prisma.singleMovie.findUnique({
      where: { id },
      include: { genres: true, languages: true, singleMovieFiles: true },
    });
    if (!singleMovie) {
      throw new NotFoundException(`SingleMovie with id ${id} does not exist`);
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
    if (files.find((file) => file.fieldname === 'poster')) {
      // find the current poster key
      const currentPosterKey = singleMovie.singleMovieFiles.find(
        (file) => file.fileType === MovieFileType.POSTER,
      ).fileKey;
      try {
        // delete current poster from s3
        await this.publicFileService.deleteMovieFile(currentPosterKey);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting current poster from s3',
        );
      }

      const newPoster = files.find((file) => file.fieldname === 'poster');
      const newPosterOriginalname = stripAndHyphenate(newPoster.originalname);
      let newPosterUploadResult: S3.ManagedUpload.SendData;
      try {
        //await fs.writeFile(posterPath, poster.buffer);
        newPosterUploadResult = await this.publicFileService.uploadMovieFile(
          newPosterOriginalname,
          newPoster.buffer,
        );
      } catch (error) {
        throw new InternalServerErrorException(
          'Error uploading new poster to s3',
        );
      }
      updateSingleMovieDto.posterUrl = newPosterUploadResult.Location;
    }

    // if newtrailer is provided
    // delete the old trailer and save the new one
    if (files.find((file) => file.fieldname === 'trailer')) {
      const currentTrailerKey = singleMovie.singleMovieFiles.find(
        (file) => file.fileType === MovieFileType.TRAILER,
      ).fileKey;
      try {
        await this.publicFileService.deleteMovieFile(currentTrailerKey);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting current trailer from s3',
        );
      }
      const newTrailer = files.find((file) => file.fieldname === 'trailer');
      const newTrailerOriginalname = stripAndHyphenate(newTrailer.originalname);
      let newTrailerUploadResult: S3.ManagedUpload.SendData;
      try {
        newTrailerUploadResult = await this.publicFileService.uploadMovieFile(
          newTrailerOriginalname,
          newTrailer.buffer,
        );
      } catch (error) {
        throw new InternalServerErrorException(
          'Error saving new trailer to disk',
        );
      }
      updateSingleMovieDto.trailerUrl = newTrailerUploadResult.Location;
    }

    // if new video is provided
    // delete the old video and save the new one
    if (files.find((file) => file.fieldname === 'video')) {
      const curentVideoKey = singleMovie.videoKey;
      try {
        await this.privateFileService.deleteMovieFile(curentVideoKey);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting current video from s3',
        );
      }

      const newVideo = files.find((file) => file.fieldname === 'video');
      const newVideoOriginalname = stripAndHyphenate(newVideo.originalname);
      let newVideoUploadResult: S3.ManagedUpload.SendData;
      try {
        newVideoUploadResult = await this.privateFileService.uploadMovieFile(
          newVideoOriginalname,
          newVideo.buffer,
        );
      } catch (error) {
        throw new InternalServerErrorException(
          'Error saving new video to disk',
        );
      }
      updateSingleMovieDto.videoUrl = newVideoUploadResult.Key;
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
    const currentLanguages = singleMovie.languages.map((lang) => lang.id);

    // if any of the curent language is removed, disconnect it from the movie
    if (currentLanguages) {
      const languageIdsToRemove = currentLanguages.filter(
        (lang) =>
          !updateSingleMovieDto.languages.map((lang) => lang.id).includes(lang),
      );

      if (languageIdsToRemove.length > 0) {
        await this.prisma.singleMovie.update({
          where: { id },
          data: {
            languages: {
              disconnect: languageIdsToRemove.map((id) => ({ id })),
            },
          },
        });
      }
    }

    const updatedSingleMovie = await this.prisma.singleMovie.update({
      where: { id },
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

    return updatedSingleMovie;
  }

  /**
   * Delete SingleMovie
   * @param id - SingleMovie id
   * @returns {Promise<any>} - deleted SingleMovie title
   */
  async remove(id: number): Promise<any> {
    // TODO: Only admin and movie owner(content creator) should be allowed to delete a movie
    const singleMovie = await this.prisma.singleMovie.findUnique({
      where: { id },
      include: { singleMovieFiles: true },
    });
    if (!singleMovie) {
      throw new NotFoundException(`Single Movie with id ${id} does not exist`);
    }

    // get the public movie files i.e poster and trailer
    // Exclude video, because it is not public
    const publicMovieFiles = singleMovie.singleMovieFiles.filter(
      (file) => file.fileType !== MovieFileType.VIDEO,
    );

    try {
      // delete all the single movies files from s3
      await Promise.all(
        publicMovieFiles.map((file) =>
          this.publicFileService.deleteMovieFile(file.fileKey),
        ),
      );

      // delete the video file, a private file
      await this.privateFileService.deleteMovieFile(singleMovie.videoKey);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting single movie files from s3`,
      );
    }

    // delete singleMovie and all its associations from db
    await this.prisma.singleMovie.delete({
      where: { id },
    });

    return { statusCode: 200, message: `${singleMovie.title} deleted` };
  }
}
