import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BUSINESS_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { Business } from 'src/business/entities/business.entity';
import { CreateBusinessDto } from 'src/business/dto/create-business.dto';
import { UpdateBusinessDto } from 'src/business/dto/update-business.dto';
import { UserService } from 'src/user/user.service';
import {
  IFindBusinessByIdParams,
  IFindBusinessByOwnerParams,
} from './interfaces/business.interfaces';

@Injectable()
export class BusinessService {
  constructor(
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: Repository<Business>,
    private readonly userService: UserService,
  ) {}

  async findAll(): Promise<Business[]> {
    return await this.businessRepository.find({
      select: [
        'id',
        'shortId',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'ownerId',
      ],
    });
  }

  async findOne(params: IFindBusinessByIdParams) {
    const business = await this.businessRepository.findOne({
      where: { id: params.businessId },
      select: [
        'id',
        'shortId',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'ownerId',
        'logo',
        'categories',
        'tagLine',
        'description',
      ],
    });

    if (!business) {
      throw new NotFoundException('business not found');
    }

    return business;
  }

  async findByOwnerId(
    params: IFindBusinessByOwnerParams,
  ): Promise<Business | null> {
    const business = await this.businessRepository.findOne({
      where: { ownerId: params.ownerId },
      select: [
        'id',
        'shortId',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'ownerId',
        'logo',
        'categories',
        'tagLine',
        'description',
      ],
    });
    if (!business) {
      throw new UnauthorizedException(
        'You do not have permission to access this business',
      );
    }
    return business;
  }

  async create(data: CreateBusinessDto): Promise<Business> {
    const { ownerId } = data;
    const existingBusiness = await this.businessRepository.findOne({
      where: { ownerId },
    });
    if (existingBusiness !== null) {
      return await this.update(existingBusiness.id, data);
    }
    const user = await this.userService.findUserById(ownerId);
    if (!user) {
      throw new NotFoundException('user not found');
    }

    const newBusiness = this.businessRepository.create(data);
    await this.businessRepository.save(newBusiness);

    user.businessId = newBusiness.id;
    user.business = newBusiness;
    await this.userService.saveUser(user);
    const business = await this.findOne({ businessId: newBusiness.id });
    if (!business) {
      throw new NotFoundException('business not found');
    }
    return business;
  }

  async update(id: string, data: UpdateBusinessDto): Promise<Business> {
    await this.businessRepository.update(id, data);
    const business = await this.findOne({ businessId: id });
    if (!business) {
      throw new NotFoundException('business not found');
    }
    return business;
  }
}
