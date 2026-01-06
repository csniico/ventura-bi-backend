import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from 'src/appointment/dto/create-appointment.dto';
import { UpdateGoogleEvent } from 'src/appointment/dto/update-google-event.dto';
import { UpdateAppointmentDto } from 'src/appointment/dto/update-appointment.dto';
import { DeleteAppointmentDto } from 'src/appointment/dto/delete-appointment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentController {
  private readonly logger = new Logger('AppointmentController');
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('/user')
  async findByUserId(@Query('userId') userId: string) {
    try {
      return await this.appointmentService.findByUserId(userId);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  @Get('/business')
  async findByBusinessId(@Query('businessId') businessId: string) {
    try {
      return await this.appointmentService.findByBusinessId(businessId);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  @Post()
  async createAppointment(@Body() dto: CreateAppointmentDto) {
    try {
      return await this.appointmentService.create(dto);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  @Patch('/google-event/:id')
  async updateGoogleEventId(
    @Param('id') id: string,
    @Body() dto: UpdateGoogleEvent,
  ) {
    try {
      return this.appointmentService.updateGoogleEventId({
        dto,
        appointmentId: id,
      });
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  @Put('/:id')
  async updateAppointment(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    try {
      return this.appointmentService.updateAppointment({
        appointmentId: id,
        partials: dto,
      });
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  @Delete('/:id')
  async deleteAppointment(
    @Param('id') id: string,
    @Body() dto: DeleteAppointmentDto,
  ) {
    try {
      return this.appointmentService.delete({ appointmentId: id, dto });
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
