import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { appointmentProviders } from 'src/appointment/appointment.providers';
import { DatabaseModule } from 'src/database/database.module';
import { UserService } from 'src/user/user.service';
import { BusinessService } from 'src/business/business.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppointmentController],
  providers: [
    ...appointmentProviders,
    AppointmentService,
    UserService,
    BusinessService,
  ],
})
export class AppointmentModule {}
