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
import { Appointment } from 'src/appointment/entities/appointment.entity';
import { UserService } from 'src/user/user.service';
import { BusinessService } from 'src/business/business.service';
import { CreateAppointmentDto } from 'src/appointment/dto/create-appointment.dto';
import { UpdateGoogleEvent } from 'src/appointment/dto/update-google-event.dto';
import { User } from 'src/user/entities/user.entity';
import { Business } from 'src/business/entities/business.entity';
import { UpdateAppointmentDto } from 'src/appointment/dto/update-appointment.dto';
import { DeleteAppointmentDto } from 'src/appointment/dto/delete-appointment.dto';

@Injectable()
export class AppointmentService {
  private logger = new Logger('AppointmentService');
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly userService: UserService,
    private readonly businessService: BusinessService,
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
      const business = await this.businessService.findOne(businessId);
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
    });
    if (!appointment) {
      return new NotFoundException(
        'No appointment found for the supplied user.',
      );
    }
    return appointment;
  }

  async findByBusinessId(businessId: string) {
    const appointment = await this.appointmentRepository.find({
      where: { businessId },
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
    });
    if (!appointment) {
      throw new NotFoundException(
        'No appointment found the supplied appointment id',
      );
    }
    return appointment;
  }

  async create(dto: CreateAppointmentDto) {
    const { userId, businessId } = dto;
    await this.authorizeRequest(userId, businessId);
    const appointment = this.appointmentRepository.create(dto);
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

  async updateAppointment({
    appointmentId,
    partials,
  }: {
    appointmentId: string;
    partials: UpdateAppointmentDto;
  }) {
    const { userId, businessId, title, startTime, endTime, isRecurring } =
      partials;
    if (
      !userId ||
      !businessId ||
      !title ||
      startTime ||
      endTime ||
      isRecurring
    ) {
      throw new BadRequestException(
        'missing one or more of [userId, businessId, title, startTime, endTime, isRecurring]',
      );
    }
    await this.authorizeRequest(userId, businessId);
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with id ${appointmentId} not found`,
      );
    }
    return await this.appointmentRepository.updateAll(partials);
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
