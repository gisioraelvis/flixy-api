import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrivateFilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async uploadPrivateFile(
    dataBuffer: Buffer,
    ownerId: number,
    filename: string,
  ) {
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

  async addPrivateFile(fileBuffer: Buffer, userId: number, filename: string) {
    return this.uploadPrivateFile(fileBuffer, userId, filename);
  }

  public async fetchPrivateFile(fileId: number) {
    const s3 = new S3();

    const fileInfo = await this.prismaService.privateFile.findUnique({
      where: { id: fileId },
    });

    if (fileInfo) {
      const stream = await s3
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

  async getPrivateFile(userId: number, fileId: number) {
    const file = await this.fetchPrivateFile(fileId);
    if (file.info.ownerId === userId) {
      return file;
    }
    throw new UnauthorizedException();
  }

  public async generatePresignedUrl(key: string) {
    const s3 = new S3();

    return s3.getSignedUrlPromise('getObject', {
      Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
      Key: key,
    });
  }

  async getAllPrivateFiles(userId: number) {
    const userFiles = await this.userService.getAllPrivateFiles(userId);

    if (userFiles) {
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
}
