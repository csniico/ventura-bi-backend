import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from 'src/appointment/entities/appointment.entity';
import { UserService } from 'src/user/user.service';
import { BusinessService } from 'src/business/business.service';
import { UpdateGoogleEvent } from 'src/appointment/dto/update-google-event.dto';
import { User } from 'src/user/entities/user.entity';
import { Business } from 'src/business/entities/business.entity';
import { DeleteAppointmentDto } from 'src/appointment/dto/delete-appointment.dto';
import { CustomerService } from 'src/customer/customer.service';
import { IUpdateAppointment } from './interfaces/update-appointment.interface';
import { ICreateAppointment } from './create-appointment.interface';

@Injectable()
export class AppointmentService {
  private logger = new Logger('AppointmentService');
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly userService: UserService,
    private readonly businessService: BusinessService,
    private readonly customerService: CustomerService,
  ) {}

  private async _validateUserId(userId: string) {
    if (!userId) {
      return null;
    }
    try {
      const user = await this.userService.findUserById(userId);
      if (!user) {
        return null;
      }
      return user;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }
  private async _validateBusinessId(businessId: string) {
    if (!businessId) {
      return null;
    }
    try {
      const business = await this.businessService.findOne({ businessId });
      if (!business) {
        return null;
      }
      return business;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  private _checkIfUserOwnsBusiness({
    user,
    userId,
    businessId,
    business,
  }: {
    user: User;
    business: Business;
    businessId: string;
    userId: string;
  }) {
    this.logger.log(`req-business=${businessId}`);
    this.logger.log(`business-user=${business.ownerId}`);
    this.logger.log(`req-user=${userId}`);
    this.logger.log(`user-business=${user.businessId}`);
    this.logger.log(
      `${user.businessId} === ${businessId} && ${business.ownerId} === ${userId}`,
    );
    return user.businessId === businessId && business.ownerId === userId;
  }

  private async authorizeRequest(userId: string, businessId: string) {
    const user = await this._validateUserId(userId);
    if (!user) {
      throw new NotFoundException(`User not found for userId ${userId}`);
    }
    const business = await this._validateBusinessId(businessId);
    if (!business) {
      throw new BadRequestException(
        `Business not found for businessId ${businessId}`,
      );
    }
    if (
      !this._checkIfUserOwnsBusiness({ user, userId, businessId, business })
    ) {
      throw new UnauthorizedException(
        `User with id ${userId} does not own business with id ${businessId}`,
      );
    }
  }

  async findByUserId(userId: string) {
    const appointment = await this.appointmentRepository.find({
      where: { userId },
      relations: ['customer'],
    });
    if (!appointment) {
      return new NotFoundException(
        'No appointment found for the supplied user.',
      );
    }
    return appointment.reverse();
  }

  async findByBusinessId(businessId: string) {
    const appointment = await this.appointmentRepository.find({
      where: { businessId },
      relations: ['customer'],
    });
    if (!appointment) {
      throw new NotFoundException(
        'No appointment found for the supplied business.',
      );
    }
    return appointment;
  }

  async findByAppointmentId(appointmentId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['customer'],
    });
    if (!appointment) {
      throw new NotFoundException(
        'No appointment found the supplied appointment id',
      );
    }
    return appointment;
  }

  async create(params: ICreateAppointment) {
    const { userId, businessId } = params;
    await this.authorizeRequest(userId, businessId);
    const payload: Partial<Appointment> = {
      businessId: params.businessId,
      userId: params.userId,
      title: params.title,
      startTime: new Date(params.startTime),
      endTime: new Date(params.endTime),
      isRecurring: params.isRecurring,
      status: AppointmentStatus.SCHEDULED,
    };
    if (params.customerId) {
      const customer = await this.customerService.findOne({
        customerId: params.customerId,
        ownerId: userId,
        businessId: businessId,
      });
      if (!customer) {
        throw new NotFoundException(
          `Customer with id ${params.customerId} not found`,
        );
      }
      payload.customerId = params.customerId;
      payload.customer = customer;
    }
    if (params.description) {
      payload.description = params.description;
    }
    if (params.notes) {
      payload.notes = params.notes;
    }
    if (params.isRecurring) {
      if (
        params.recurringFrequency == undefined ||
        params.recurringUntil == undefined
      ) {
        throw new BadRequestException(
          'Both recurringFrequency and recurringUntil must be provided when isRecurring is true',
        );
      }
      payload.recurringFrequency = params.recurringFrequency;
      payload.recurringUntil = params.recurringUntil;
    }
    const appointment = this.appointmentRepository.create(payload);

    return await this.appointmentRepository.save(appointment);
  }

  async updateGoogleEventId({
    dto,
    appointmentId,
  }: {
    appointmentId: string;
    dto: UpdateGoogleEvent;
  }) {
    const { googleEventId, userId, businessId } = dto;
    await this.authorizeRequest(userId, businessId);
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['customer'],
    });
    if (!appointment) {
      throw new NotFoundException(
        'Appointment with id ${appointmentId} not found',
      );
    }
    if (!googleEventId || googleEventId === '') {
      appointment.googleEventId = 'none';
    } else {
      appointment.googleEventId = googleEventId;
    }
    return await this.appointmentRepository.save(appointment);
  }

  async update(params: IUpdateAppointment) {
    await this.authorizeRequest(params.ownerId, params.businessId);
    const appointment = await this.appointmentRepository.exists({
      where: { id: params.appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with id ${params.appointmentId} not found`,
      );
    }
    await this.appointmentRepository.update(params.appointmentId, {
      title: params.title,
      startTime: new Date(params.startTime),
      endTime: new Date(params.endTime),
      description: params.description,
      notes: params.notes,
      status: params.status,
      isRecurring: params.isRecurring,
      recurringFrequency: params.recurringFrequency,
      recurringUntil: params.recurringUntil,
    });
    if (params.customerId != undefined) {
      const customer = await this.customerService.findOne({
        customerId: params.customerId,
        ownerId: params.ownerId,
        businessId: params.businessId,
      });
      await this.appointmentRepository.update(params.appointmentId, {
        customerId: customer.id,
      });
    } else {
      // Use query builder to set customerId to NULL
      await this.appointmentRepository
        .createQueryBuilder()
        .update()
        .set({ customerId: () => 'NULL' })
        .where('id = :id', { id: params.appointmentId })
        .execute();
    }
    return await this.appointmentRepository.findOne({
      where: { id: params.appointmentId },
      relations: ['customer'],
    });
  }

  async delete({
    appointmentId,
    dto,
  }: {
    appointmentId: string;
    dto: DeleteAppointmentDto;
  }) {
    const { userId, businessId } = dto;
    await this.authorizeRequest(userId, businessId);
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['customer'],
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with id ${appointmentId} not found`,
      );
    }
    await this.appointmentRepository.delete(appointmentId);
    return { message: 'Deleted successfully.' };
  }
}
