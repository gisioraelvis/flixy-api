export class CreateLogDto {
  context: string;
  level: string;
  message: string;
  stack?: string;
}

export default CreateLogDto;
