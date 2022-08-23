import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, PrivateFile } from '@prisma/client';

@Injectable()
export class PrivateFileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Uploads a file to S3 and returns the file's key
   * @param filename
   * @param dataBuffer - the file being uploaded
   */
  async uploadMovieFile(filename: string, dataBuffer: Buffer): Promise<any> {
    const s3 = new S3();
    try {
      const uploadResult = await s3
        .upload({
          Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
          Body: dataBuffer,
          Key: `${uuid()}-${filename}`,
        })
        .promise();
      return uploadResult;
    } catch (e) {
      throw new InternalServerErrorException(
        `Error uploading file to s3: ${e.message}`,
      );
    }
  }

  /**
   * Uploads a file to S3 then saves the file's key and ownerId to the db
   * @param ownerId - the user id
   * @param filename
   * @param dataBuffer - the file being uploaded
   * @returns {Promise<PrivateFie>} - the file metadata saved to the db
   */
  async uploadFile(
    ownerId: number,
    filename: string,
    dataBuffer: Buffer,
  ): Promise<PrivateFile> {
    const s3 = new S3();
    try {
      const uploadResult = await s3
        .upload({
          Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
          Body: dataBuffer,
          Key: `${uuid()}-${filename}`,
        })
        .promise();

      const newFile = await this.prismaService.privateFile.create({
        data: {
          key: uploadResult.Key,
          owner: { connect: { id: ownerId } },
        },
      });

      return newFile;
    } catch (e) {
      throw new InternalServerErrorException(
        `Error uploading file: ${e.message}`,
      );
    }
  }

  /**
   * Fetches a movie file from s3 as a stream
   * @param fileKey
   * @returns {Promise<any>} - the file stream
   *
   * // TODO: Keep track of issue until fixed
   * @issue crashes when AWS-SDK throws any type of Error
   *     - Incorrect key when searching for an object
   *     - Incorrect credentials
   * @see https://github.com/aws/aws-sdk-js/issues/4123
   */
  async getMovieFile(fileKey: string): Promise<any> {
    const s3 = new S3();
    try {
      const fileStream = s3
        .getObject({
          Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
          Key: fileKey,
        })
        .createReadStream();

      return fileStream;
    } catch (e) {
      throw new InternalServerErrorException(
        `Error fetching file from s3: ${e.message}`,
      );
    }
  }

  /**
   * Fetches a user file from s3,
   * returns the file metadata if the user owns the file
   * @param userId
   * @param fileId
   * @returns {Promise<any>} - the file stream and metadata
   */
  async getFile(userId: number, fileId: number): Promise<any> {
    const fileInfo = await this.prismaService.privateFile.findUnique({
      where: { id: fileId },
    });

    if (!fileInfo) {
      throw new NotFoundException(`File id #${fileId} does not exist`);
    }

    // check if user owns the file
    if (fileInfo.ownerId !== userId) {
      throw new UnauthorizedException(
        `File id ${fileId} is not owned by user id ${userId}`,
      );
    }

    const s3 = new S3();
    try {
      const stream = s3
        .getObject({
          Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
          Key: fileInfo.key,
        })
        .createReadStream();

      return {
        stream,
        info: fileInfo,
      };
    } catch (e) {
      throw new InternalServerErrorException(
        `Error fetching file: ${e.message}`,
      );
    }
  }

  /**
   * generates a presigned url for accessing a file
   * @param fileKey - the file key
   * @returns {Promise<string>} - the presigned url
   */
  public async generatePresignedUrl(fileKey: string): Promise<string> {
    const s3 = new S3();
    try {
      const preSignedURL = s3.getSignedUrlPromise('getObject', {
        Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
        Key: fileKey,
      });
      return preSignedURL;
    } catch (e) {
      throw new InternalServerErrorException(
        `Error generating presigned url: ${e.message}`,
      );
    }
  }

  /**
   * Fetchs all files owned by the user
   * @param userId
   * @param paginationQuery
   * @returns {Promise<any[]>} - the files and metadata
   */
  async getAllFiles(
    userId: number,
    paginationQuery: {
      offset?: number;
      limit?: number;
      cursor?: Prisma.SingleMovieWhereUniqueInput;
      orderBy?: Prisma.SingleMovieOrderByWithRelationInput;
    },
  ): Promise<any[]> {
    const { offset, limit, cursor, orderBy } = paginationQuery;
    const userFiles = await this.prismaService.privateFile.findMany({
      where: { ownerId: userId },
      skip: offset,
      take: limit,
      cursor,
      orderBy,
    });

    if (userFiles.length > 0) {
      return Promise.all(
        userFiles.map(async (file: { key: string }) => {
          const url = await this.generatePresignedUrl(file.key);
          return {
            ...file,
            url,
          };
        }),
      );
    }
    // empty array/no files found
    throw new NotFoundException('User has no files');
  }

  /**
   * Deletes a file from s3
   * @param fileKey
   * @returns {Promise<any>}
   */
  async deleteMovieFile(fileKey: string): Promise<any> {
    const s3 = new S3();
    try {
      await s3
        .deleteObject({
          Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
          Key: fileKey,
        })
        .promise();
      return;
    } catch (e) {
      throw new InternalServerErrorException(
        `Error deleting file from s3: ${e.message}`,
      );
    }
  }

  /**
   * Deletes a user file from s3 and the db
   * The file must be owned by the user
   * @param ownerId
   * @param fileId
   * @returns {Promise<any>}
   */
  async deleteFile(ownerId: number, fileId: number): Promise<any> {
    // users should only delete their own files
    const file = await this.prismaService.privateFile.findFirst({
      where: {
        AND: [{ id: fileId }, { ownerId }],
      },
    });

    if (!file) {
      throw new NotFoundException(
        `File id #${fileId} does not exist or is not owned by user id #${ownerId}`,
      );
    }

    const s3 = new S3();
    try {
      await s3
        .deleteObject({
          Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
          Key: file.key,
        })
        .promise();

      await this.prismaService.privateFile.delete({
        where: { id: fileId },
      });

      return {
        statusCode: 200,
        message: `File id #${fileId} deleted successfully`,
      };
    } catch (e) {
      throw new InternalServerErrorException(
        `Error deleting file: ${e.message}`,
      );
    }
  }
}
