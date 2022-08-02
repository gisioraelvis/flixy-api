import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Repository } from 'typeorm';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import { Genre } from './entities/genre.entity';
import { Language } from './entities/language.entity';
import { SingleMovie } from './entities/single-movie.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import {
  commaSeparatedStringToArray,
  stripAndHyphenate,
} from 'src/utils/utils';
import { PathLike } from 'fs';

@Injectable()
export class SingleMoviesService {
  constructor(
    @InjectRepository(SingleMovie)
    private readonly singleMovieRepository: Repository<SingleMovie>,
    @InjectRepository(Genre)
    private readonly genresRepository: Repository<Genre>,
    @InjectRepository(Language)
    private readonly languagesRepository: Repository<Language>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Save Genre if it doesn't already exist
   * @param name - genre name
   * @returns {Promise<Genre>} - Genre
   */
  private async preloadGenresByName(name: string): Promise<Genre> {
    const existingGenre = await this.genresRepository.findOne({ name });
    if (existingGenre) {
      return existingGenre;
    }
    return this.genresRepository.create({ name });
  }

  /**
   * Save Language if it doesn't already exist
   * @param name - language name
   * @returns {Promise<Language>} - Language
   */
  private async preloadLanguagesByName(name: string): Promise<Language> {
    const existingLanguage = await this.languagesRepository.findOne({ name });
    if (existingLanguage) {
      return existingLanguage;
    }
    return this.languagesRepository.create({ name });
  }

  /**
   * Create a new singleMovie
   * @param createSingleMovieDto - new singleMovie
   * @returns {Promise<SingleMovie>} - created singleMovie
   */
  async create(
    createSingleMovieDto: CreateSingleMovieDto,
    files: any[],
  ): Promise<SingleMovie> {
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
    const newSingleMovie = this.singleMovieRepository.create({
      ...createSingleMovieDto,
      genres: genresArrayObj,
      languages: languagesArrayObj,
      poster_url: posterPath,
      trailer_url: trailerPath,
      video_url: videoPath,
      files_folder: newSingleMovieFolder,
    });
    await this.singleMovieRepository.save(newSingleMovie);
    return newSingleMovie;
  }

  /**
   * Return all SingleMovies or paginated
   * @param paginationQuery - pagination query
   * @returns {Promise<SingleMovie[]>} - all SingleMovies
   */
  async findAll(paginationQuery: PaginationQueryDto): Promise<SingleMovie[]> {
    const { limit, offset } = paginationQuery;
    return await this.singleMovieRepository.find({
      relations: ['genres', 'languages'],
      take: limit,
      skip: offset,
    });
  }

  /**
   * Find a singleMovie by id
   * @param id - singleMovie id
   * @returns {Promise<SingleMovie>} - SingleMovie
   */
  async findOne(id: number): Promise<SingleMovie> {
    const singleMovie = await this.singleMovieRepository.findOne(id);
    if (!singleMovie) {
      throw new NotFoundException(`SingleMovie with id ${id} not found`);
    }
    return singleMovie;
  }

  /**
   * Find singleMovie by title
   * @param title - singleMovie title
   * @returns {Promise<SingleMovie>} - SingleMovie
   */
  async findByTitle(title: string): Promise<SingleMovie> {
    const singleMovie = await this.singleMovieRepository.findOne({
      where: { title },
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
   * @returns {Promise<SingleMovie | any>} - updated singleMovie
   */
  async update(
    id: number,
    updateSingleMovieDto: UpdateSingleMovieDto,
    files: any[],
  ): Promise<SingleMovie> {
    const singleMovie = await this.singleMovieRepository.findOne(id);
    if (!singleMovie) {
      throw new NotFoundException(`SingleMovie with id ${id} does not exist`);
    }

    // Even if the movie title is changed, retain the old folder name
    // to avoid having to update the files_folder, poster_url, trailer_url and video_url

    const { genres, languages } = updateSingleMovieDto;

    // if genres are updated
    let genresArray: any[];
    if (genres) {
      genresArray = commaSeparatedStringToArray(genres);

      const genresArrayObj =
        updateSingleMovieDto.genres &&
        (await Promise.all(
          genresArray.map((name) => this.preloadGenresByName(name)),
        ));

      updateSingleMovieDto.genres = genresArrayObj;
    }

    // if languages are updated
    let languagesArray: any[];
    if (languages) {
      languagesArray = commaSeparatedStringToArray(languages);
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
      const oldPoster = singleMovie.poster_url;
      try {
        await fs.unlink(oldPoster);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting old poster from disk',
        );
      }

      const poster = files.find((file) => file.fieldname === 'poster');
      const posterOriginalname = stripAndHyphenate(poster.originalname);
      const posterPath = `${singleMovie.files_folder}/${poster.fieldname}-${posterOriginalname}`;
      try {
        await fs.writeFile(posterPath, poster.buffer);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error saving new poster to disk',
        );
      }
      updateSingleMovieDto.poster_url = posterPath;
    }

    // if newtrailer is provided
    // delete the old trailer and save the new one
    if (files.find((file) => file.fieldname === 'trailer')) {
      const oldTrailer = singleMovie.trailer_url;
      try {
        fs.unlink(oldTrailer);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting old trailer from disk',
        );
      }
      const trailer = files.find((file) => file.fieldname === 'trailer');
      const trailerOriginalname = stripAndHyphenate(trailer.originalname);
      const trailerPath = `${singleMovie.files_folder}/${trailer.fieldname}-${trailerOriginalname}`;
      try {
        await fs.writeFile(trailerPath, trailer.buffer);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error saving new trailer to disk',
        );
      }
      updateSingleMovieDto.trailer_url = trailerPath;
    }

    // if new video is provided
    // delete the old video and save the new one
    if (files.find((file) => file.fieldname === 'video')) {
      const oldVideo = singleMovie.video_url;
      try {
        await fs.unlink(oldVideo);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error deleting old video from disk',
        );
      }
      const video = files.find((file) => file.fieldname === 'video');
      const videoOriginalname = stripAndHyphenate(video.originalname);
      const videoPath = `${singleMovie.files_folder}/${video.fieldname}-${videoOriginalname}`;
      try {
        await fs.writeFile(videoPath, video.buffer);
      } catch (error) {
        throw new InternalServerErrorException(
          'Error saving new video to disk',
        );
      }
      updateSingleMovieDto.video_url = videoPath;
    }

    // TODO: fix duplicates when updating genres and languages
    // update singleMovie
    const updatedSingleMovie = await this.singleMovieRepository.preload({
      id: +id,
      ...updateSingleMovieDto,
    });

    return await this.singleMovieRepository.save(updatedSingleMovie);
  }

  /**
   * Delete SingleMovie
   * @param id - SingleMovie id
   * @returns {Promise<any>} - deleted SingleMovie title
   */
  async remove(id: number): Promise<any> {
    const singleMovie = await this.singleMovieRepository.findOne(id);

    if (!singleMovie) {
      throw new NotFoundException(`Single Movie with id ${id} does not exist`);
    }

    const singleMoviesFolder = singleMovie.files_folder;

    // Raise exception if the singleMovie folder doesn't exist
    try {
      await fs.rm(singleMoviesFolder, { recursive: true });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting single movie folder from disk`,
      );
    }

    // delete singleMovie from the db
    await this.singleMovieRepository.delete(id);

    return { message: `${singleMovie.title} deleted` };
  }
}
