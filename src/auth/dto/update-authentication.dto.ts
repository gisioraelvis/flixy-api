import { PartialType } from '@nestjs/mapped-types';
import { SignUpDto } from './create-authentication.dto';

export class UpdateAuthDto extends PartialType(SignUpDto) {}
