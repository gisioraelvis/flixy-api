import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Repository } from 'typeorm';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import { Genre } from './entities/genre.entity';
import { Language } from './entities/language.entity';
import { SingleMovie } from './entities/single-movie.entity';

@Injectable()
export class SingleMoviesService {
  constructor(
    @InjectRepository(SingleMovie)
    private readonly singleMovieRepository: Repository<SingleMovie>,
    @InjectRepository(Genre)
    private readonly genresRepository: Repository<Genre>,
    @InjectRepository(Language)
    private readonly languagesRepository: Repository<Language>,
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
  ): Promise<SingleMovie> {
    // save genres
    const genres = await Promise.all(
      createSingleMovieDto.genres.map((name) => this.preloadGenresByName(name)),
    );

    // save languages
    const languages = await Promise.all(
      createSingleMovieDto.languages.map((name) =>
        this.preloadLanguagesByName(name),
      ),
    );

    const newSingleMovie = this.singleMovieRepository.create({
      ...createSingleMovieDto,
      genres,
      languages,
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
  ): Promise<SingleMovie> {
    // update genres if any were provided
    const genres =
      updateSingleMovieDto.genres &&
      (await Promise.all(
        updateSingleMovieDto.genres.map((name) =>
          this.preloadGenresByName(name),
        ),
      ));

    // update languages if any were provided
    const languages =
      updateSingleMovieDto.languages &&
      (await Promise.all(
        updateSingleMovieDto.languages.map((name) =>
          this.preloadLanguagesByName(name),
        ),
      ));

    // update singleMovie
    const updatedSingleMovie = await this.singleMovieRepository.preload({
      id: +id,
      ...updateSingleMovieDto,
      genres,
      languages,
    });

    if (!updatedSingleMovie) {
      throw new NotFoundException(`SingleMovie with id ${id} not found`);
    }
    await this.singleMovieRepository.save(updatedSingleMovie);
    return updatedSingleMovie;
  }

  /**
   * Delete SingleMovie
   * @param id - SingleMovie id
   * @returns {Promise<any>} - deleted SingleMovie title
   */
  async remove(id: number): Promise<any> {
    const singleMovie = await this.singleMovieRepository.findOne(id);
    if (!singleMovie) {
      throw new NotFoundException(`SingleMovie with id ${id} not found`);
    }
    await this.singleMovieRepository.delete(id);
    return { message: `SingleMovie with id ${id} deleted` };
  }
}
