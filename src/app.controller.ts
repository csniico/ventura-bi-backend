import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('root')
@Controller('/')
export class AppController {
  @Get('')
  getRoot(): string {
    return 'Welcome to the Service API!';
  }
}
