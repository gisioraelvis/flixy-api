import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSeasonEpisodeDto } from './dto/create-series-movie.dto';
import { UpdateSeasonEpisodeDto } from './dto/update-series-movie.dto';
import { stripAndHyphenate } from 'src/utils/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieFileType, SeasonEpisode } from '@prisma/client';
import { PrivateFileService } from 'src/s3-private-files/private-files.service';
import { PublicFilesService } from 'src/s3-public-files/public-files.service';
import { S3 } from 'aws-sdk';

@Injectable()
export class SeasonEpisodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privateFileService: PrivateFileService,
    private readonly publicFileService: PublicFilesService,
  ) {}

  /**
   * Create a new season episode
   * @param createSeasonEpisodeDto - new season episode
   * @returns {Promise<SeasonEpisode>} - created season episode
   */
  async create(
    userId: number,
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

    // check if season exists
    const season = await this.prisma.seriesSeason.findUnique({
      where: { id: seasonId },
      select: { id: true },
    });
    if (!season) {
      throw new NotFoundException(`Season with id ${seasonId} not found`);
    }

    // get episode files
    const poster = files.find((file) => file.fieldname === 'poster');
    const trailer = files.find((file) => file.fieldname === 'trailer');
    const video = files.find((file) => file.fieldname === 'video');

    // episode files urls
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
        `Error saving Season Episode files: ${e.message}`,
      );
    }

    // if any of the files was provided and uploaded successfully get the appropriate value
    // otherwise set to null
    const posterS3Url = posterUploadResult ? posterUploadResult.Location : null;
    const trailerS3Url = trailerUploadResult
      ? trailerUploadResult.Location
      : null;
    const videoS3Key = videoUploadResult ? videoUploadResult.Key : null;

    // create and save the new season episode
    const newSeasonEpisode = await this.prisma.seasonEpisode.create({
      data: {
        ...createSeasonEpisodeDto,
        posterUrl: posterS3Url,
        trailerUrl: trailerS3Url,
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

    // if the trailer was uploaded save the s3 key to db
    if (trailer) {
      await this.prisma.seasonEpisodeFiles.create({
        data: {
          fileKey: trailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
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
   * Find a SeasonEpisode by id
   * @param id - SeasonEpisode id
   * @returns {Promise<SeasonEpisode>} - SeasonEpisode
   */
  async findOne(id: number): Promise<SeasonEpisode> {
    const seasonEpisode = await this.prisma.seasonEpisode.findUnique({
      where: { id },
      include: { seasonEpisodeFiles: true },
    });
    if (!seasonEpisode) {
      throw new NotFoundException(`Season Episode with id ${id} not found`);
    }
    return seasonEpisode;
  }

  /**
   * Find SeasonEpisode by title
   * @param title - SeasonEpisode title
   * @returns {Promise<SeasonEpisode>} - SeasonEpisode
   */
  async findByTitle(title: string): Promise<SeasonEpisode[]> {
    const seasonEpisode = await this.prisma.seasonEpisode.findMany({
      where: { title: { contains: title } },
    });
    if (!seasonEpisode) {
      throw new NotFoundException(
        `Season Episode with title ${title} does not exist`,
      );
    }
    return seasonEpisode;
  }

  /**
   * Update SeasonEpisode details
   * @param id - SeasonEpisode id
   * @param updateSeasonEpisodeDto - UpdateSeasonEpisodeDto
   * @returns {Promise<SeasonEpisode>} - updated season episode
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
    id: number,
    updateSeasonEpisodeDto: UpdateSeasonEpisodeDto,
    files: any[],
  ): Promise<SeasonEpisode> {
    const seasonEpisode = await this.prisma.seasonEpisode.findUnique({
      where: { id },
      include: { seasonEpisodeFiles: true },
    });
    if (!seasonEpisode) {
      throw new NotFoundException(
        `Season Episode with id ${id} does not exist`,
      );
    }

    // if newposter is provided
    // delete the old poster and save the new one
    const poster = files.find((file) => file.fieldname === 'poster');
    let newPosterUploadResult: S3.ManagedUpload.SendData;
    if (poster) {
      // find the current poster key
      const currentPoster = seasonEpisode.seasonEpisodeFiles.find(
        (file) => file.fileType === MovieFileType.POSTER,
      );
      try {
        // For movie update case
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

    // if newtrailer is provided
    // delete the old trailer and save the new one
    const trailer = files.find((file) => file.fieldname === 'trailer');
    let newTrailerUploadResult: S3.ManagedUpload.SendData;
    if (trailer) {
      const currentTrailer = seasonEpisode.seasonEpisodeFiles.find(
        (file) => file.fileType === MovieFileType.TRAILER,
      );
      try {
        // For movie update case
        // If exists delete current trailer from db and s3
        if (currentTrailer) {
          await this.prisma.seasonEpisodeFiles.delete({
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
      updateSeasonEpisodeDto.trailerUrl = newTrailerUploadResult.Location;
    }

    // if new video is provided
    // delete the old video and save the new one
    const video = files.find((file) => file.fieldname === 'video');
    let newVideoUploadResult: S3.ManagedUpload.SendData;
    if (video) {
      const currentVideoKey = seasonEpisode.videoKey;
      try {
        // For movie update case
        // If exists delete current video from s3
        if (currentVideoKey) {
          await this.prisma.seasonEpisodeFiles.delete({
            where: { fileKey: currentVideoKey },
          });

          // TODO: Check if file exists in db before calling delete on s3
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
      where: { id },
      data: {
        ...updateSeasonEpisodeDto,
      },
      include: { seasonEpisodeFiles: true },
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

    // if the trailer was uploaded save the s3 key to db
    if (trailer) {
      await this.prisma.seasonEpisodeFiles.create({
        data: {
          fileKey: newTrailerUploadResult.Key,
          fileType: MovieFileType.TRAILER,
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
   * @param id - season episode id
   * @returns {Promise<any>}
   */
  async remove(id: number): Promise<any> {
    // TODO: Restrict to only Admin & Content creator(ownerId)
    //  Only admin and movie owner(content creator) should be allowed to delete a series episode
    const seasonEpisode = await this.prisma.seasonEpisode.findUnique({
      where: { id },
      include: { seasonEpisodeFiles: true },
    });
    if (!seasonEpisode) {
      throw new NotFoundException(
        `Season Episode with id ${id} does not exist`,
      );
    }

    // get the public season episode files i.e poster and trailer
    // Exclude video, because it is not public
    const publicSeasonEpisodeFiles = seasonEpisode.seasonEpisodeFiles.filter(
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
      if (seasonEpisode.videoKey) {
        await this.privateFileService.deleteMovieFile(seasonEpisode.videoKey);
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Error deleting series episode files from s3: ${e.message}`,
      );
    }

    // delete series episode and all its associations from db - Cascade delete
    await this.prisma.seasonEpisode.delete({
      where: { id },
    });

    return { statusCode: 200, message: `${seasonEpisode.title} deleted` };
  }
}
