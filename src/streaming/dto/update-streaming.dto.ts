import { PartialType } from '@nestjs/mapped-types';
import { CreateOnDiskStreamDto } from './create-streaming.dto';

export class UpdateStreamingDto extends PartialType(CreateOnDiskStreamDto) {}
