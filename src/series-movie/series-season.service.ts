import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateSeriesSeasonDto } from './dto/create-series-movie.dto';
import { UpdateSeriesSeasonDto } from './dto/update-series-movie.dto';
import { stripAndHyphenate } from 'src/utils/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieFileType, SeriesSeason } from '@prisma/client';
import { PublicFileService } from 'src/s3-public-file/public-file.service';
import { S3 } from 'aws-sdk';

@Injectable()
export class SeriesSeasonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicFileService: PublicFileService,
  ) {}

  /**
   * Create a new series season
   * @param userId
   * @param seriesMovieId
   * @param createSeriesSeasonDto
   * @param files - the movie files array i.e poster and trailer
   * @returns {Promise<SeriesSeason>}
   */
  async create(
    userId: number,
    seriesMovieId: number,
    createSeriesSeasonDto: CreateSeriesSeasonDto,
    files: any[],
  ): Promise<SeriesSeason> {
    // TODO: Authorization - Admin/Content creator only
    // check if user is an admin or a content creator - i.e allowed to upload movies
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user.isContentCreator) {
      throw new UnauthorizedException(
        `User with id #${userId} is not authorized to upload movies`,
      );
    }

    // get series movie and check if it exists
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: { seasons: true },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie with id #${seriesMovieId} does not exist`,
      );
    }

    // using series number on createSeriesSeasonDto
    // check if season already exists on the current series movie
    const seriesSeason = seriesMovie.seasons.find(
      (season) => season.seasonNumber === createSeriesSeasonDto.seasonNumber,
    );
    if (seriesSeason) {
      throw new ConflictException(
        `Season ${createSeriesSeasonDto.seasonNumber} already exists on SeriesMovie id #${seriesMovieId}`,
      );
    }

    // check for season files
    const poster = files.find((file) => file.fieldname === 'poster');
    const trailer = files.find((file) => file.fieldname === 'trailer');

    // season files urls
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

    // if any of the files was provided and uploaded successfully get the appropriate value
    // otherwise set to undefined
    const posterS3Url = posterUploadResult ? posterUploadResult.Location : null;

    const trailerS3Url = trailerUploadResult
      ? trailerUploadResult.Location
      : null;

    // save new series season
    const newSeriesSeason = await this.prisma.seriesSeason.create({
      data: {
        ...createSeriesSeasonDto,
        posterUrl: posterS3Url,
        trailerUrl: trailerS3Url,
        seriesMovie: { connect: { id: seriesMovie.id } },
      },
    });

    // if the poster was uploaded save the s3 key to db
    if (poster) {
      await this.prisma.seriesSeasonFiles.create({
        data: {
          fileKey: posterUploadResult.Key,
          fileType: MovieFileType.POSTER,
          seriesSeason: { connect: { id: newSeriesSeason.id } },
        },
      });
    }

    // if the trailer was uploaded save the s3 key to db
    if (trailer) {
      await this.prisma.seriesSeasonFiles.create({
        data: {
          fileKey: trailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
          seriesSeason: { connect: { id: newSeriesSeason.id } },
        },
      });
    }

    return newSeriesSeason;
  }

  /**
   * Find a series season by id
   * @param seriesMovieId
   * @param seasonId
   * @returns {Promise<SeriesSeason>}
   */
  async findOneById(
    seriesMovieId: number,
    seasonId: number,
  ): Promise<SeriesSeason> {
    // check if series movie exists
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: { seasons: true },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie with id #${seriesMovieId} does not exist`,
      );
    }

    // check if current seriesMovie has seasonId provided
    const seriesSeason = seriesMovie.seasons.find(
      (season) => season.id === seasonId,
    );
    if (!seriesSeason) {
      throw new NotFoundException(
        `SeriesSeason with id #${seasonId} does not exist on SeriesMovie with id #${seriesMovieId}`,
      );
    }

    return seriesSeason;
  }

  /**
   * Find series season by title
   * @param title - series season title
   * @returns {Promise<SeriesSeason[]>}
   */
  async findByTitle(title: string): Promise<SeriesSeason[]> {
    const seriesSeason = await this.prisma.seriesSeason.findMany({
      where: { title: { contains: title } },
    });
    if (!seriesSeason) {
      throw new NotFoundException(
        `No Series Movie Season with title "${title}" was found`,
      );
    }
    return seriesSeason;
  }

  /**
   * Find series season by number
   * @param seriesMovieId
   * @param seriesSeasonNumber
   * @returns {Promise<SeriesSeason>}
   */
  async findByNumber(
    seriesMovieId: number,
    seriesSeasonNumber: number,
  ): Promise<SeriesSeason> {
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: { seasons: true },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `Series Movie with id ${seriesMovieId} does not exist`,
      );
    }

    const seriesSeason = seriesMovie.seasons.find(
      (season) => season.seasonNumber === seriesSeasonNumber,
    );

    return seriesSeason;
  }

  /**
   * Update series season details
   * @param seriesMovieId
   * @param seasonId
   * @param updateSeriesSeasonDto
   * @returns {Promise<SeriesSeason>} - updated series season
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
    seriesMovieId: number,
    seasonId: number,
    updateSeriesSeasonDto: UpdateSeriesSeasonDto,
    files: any[],
  ): Promise<SeriesSeason> {
    // check if the seriesMovieId exists
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: { seasons: { include: { seriesSeasonFiles: true } } },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `Series Movie with id #${seriesMovieId} does not exist`,
      );
    }

    // check if the seasonId exists on the current series movie
    const seriesSeason = seriesMovie.seasons.find(
      (season) => season.id === seasonId,
    );
    if (!seriesSeason) {
      throw new NotFoundException(
        `Series Season with id #${seasonId} does not exist`,
      );
    }

    // if newposter is provided
    // delete the old poster and save the new one
    const poster = files.find((file) => file.fieldname === 'poster');
    let newPosterUploadResult: S3.ManagedUpload.SendData;
    if (poster) {
      // find the current poster key
      const currentPoster = seriesSeason.seriesSeasonFiles.find(
        (file) => file.fileType === MovieFileType.POSTER,
      );
      try {
        // For movie update case
        // If exists delete current poster from db and s3.
        if (currentPoster) {
          await this.prisma.seriesSeasonFiles.delete({
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
      updateSeriesSeasonDto.posterUrl = newPosterUploadResult.Location;
    }

    // if newtrailer is provided
    // delete the old trailer and save the new one
    const trailer = files.find((file) => file.fieldname === 'trailer');
    let newTrailerUploadResult: S3.ManagedUpload.SendData;
    if (trailer) {
      const currentTrailer = seriesSeason.seriesSeasonFiles.find(
        (file) => file.fileType === MovieFileType.TRAILER,
      );
      try {
        // For movie update case
        // If exists delete current trailer from db and s3
        if (currentTrailer) {
          await this.prisma.seriesSeasonFiles.delete({
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
      updateSeriesSeasonDto.trailerUrl = newTrailerUploadResult.Location;
    }

    const updatedSeriesSeason = await this.prisma.seriesSeason.update({
      where: { id: seasonId },
      data: {
        ...updateSeriesSeasonDto,
      },
    });

    // if the poster was uploaded save the s3 key to db
    if (poster) {
      await this.prisma.seriesSeasonFiles.create({
        data: {
          seriesSeasonId: updatedSeriesSeason.id,
          fileKey: newPosterUploadResult.Key,
          fileType: MovieFileType.POSTER,
        },
      });
    }

    // if the trailer was uploaded save the s3 key to db
    if (trailer) {
      await this.prisma.seriesSeasonFiles.create({
        data: {
          seriesSeasonId: updatedSeriesSeason.id,
          fileKey: newTrailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
        },
      });
    }

    return updatedSeriesSeason;
  }

  /**
   * Delete Series Season
   * @param seriesMovieId
   * @param seasonId
   * @returns {Promise<any>}
   */
  async remove(seriesMovieId: number, seasonId: number): Promise<any> {
    // TODO: Restrict to only Admin & Content creator(ownerId)
    //  Only admin and movie owner(content creator) should be allowed to delete a movie

    // check if the seriesMovieId exists
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: { seasons: { include: { seriesSeasonFiles: true } } },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie id #${seriesMovieId} does not exist`,
      );
    }

    // check if the seasonId exists on the current series movie
    const seriesSeason = seriesMovie.seasons.find(
      (season) => season.id === seasonId,
    );
    if (!seriesSeason) {
      throw new NotFoundException(
        `SeriesSeason id #${seasonId} does not exist on SeriesMovie id #${seriesMovieId}`,
      );
    }

    // get the public season files i.e poster and trailer
    const publicSeriesSeasonFiles = seriesSeason.seriesSeasonFiles;

    try {
      // It's possible that the season has no public files yet, hence need to check
      // delete all the season files from s3
      if (publicSeriesSeasonFiles.length > 0) {
        await Promise.all(
          publicSeriesSeasonFiles.map((file) =>
            this.publicFileService.deleteMovieFile(file.fileKey),
          ),
        );
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Error deleting Season files from s3: ${e.message}`,
      );
    }

    // delete Series Season and all its associated tables from db
    await this.prisma.seriesSeason.delete({
      where: { id: seasonId },
    });

    return {
      statusCode: 200,
      message: `Season ${seriesSeason.seasonNumber} deleted successfully`,
    };
  }
}
