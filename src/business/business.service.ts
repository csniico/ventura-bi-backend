import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
    return this.businessRepository.find();
  }

  async findOne(id: string): Promise<Business | null> {
    return await this.businessRepository.findOneBy({ id });
  }

  async create(data: CreateBusinessDto): Promise<Business> {
    console.log({ data });
    const { ownerId } = data;
    const user = await this.userService.findUserById(ownerId);
    if (!user || user instanceof NotFoundException) {
      throw new NotFoundException('user not found');
    }
    const newBusiness = this.businessRepository.create(data);
    newBusiness.owner = user;
    user.businessId = newBusiness.id;
    await this.userService.saveUser(user);
    return await this.businessRepository.save(newBusiness);
  }

  async update(id: string, data: UpdateBusinessDto): Promise<Business | null> {
    await this.businessRepository.update(id, data);
    return await this.findOne(id);
  }
}
