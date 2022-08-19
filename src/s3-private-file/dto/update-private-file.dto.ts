import { PartialType } from '@nestjs/mapped-types';
import { CreatePrivateFileDto } from './create-private-file.dto';

export class UpdatePrivateFileDto extends PartialType(CreatePrivateFileDto) {}
