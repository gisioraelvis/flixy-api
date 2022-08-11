import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, PrivateFile } from '@prisma/client';

@Injectable()
export class PrivateFilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Uploads a file to S3, returns the file's key and
   * saves the file's key and ownerId to the db
   * @param ownerId - id of the user who is uploading the file
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
  }

  /**
   * Fetches the file from s3,
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
      throw new NotFoundException(`File with id ${fileId} does not exist`);
    }

    // check if user owns the file
    if (fileInfo.ownerId !== userId) {
      throw new UnauthorizedException(
        `File id ${fileId} is not owned by user id ${userId}`,
      );
    }

    if (fileInfo) {
      const s3 = new S3();
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
    }

    throw new NotFoundException();
  }

  // generate a presigned url for accessing a file
  public async generatePresignedUrl(key: string) {
    const s3 = new S3();
    return s3.getSignedUrlPromise('getObject', {
      Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
      Key: key,
    });
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
    throw new NotFoundException('User has no files');
  }

  /**
   * Deletes the file from s3 and the db
   * The file must be owned by the user
   * @param ownerId
   * @param fileId
   * @returns {Promise<any>}
   */
  async deleteFile(ownerId: number, fileId: number): Promise<any> {
    //TODO: Admin can delete any file (not just their own)

    // users should only delete their own files
    const file = await this.prismaService.privateFile.findFirst({
      where: {
        AND: [{ id: fileId }, { ownerId }],
      },
    });

    if (!file) {
      throw new NotFoundException(
        `File with id ${fileId} does not exist or is not owned by user id ${ownerId}`,
      );
    }

    const s3 = new S3();
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
      message: `File with id ${fileId} deleted successfully`,
    };
  }
}
