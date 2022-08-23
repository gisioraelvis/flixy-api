import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateSeasonEpisodeDto } from './dto/create-series-movie.dto';
import { UpdateSeasonEpisodeDto } from './dto/update-series-movie.dto';
import { stripAndHyphenate } from 'src/utils/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieFileType, SeasonEpisode } from '@prisma/client';
import { PrivateFileService } from 'src/s3-private-file/private-file.service';
import { PublicFileService } from 'src/s3-public-file/public-file.service';
import { S3 } from 'aws-sdk';

@Injectable()
export class SeasonEpisodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privateFileService: PrivateFileService,
    private readonly publicFileService: PublicFileService,
  ) {}

  /**
   * Create a new Episode for a Season(seasonId) of SeriesMovie(seriesMovieId)
   * @param userId
   * @param seriesMovieId
   * @param seasonId
   * @param createSeasonEpisodeDto - new season episode
   * @param files - episode files to be uploaded to s3
   * @returns {Promise<SeasonEpisode>} - created season episode
   */
  async create(
    userId: number,
    seriesMovieId: number,
    seasonId: number,
    createSeasonEpisodeDto: CreateSeasonEpisodeDto,
    files: any[],
  ): Promise<SeasonEpisode> {
    //TODO: Authorization check - Admin or ContentCreator

    // check if user is an admin or a content creator - i.e allowed to upload movies
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user.isContentCreator) {
      throw new UnauthorizedException(
        `User id #${userId} is not authorized to upload movies`,
      );
    }

    // check if seriesMovieId exists and seasonId exists on the SeriesMovie
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: { seasons: { include: { episodes: true } } },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie id #${seriesMovieId} does not exist`,
      );
    }
    // check if seasonId exists on the seriesMovie
    const season = seriesMovie.seasons.find((s) => s.id === seasonId);
    if (!season) {
      throw new NotFoundException(
        `Season id #${seasonId} does not exist on SeriesMovie id #${seriesMovieId}`,
      );
    }

    // check if current Season already has an Episode with episodeNumber
    // episodeNumber is unique per season
    const episode = season.episodes.find(
      (e) => e.episodeNumber === createSeasonEpisodeDto.episodeNumber,
    );
    if (episode) {
      throw new ConflictException(
        `Episode ${createSeasonEpisodeDto.episodeNumber} already exists on Season ${season.seasonNumber}`,
      );
    }

    // get episode files
    const poster = files.find((file) => file.fieldname === 'poster');
    const video = files.find((file) => file.fieldname === 'video');

    // episode files urls
    let posterUploadResult: S3.ManagedUpload.SendData,
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
        `Error uploading SeasonEpisode files: ${e.message}`,
      );
    }

    // if any of the files was provided and uploaded successfully get the appropriate value
    // otherwise set to null

    // poster
    const posterS3Url = posterUploadResult ? posterUploadResult.Location : null;

    // video
    const videoS3Key = videoUploadResult ? videoUploadResult.Key : null;

    // create and save the new episode
    const newSeasonEpisode = await this.prisma.seasonEpisode.create({
      data: {
        ...createSeasonEpisodeDto,
        posterUrl: posterS3Url,
        videoKey: videoS3Key,
        season: { connect: { id: season.id } },
      },
    });

    // if the poster was uploaded save the s3 key to db
    if (poster) {
      await this.prisma.seasonEpisodeFiles.create({
        data: {
          fileKey: posterUploadResult.Key,
          fileType: MovieFileType.POSTER,
          seasonEpisode: { connect: { id: newSeasonEpisode.id } },
        },
      });
    }

    // if the video was uploaded save the s3 key to db
    if (video) {
      await this.prisma.seasonEpisodeFiles.create({
        data: {
          fileKey: videoUploadResult.Key,
          fileType: MovieFileType.VIDEO,
          seasonEpisode: { connect: { id: newSeasonEpisode.id } },
        },
      });
    }

    return newSeasonEpisode;
  }

  /**
   * Find all episodes for a given season
   * @param seriesMovieId
   * @param seasonId
   * @returns {Promise<SeasonEpisode[]>} - all episodes for a season
   */
  async findAllSeasonEpisodes(
    seriesMovieId: number,
    seasonId: number,
  ): Promise<SeasonEpisode[]> {
    // check if seriesMovieId exists and seasonId exists on the SeriesMovie
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: { seasons: { include: { episodes: true } } },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie id #${seriesMovieId} does not exist`,
      );
    }
    // check if seasonId exists on the seriesMovie
    const season = seriesMovie.seasons.find((s) => s.id === seasonId);
    if (!season) {
      throw new NotFoundException(
        `Season id #${seasonId} does not exist on SeriesMovie id #${seriesMovieId}`,
      );
    }
    return season.episodes;
  }

  /**
   * Find a SeasonEpisode by episodId
   * @param seriesMovieId
   * @param seasonId
   * @param episodeId
   * @returns {Promise<SeasonEpisode>} - SeasonEpisode
   */
  async findEpisodeById(
    seriesMovieId: number,
    seasonId: number,
    episodeId: number,
  ): Promise<SeasonEpisode> {
    // check if seriesMovieId exists and seasonId exists on the SeriesMovie
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: { seasons: { include: { episodes: true } } },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie id #${seriesMovieId} does not exist`,
      );
    }
    // check if seasonId exists on the seriesMovie
    const season = seriesMovie.seasons.find((s) => s.id === seasonId);
    if (!season) {
      throw new NotFoundException(
        `Season id #${seasonId} does not exist on SeriesMovie id #${seriesMovieId}`,
      );
    }
    // check if episodeId exists on the season
    const episode = season.episodes.find((e) => e.id === episodeId);
    if (!episode) {
      throw new NotFoundException(
        `Episode id #${episodeId} does not exist on Season id #${seasonId}`,
      );
    }
    return episode;
  }

  /**
   * Update a SeasonEpisode
   * @param seriesMovieId
   * @param seasonId
   * @param episodeId
   * @param updateSeasonEpisodeDto
   * @param files - episode files to upload/update
   * @returns {Promise<SeasonEpisode>} - updated season episode
   *
   * For both :-
   * 1. Incremental movie upload i.e upload the movie files individually
   * If this is a new movie incremental upload,
   * i.e the movie files poster, video are being uploaded individualy
   * then the files don't exist yet in s3. Hence no deletes are needed.
   *
   * 2. Update movie details
   * If this is an update to an already existing movie,
   * the movie files(poster, video) should be deleted from s3 before uploading any new one.
   */
  async update(
    seriesMovieId: number,
    seasonId: number,
    episodeId: number,
    updateSeasonEpisodeDto: UpdateSeasonEpisodeDto,
    files: any[],
  ): Promise<SeasonEpisode> {
    // check if seriesMovieId exists and seasonId exists on the SeriesMovie
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: {
        seasons: {
          include: { episodes: { include: { seasonEpisodeFiles: true } } },
        },
      },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie id #${seriesMovieId} does not exist`,
      );
    }

    // check if seasonId exists on the seriesMovie
    const season = seriesMovie.seasons.find((s) => s.id === seasonId);
    if (!season) {
      throw new NotFoundException(
        `Season id #${seasonId} does not exist on SeriesMovie id #${seriesMovieId}`,
      );
    }

    // check if episodeId exists on the season
    const episode = season.episodes.find((e) => e.id === episodeId);
    if (!episode) {
      throw new NotFoundException(
        `Episode id #${episodeId} does not exist on Season id #${seasonId}`,
      );
    }

    // if newposter is provided
    // delete the old poster and save the new one
    const poster = files.find((file) => file.fieldname === 'poster');
    let newPosterUploadResult: S3.ManagedUpload.SendData;
    if (poster) {
      // find the current poster key
      const currentPoster = episode.seasonEpisodeFiles.find(
        (file) => file.fileType === MovieFileType.POSTER,
      );
      try {
        // For movie/episode update case
        // If exists delete current poster from db and s3.
        if (currentPoster) {
          await this.prisma.seasonEpisodeFiles.delete({
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
      updateSeasonEpisodeDto.posterUrl = newPosterUploadResult.Location;
    }

    // if new video is provided
    // delete the old video and save the new one
    const video = files.find((file) => file.fieldname === 'video');
    let newVideoUploadResult: S3.ManagedUpload.SendData;
    if (video) {
      const currentVideoKey = episode.videoKey;
      try {
        // For movie/episode update case
        // If exists delete current video from db and s3
        if (currentVideoKey) {
          await this.prisma.seasonEpisodeFiles.delete({
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
      updateSeasonEpisodeDto.videoKey = newVideoUploadResult.Key;
    }

    const updatedSeasonEpisode = await this.prisma.seasonEpisode.update({
      where: { id: episodeId },
      data: {
        ...updateSeasonEpisodeDto,
      },
    });

    // if the poster was uploaded save the s3 key to db
    if (poster) {
      await this.prisma.seasonEpisodeFiles.create({
        data: {
          fileKey: newPosterUploadResult.Key,
          fileType: MovieFileType.POSTER,
          seasonEpisode: { connect: { id: updatedSeasonEpisode.id } },
        },
      });
    }

    // if the video was uploaded save the s3 key to db
    if (video) {
      await this.prisma.seasonEpisodeFiles.create({
        data: {
          fileKey: newVideoUploadResult.Key,
          fileType: MovieFileType.VIDEO,
          seasonEpisode: { connect: { id: updatedSeasonEpisode.id } },
        },
      });
    }

    return updatedSeasonEpisode;
  }

  /**
   * Delete a season episode
   * @param seriesMovieId
   * @param seasonId
   * @param episodeId
   * @returns {Promise<any>}
   */
  async remove(
    seriesMovieId: number,
    seasonId: number,
    episodeId: number,
  ): Promise<any> {
    // TODO: Restrict to only Admin & Content creator(ownerId)
    //  Only admin and movie owner(content creator) should be allowed to delete a series episode

    // check if seriesMovieId exists
    const seriesMovie = await this.prisma.seriesMovie.findUnique({
      where: { id: seriesMovieId },
      include: {
        seasons: {
          include: { episodes: { include: { seasonEpisodeFiles: true } } },
        },
      },
    });
    if (!seriesMovie) {
      throw new NotFoundException(
        `SeriesMovie id #${seriesMovieId} does not exist`,
      );
    }

    // check if seasonId exists on seriesMovie
    const season = seriesMovie.seasons.find((s) => s.id === seasonId);
    if (!season) {
      throw new NotFoundException(
        `Season id #${seasonId} does not exist on SeriesMovie id #${seriesMovieId}`,
      );
    }

    // check if episodeId exists on season
    const episode = season.episodes.find((e) => e.id === episodeId);
    if (!episode) {
      throw new NotFoundException(
        `Episode id #${episodeId} does not exist on SeriesSeason id #${seasonId}`,
      );
    }

    // get the public season episode files i.e poster
    // Exclude video, because it is not public
    const publicSeasonEpisodeFiles = episode.seasonEpisodeFiles.filter(
      (file) => file.fileType !== MovieFileType.VIDEO,
    );

    try {
      // It's possible that the episode has no public files yet, hence need to check
      // delete all the episode files from s3
      if (publicSeasonEpisodeFiles.length > 0) {
        await Promise.all(
          publicSeasonEpisodeFiles.map((file) =>
            this.publicFileService.deleteMovieFile(file.fileKey),
          ),
        );
      }

      // It's possible that the episode has no video file yet, hence need to check
      // delete the video file, a private file from s3
      if (episode.videoKey) {
        await this.privateFileService.deleteMovieFile(episode.videoKey);
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Error deleting SeasonEpisode files from s3: ${e.message}`,
      );
    }

    // delete episode and all its associations from db - onDelete: CASCADE
    await this.prisma.seasonEpisode.delete({
      where: { id: episodeId },
    });

    return {
      statusCode: 200,
      message: `Episode ${episode.episodeNumber} of Season ${season.seasonNumber} deleted successfully`,
    };
  }
}
