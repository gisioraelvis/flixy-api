import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello World 👋...';
  }
}
