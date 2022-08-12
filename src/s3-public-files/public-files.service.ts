import { Injectable, NotFoundException } from '@nestjs/common';
import { AWSError, S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, PublicFile } from '@prisma/client';

@Injectable()
export class PublicFilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Uploads a file to S3 and saves the file metadata to the db
   * i.e file key, url to access the file, and the owner id
   * @param filename
   * @param dataBuffer
   * @returns {Promise<PublicFile>} - the file metadata
   */
  async uploadMovieFile(
    filename: string,
    dataBuffer: Buffer,
  ): Promise<S3.ManagedUpload.SendData> {
    const s3 = new S3();
    const uploadResult = await s3
      .upload({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
        Body: dataBuffer,
        Key: `${uuid()}-${filename}`,
      })
      .promise();

    return uploadResult;
  }

  /**
   * Uploads a file to S3 and saves the file metadata to the db
   * i.e file key, url to access the file, and the owner id
   * @param filename
   * @param dataBuffer
   * @returns {Promise<PublicFile>} - the file metadata
   */
  async uploadFile(
    ownerId: number,
    filename: string,
    dataBuffer: Buffer,
  ): Promise<PublicFile> {
    const s3 = new S3();
    const uploadResult = await s3
      .upload({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
        Body: dataBuffer,
        Key: `${uuid()}-${filename}`,
      })
      .promise();

    const newFile = await this.prismaService.publicFile.create({
      data: {
        key: uploadResult.Key,
        url: uploadResult.Location,
        owner: { connect: { id: ownerId } },
      },
    });

    return newFile;
  }

  /**
   * Fetch all files owned by a user
   * @param paginationQuery
   * @returns {Promise<PublicFile[]>} - the files
   */
  async findAll(paginationQuery: {
    offset?: number;
    limit?: number;
    cursor?: Prisma.SingleMovieWhereUniqueInput;
    where?: Prisma.SingleMovieScalarWhereInput;
    orderBy?: Prisma.SingleMovieOrderByWithRelationInput;
  }): Promise<PublicFile[]> {
    const { offset, limit, cursor, where, orderBy } = paginationQuery;
    return await this.prismaService.publicFile.findMany({
      skip: offset,
      take: limit,
      cursor,
      where,
      orderBy,
    });
  }

  /**
   * Find a file by id
   * @param id - the id of the file to find
   * @returns {Promise<PublicFile>} - the file
   */
  async findOne(id: number): Promise<PublicFile> {
    const file = await this.prismaService.publicFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with id ${id} does not exist`);
    }

    return file;
  }

  /**
   * Delete a file by id from s3
   * @param fileId
   * @returns {Promise<any>}
   */
  async deleteMovieFile(
    fileId: string,
  ): Promise<S3.DeleteObjectOutput | AWSError> {
    const s3 = new S3();
    await s3
      .deleteObject({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
        Key: fileId,
      })
      .promise();
    return;
  }

  /**
   * Delete a file by id
   * @param ownerId
   * @param fileId
   * @returns {Promise<any>}
   */
  async deleteFile(ownerId: number, fileId: number): Promise<any> {
    //TODO: Admin can delete any file (not just their own)

    // users should only delete their own files
    const file = await this.prismaService.publicFile.findFirst({
      where: {
        AND: [{ id: fileId }, { ownerId }],
      },
    });

    if (!file) {
      throw new NotFoundException(
        `File with id ${fileId} owned by user id ${ownerId} does not exist`,
      );
    }
    const s3 = new S3();
    await s3
      .deleteObject({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
        Key: file.key,
      })
      .promise();

    await this.prismaService.publicFile.delete({
      where: { id: fileId },
    });

    return {
      statusCode: 200,
      message: `File with id ${fileId} deleted successfully`,
    };
  }
}
