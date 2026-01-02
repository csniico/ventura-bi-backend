import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from 'src/business/dto/create-business.dto';
import { UpdateBusinessDto } from 'src/business/dto/update-business.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@Controller('businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('/')
  async findAll() {
    return this.businessService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return await this.businessService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async create(@Body() dto: CreateBusinessDto) {
    return await this.businessService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return await this.businessService.update(id, dto);
  }
}
