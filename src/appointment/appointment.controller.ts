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
  Req,
  UnauthorizedException,
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

  private getUserId(req: { user: { userId: string } }): string {
    if ('userId' in req.user) {
      return req.user.userId;
    } else {
      throw new UnauthorizedException('User not authorized');
    }
  }

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
  async createAppointment(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateAppointmentDto,
  ) {
    try {
      const ownerId = this.getUserId(req);
      return await this.appointmentService.create({
        businessId: dto.businessId,
        endTime: dto.endTime,
        startTime: dto.startTime,
        title: dto.title,
        isRecurring: dto.isRecurring,
        description: dto.description,
        notes: dto.notes,
        customerId: dto.customerId,
        recurringFrequency: dto.recurringFrequency,
        recurringUntil: dto.recurringUntil,
        userId: ownerId,
      });
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
    @Req() req: { user: { userId: string } },
    @Param('id') appointmentId: string,
    @Body() body: UpdateAppointmentDto,
  ) {
    const ownerId = this.getUserId(req);
    return await this.appointmentService.update({
      appointmentId,
      businessId: body.businessId,
      ownerId,
      endTime: body.endTime,
      startTime: body.startTime,
      title: body.title,
      isRecurring: body.isRecurring,
      description: body.description,
      notes: body.notes,
      customerId: body.customerId,
      recurringFrequency: body.recurringFrequency,
      recurringUntil: body.recurringUntil,
    });
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
