import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  controllers: [],
  providers: [],
  exports: [CommonModule],
})
export class CommonModule {}
