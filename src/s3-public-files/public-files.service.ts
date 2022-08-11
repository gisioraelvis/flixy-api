import { Injectable, NotFoundException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublicFilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async uploadPublicFile(
    ownerId: number,
    filename: string,
    dataBuffer: Buffer,
  ) {
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

  async findAll(paginationQuery: {
    offset?: number;
    limit?: number;
    cursor?: Prisma.SingleMovieWhereUniqueInput;
    where?: Prisma.SingleMovieScalarWhereInput;
    orderBy?: Prisma.SingleMovieOrderByWithRelationInput;
  }): Promise<any[]> {
    const { offset, limit, cursor, where, orderBy } = paginationQuery;
    return await this.prismaService.publicFile.findMany({
      skip: offset,
      take: limit,
      cursor,
      where,
      orderBy,
    });
  }

  async addFile(ownerId: number, filename: string, fileBuffer: Buffer) {
    return await this.uploadPublicFile(ownerId, filename, fileBuffer);
  }

  async deletePublicFile(ownerId: number, fileId: number) {
    // find file by fileId owned by ownerId
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
    // await this.publicFilesRepository.delete(fileId);
    await this.prismaService.publicFile.delete({ where: { id: fileId } });
  }
}
