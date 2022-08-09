import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import {
  commaSeparatedStringToArray,
  stripAndHyphenate,
} from 'src/utils/utils';
import { PathLike } from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, SingleMovie } from '@prisma/client';

@Injectable()
export class SingleMoviesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
    createSingleMovieDto: CreateSingleMovieDto,
    files: any[],
  ): Promise<any> {
    // check that files array is not empty or undefined
    // files must be provided
    if (!files || files.length === 0) {
      throw new NotFoundException(
        'Poster, Trailer and Video files are required',
      );
    }

    // Get the single movies directory path from env
    const singleMoviesFolder = this.configService.get('SINGLE_MOVIES_FOLDER');
    try {
      // create folder
      await fs.mkdir(singleMoviesFolder, { recursive: true });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating single movies folder`,
      );
    }

    // create new folder in SINGLE_MOVIES_FOLDER with current date-time and movie title
    const currentDateTime = new Date().toISOString();
    const title = stripAndHyphenate(createSingleMovieDto.title);
    const folderName = `${currentDateTime}-${title}`;
    const newSingleMovieFolder = `${singleMoviesFolder}/${folderName}`;
    try {
      await fs.mkdir(newSingleMovieFolder);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error creating new single movies folder',
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

    // save files in the newSingleMovieFolder using their fieldname and originalname as filename
    let posterPath: PathLike | fs.FileHandle;
    let trailerPath: PathLike | fs.FileHandle;
    let videoPath: PathLike | fs.FileHandle;
    try {
      const posterOriginalname = stripAndHyphenate(poster.originalname);
      posterPath = `${newSingleMovieFolder}/${poster.fieldname}-${posterOriginalname}`;
      await fs.writeFile(posterPath, poster.buffer);

      const trailerOriginalname = stripAndHyphenate(trailer.originalname);
      trailerPath = `${newSingleMovieFolder}/${trailer.fieldname}-${trailerOriginalname}`;
      await fs.writeFile(trailerPath, trailer.buffer);

      const videoOriginalname = stripAndHyphenate(video.originalname);
      videoPath = `${newSingleMovieFolder}/${video.fieldname}-${videoOriginalname}`;
      await fs.writeFile(videoPath, video.buffer);
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
        posterUrl: posterPath,
        trailerUrl: trailerPath,
        videoUrl: videoPath,
        filesFolder: newSingleMovieFolder,
      },
      include: { genres: true, languages: true },
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
      include: { genres: true, languages: true },
    });
    if (!singleMovie) {
      throw new NotFoundException(`SingleMovie with id ${id} does not exist`);
    }

    // Even if the movie title is changed, retain the old folder name
    // to avoid having to update the files_folder, poster_url, trailer_url and video_url

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
      const oldPoster = singleMovie.posterUrl;
      try {
        await fs.unlink(oldPoster);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting old poster from disk',
        );
      }

      const poster = files.find((file) => file.fieldname === 'poster');
      const posterOriginalname = stripAndHyphenate(poster.originalname);
      const posterPath = `${singleMovie.filesFolder}/${poster.fieldname}-${posterOriginalname}`;
      try {
        await fs.writeFile(posterPath, poster.buffer);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error saving new poster to disk',
        );
      }
      updateSingleMovieDto.posterUrl = posterPath;
    }

    // if newtrailer is provided
    // delete the old trailer and save the new one
    if (files.find((file) => file.fieldname === 'trailer')) {
      const oldTrailer = singleMovie.trailerUrl;
      try {
        fs.unlink(oldTrailer);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting old trailer from disk',
        );
      }
      const trailer = files.find((file) => file.fieldname === 'trailer');
      const trailerOriginalname = stripAndHyphenate(trailer.originalname);
      const trailerPath = `${singleMovie.filesFolder}/${trailer.fieldname}-${trailerOriginalname}`;
      try {
        await fs.writeFile(trailerPath, trailer.buffer);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error saving new trailer to disk',
        );
      }
      updateSingleMovieDto.trailerUrl = trailerPath;
    }

    // if new video is provided
    // delete the old video and save the new one
    if (files.find((file) => file.fieldname === 'video')) {
      const oldVideo = singleMovie.videoUrl;
      try {
        await fs.unlink(oldVideo);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting old video from disk',
        );
      }
      const video = files.find((file) => file.fieldname === 'video');
      const videoOriginalname = stripAndHyphenate(video.originalname);
      const videoPath = `${singleMovie.filesFolder}/${video.fieldname}-${videoOriginalname}`;
      try {
        await fs.writeFile(videoPath, video.buffer);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error saving new video to disk',
        );
      }
      updateSingleMovieDto.videoUrl = videoPath;
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
    const singleMovie = await this.prisma.singleMovie.findUnique({
      where: { id },
    });
    if (!singleMovie) {
      throw new NotFoundException(`Single Movie with id ${id} does not exist`);
    }

    const singleMoviesFolder = singleMovie.filesFolder;

    // Raise exception if the singleMovie folder doesn't exist
    try {
      await fs.rm(singleMoviesFolder, { recursive: true });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting single movie folder from disk`,
      );
    }

    // delete singleMovie from the db
    await this.prisma.singleMovie.delete({ where: { id } });

    return { statusCode: 200, message: `${singleMovie.title} deleted` };
  }
}
