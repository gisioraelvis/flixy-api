import {
  ConflictException,
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
import * as fs from 'fs';

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

    // check if ./uploads/movies/single-movies/ folders exists - if not create them/it
    const singleMoviesFolder = this.configService.get('SINGLE_MOVIES_FOLDER');
    if (!fs.existsSync(singleMoviesFolder)) {
      fs.mkdirSync(singleMoviesFolder, { recursive: true });
    }

    const { title } = createSingleMovieDto;
    // create new folder in SINGLE_MOVIES_FOLDER with current date-time and movie title
    //if it exists, throw ConflictException
    const currentDateTime = new Date().toISOString();
    const folderName = `${currentDateTime}-${title}`;
    const newSingleMovieFolder = `${singleMoviesFolder}/${folderName}`;
    if (!fs.existsSync(newSingleMovieFolder)) {
      fs.mkdirSync(newSingleMovieFolder);
    } else {
      throw new ConflictException(`${title} folder already exists`);
    }

    // get the movie files(poster, trailer, video) from the files array
    // if any doesn't exist, raise a not exception
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
    const posterNameOnDisk = `${poster.fieldname}-${poster.originalname}`;
    const posterPath = `${newSingleMovieFolder}/${posterNameOnDisk}`;
    fs.writeFileSync(posterPath, poster.buffer);

    const trailerPath = `${newSingleMovieFolder}/${trailer.fieldname}-${trailer.originalname}`;
    fs.writeFileSync(trailerPath, trailer.buffer);

    const videoPath = `${newSingleMovieFolder}/${video.fieldname}-${video.originalname}`;
    fs.writeFileSync(videoPath, video.buffer);

    // parse genres and languages from string to array
    const { genres, languages } = createSingleMovieDto;
    const genresArray = genres.split(',').map((genre) => genre.trim());
    const languagesArray = languages
      .split(',')
      .map((language) => language.trim());

    // save genres
    const genresId = await Promise.all(
      genresArray.map((name) => this.preloadGenresByName(name)),
    );

    // save languages
    const languagesId = await Promise.all(
      languagesArray.map((name) => this.preloadLanguagesByName(name)),
    );

    // create and save the new singleMovie
    const newSingleMovie = this.singleMovieRepository.create({
      ...createSingleMovieDto,
      genres: genresId,
      languages: languagesId,
      poster_name: posterNameOnDisk,
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
      throw new NotFoundException(`SingleMovie with title ${title} not found`);
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
      throw new NotFoundException(`SingleMovie with id ${id} not found`);
    }
    const { genres, languages } = updateSingleMovieDto;

    // parse genres and languages from string to array
    let genresArray: any[];
    // if genres is not empty, parse it to array
    if (genres) {
      genresArray = genres.split(',').map((genre) => genre.trim());
    }
    let languagesArray: any[];
    // if languages is not empty, parse it to array
    if (languages) {
      languagesArray = languages.split(',').map((language) => language.trim());
    }

    // update genres if any were provided
    const genresId =
      updateSingleMovieDto.genres &&
      (await Promise.all(
        genresArray.map((name) => this.preloadGenresByName(name)),
      ));

    // update languages if any were provided
    const languagesId =
      updateSingleMovieDto.languages &&
      (await Promise.all(
        languagesArray.map((name) => this.preloadLanguagesByName(name)),
      ));

    // if newposter is provided
    // delete the old poster and save the new one
    if (files.find((file) => file.fieldname === 'poster')) {
      const oldPoster = `${singleMovie.files_folder}/${singleMovie.poster_name}`;
      console.log(oldPoster);
      try {
        fs.unlinkSync(oldPoster);
      } catch (error) {
        throw new InternalServerErrorException('Error deleting old poster');
      }

      const poster = files.find((file) => file.fieldname === 'poster');
      const newPosterNameOnDisk = `${poster.fieldname}-${poster.originalname}`;
      const posterPath = `${singleMovie.files_folder}/${newPosterNameOnDisk}`;
      fs.writeFileSync(posterPath, poster.buffer);
      updateSingleMovieDto.poster_name = newPosterNameOnDisk;
    }

    // if newtrailer is provided
    // delete the old trailer and save the new one
    if (files.find((file) => file.fieldname === 'trailer')) {
      const oldTrailer = singleMovie.trailer_url;
      try {
        fs.unlinkSync(oldTrailer);
      } catch (error) {
        throw new InternalServerErrorException('Error deleting old trailer');
      }
      const trailer = files.find((file) => file.fieldname === 'trailer');
      const trailerPath = `${singleMovie.files_folder}/${trailer.fieldname}-${trailer.originalname}`;
      fs.writeFileSync(trailerPath, trailer.buffer);
      updateSingleMovieDto.trailer_url = trailerPath;
    }

    // if newvideo is provided
    // delete the old video and save the new one
    if (files.find((file) => file.fieldname === 'video')) {
      const oldVideo = singleMovie.video_url;
      try {
        fs.unlinkSync(oldVideo);
      } catch (error) {
        throw new InternalServerErrorException('Error deleting old video');
      }
      const video = files.find((file) => file.fieldname === 'video');
      const videoPath = `${singleMovie.files_folder}/${video.fieldname}-${video.originalname}`;
      fs.writeFileSync(videoPath, video.buffer);
      updateSingleMovieDto.video_url = videoPath;
    }

    const singleMoviesFolder = this.configService.get('SINGLE_MOVIES_FOLDER');
    // if the movie title is changed update the folder name
    if (updateSingleMovieDto.title !== singleMovie.title) {
      const oldFolder = singleMovie.files_folder;
      console.log(oldFolder);
      const currentDateTime = new Date().toISOString();
      const folderName = `${currentDateTime}-${updateSingleMovieDto.title}`;
      const newFolder = `${singleMoviesFolder}/${folderName}`;
      fs.renameSync(oldFolder, newFolder);
      updateSingleMovieDto.files_folder = newFolder;
      console.log(newFolder);
    }
    // update singleMovie
    const updatedSingleMovie = await this.singleMovieRepository.preload({
      id: +id,
      ...updateSingleMovieDto,
      genres: genresId,
      languages: languagesId,
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
    console.log(singleMoviesFolder);

    // Raise exception if the singleMovie folder doesn't exist
    if (!fs.existsSync(singleMoviesFolder)) {
      throw new NotFoundException(`${singleMovie.title} folder not found`);
    } else {
      fs.rm(singleMoviesFolder, { recursive: true }, (err) => {
        if (err) {
          throw new InternalServerErrorException(
            `Error deleting ${singleMovie.title} folder`,
          );
        }
      });
    }

    // delete singleMovie from database
    await this.singleMovieRepository.delete(id);

    return { message: `${singleMovie.title} deleted` };
  }
}
