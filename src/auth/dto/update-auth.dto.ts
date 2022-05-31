import { PartialType } from '@nestjs/mapped-types';
import { SignUpDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(SignUpDto) {}
