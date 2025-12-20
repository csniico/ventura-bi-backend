import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BUSINESS_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { Business } from 'src/business/entities/business.entity';
import { CreateBusinessDto } from 'src/business/dto/create-business.dto';
import { UpdateBusinessDto } from 'src/business/dto/update-business.dto';
import { UserService } from 'src/user/user.service';

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

  async findOne(businessId: string) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
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

  async create(data: CreateBusinessDto): Promise<Business> {
    const { ownerId } = data;
    const existingBusiness = await this.businessRepository.findOne({
      where: { ownerId },
    });
    if (existingBusiness !== null) {
      throw new BadRequestException(
        'cannot create business, business already exists!',
      );
    }
    const user = await this.userService.findUserById(ownerId);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, shortId, ...rest } = data;

    const newBusiness = this.businessRepository.create(rest);
    await this.businessRepository.save(newBusiness);

    user.businessId = newBusiness.id;
    await this.userService.saveUser(user);
    const business = await this.findOne(newBusiness.id);
    if (!business) {
      throw new NotFoundException('business not found');
    }
    return business;
  }

  async update(id: string, data: UpdateBusinessDto): Promise<Business | null> {
    await this.businessRepository.update(id, data);
    return await this.findOne(id);
  }
}
