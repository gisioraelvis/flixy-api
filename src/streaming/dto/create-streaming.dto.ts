import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOnDiskStreamDto {
  @IsString()
  @IsNotEmpty()
  filePath: string;
}
