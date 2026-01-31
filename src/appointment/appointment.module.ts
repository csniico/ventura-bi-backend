import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { appointmentProviders } from 'src/appointment/appointment.providers';
import { DatabaseModule } from 'src/database/database.module';
import { UserService } from 'src/user/user.service';
import { BusinessService } from 'src/business/business.service';
import { CustomerService } from 'src/customer/customer.service';
import { AppointmentUpdateService } from './appointment-update.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppointmentController],
  providers: [
    ...appointmentProviders,
    AppointmentService,
    AppointmentUpdateService,
    UserService,
    BusinessService,
    CustomerService,
  ],
})
export class AppointmentModule {}
