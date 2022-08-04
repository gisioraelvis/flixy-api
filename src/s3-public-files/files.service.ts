import { Injectable, NotFoundException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async uploadPublicFile(dataBuffer: Buffer, filename: string) {
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
        owner: { connect: { id: 1 } },
      },
    });

    return newFile;
  }

  async findAll(): Promise<any[]> {
    return await this.prismaService.publicFile.findMany();
  }

  async addFile(fileBuffer: Buffer, filename: string) {
    return await this.uploadPublicFile(fileBuffer, filename);
  }

  async deletePublicFile(fileId: number) {
    const file = await this.prismaService.publicFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with id ${fileId} does not exist`);
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
