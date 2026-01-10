import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BusinessService } from 'src/business/business.service';
import { PRODUCT_REPOSITORY, SERVICE_REPOSITORY } from 'src/constants';
import { In, Repository } from 'typeorm';
import type { Product } from './entities/product.entity';
import { Service } from './entities/service.entity';
import { IVerifyOwnershipParams } from 'src/customer/interfaces/customer.interfaces';
import {
  ICreateProductParams,
  ICreateServiceParams,
  IDeleteProductParams,
  IDeleteServiceParams,
  IFindOneProductParams,
  IFindOneServiceParams,
  IGetProductsByIdsParams,
  IGetServicesByIdsParams,
  ISearchProductsAndServicesParams,
  IUpdateProductParams,
  IUpdateServiceParams,
} from './interfaces/resource.interfaces';

@Injectable()
export class ResourceService {
  private logger = new Logger(ResourceService.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY) private productRepository: Repository<Product>,
    @Inject(SERVICE_REPOSITORY) private serviceRepository: Repository<Service>,
    private readonly businessService: BusinessService,
  ) {}

  private async verifyBusinessOwnership(params: IVerifyOwnershipParams) {
    const { businessId, ownerId } = params;

    if (!ownerId) {
      this.logger.warn(`Owner ID is missing in ownership verification`);
      throw new UnauthorizedException(
        'Unauthorized attempt to access resource',
      );
    }

    const business = await this.businessService.findOne({ businessId });
    if (!business || !(business.ownerId === ownerId)) {
      this.logger.warn(`Ownership verification failed for owner`);
      throw new UnauthorizedException(
        'Unauthorized attempt to access resource',
      );
    }
  }

  async searchProductsAndServices(params: ISearchProductsAndServicesParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    // Set default pagination
    const limit = params.limit ?? 20;
    const page = params.page ?? 1;
    const skip = (page - 1) * limit;

    let productQuery = this.productRepository
      .createQueryBuilder('product')
      .where('product.businessId = :businessId', {
        businessId: params.businessId,
      })
      .andWhere('product.name ILIKE :searchTerm', {
        searchTerm: `%${params.searchQuery}%`,
      });

    if (params.searchFilters?.minPrice !== undefined) {
      productQuery = productQuery.andWhere('product.price >= :minPrice', {
        minPrice: params.searchFilters.minPrice,
      });
    }
    if (params.searchFilters?.maxPrice !== undefined) {
      productQuery = productQuery.andWhere('product.price <= :maxPrice', {
        maxPrice: params.searchFilters.maxPrice,
      });
    }

    let serviceQuery = this.serviceRepository
      .createQueryBuilder('service')
      .where('service.businessId = :businessId', {
        businessId: params.businessId,
      })
      .andWhere('service.name ILIKE :searchTerm', {
        searchTerm: `%${params.searchQuery}%`,
      });

    if (params.searchFilters?.minPrice !== undefined) {
      serviceQuery = serviceQuery.andWhere('service.price >= :minPrice', {
        minPrice: params.searchFilters.minPrice,
      });
    }
    if (params.searchFilters?.maxPrice !== undefined) {
      serviceQuery = serviceQuery.andWhere('service.price <= :maxPrice', {
        maxPrice: params.searchFilters.maxPrice,
      });
    }

    // Apply pagination
    productQuery = productQuery.skip(skip).take(limit);
    serviceQuery = serviceQuery.skip(skip).take(limit);

    const [products, services] = await Promise.all([
      productQuery.getMany(),
      serviceQuery.getMany(),
    ]);

    return { products, services };
  }

  async createProduct(params: ICreateProductParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const newProduct = this.productRepository.create({
      businessId: params.businessId,
      name: params.name,
      primaryImage: params.primaryImage,
      supportingImages: params.supportingImages,
      availableQuantity: params.availableQuantity,
      description: params.description,
      notes: params.notes,
      price: params.price,
    });
    return this.productRepository.save(newProduct);
  }

  async createService(params: ICreateServiceParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const newService = this.serviceRepository.create({
      businessId: params.businessId,
      name: params.name,
      primaryImage: params.primaryImage,
      supportingImages: params.supportingImages,
      description: params.description,
      notes: params.notes,
      price: params.price,
      businessHours: params.businessHours,
    });
    return this.serviceRepository.save(newService);
  }

  async updateProduct(params: IUpdateProductParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const product = await this.productRepository.findOne({
      where: { id: params.productId, businessId: params.businessId },
    });
    if (!product) {
      this.logger.warn(`Product not found for update`);
      throw new NotFoundException('Product not found');
    }
    Object.assign(product, {
      name: params.name ?? product.name,
      primaryImage: params.primaryImage ?? product.primaryImage,
      supportingImages: params.supportingImages ?? product.supportingImages,
      availableQuantity: params.availableQuantity ?? product.availableQuantity,
      description: params.description ?? product.description,
      notes: params.notes ?? product.notes,
      price: params.price ?? product.price,
    });
    return this.productRepository.save(product);
  }

  async updateService(params: IUpdateServiceParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const service = await this.serviceRepository.findOne({
      where: { id: params.serviceId, businessId: params.businessId },
    });
    if (!service) {
      this.logger.warn(`Service not found for update`);
      throw new NotFoundException('Service not found');
    }
    Object.assign(service, {
      name: params.name ?? service.name,
      primaryImage: params.primaryImage ?? service.primaryImage,
      supportingImages: params.supportingImages ?? service.supportingImages,
      description: params.description ?? service.description,
      notes: params.notes ?? service.notes,
      price: params.price ?? service.price,
      businessHours: params.businessHours ?? service.businessHours,
    });
    return this.serviceRepository.save(service);
  }

  async findManyProducts(params: IGetProductsByIdsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const products = await this.productRepository.findBy({
      id: In(params.productIds),
      businessId: params.businessId,
    });
    return products;
  }

  async findManyServices(params: IGetServicesByIdsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const services = await this.serviceRepository.findBy({
      id: In(params.serviceIds),
      businessId: params.businessId,
    });
    return services;
  }

  async findOneProduct(params: IFindOneProductParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const product = await this.productRepository.findOne({
      where: { id: params.productId, businessId: params.businessId },
    });
    if (!product) {
      this.logger.warn(`Product not found: ${params.productId}`);
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findOneService(params: IFindOneServiceParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const service = await this.serviceRepository.findOne({
      where: { id: params.serviceId, businessId: params.businessId },
    });
    if (!service) {
      this.logger.warn(`Service not found: ${params.serviceId}`);
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async deleteProduct(params: IDeleteProductParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const product = await this.productRepository.findOne({
      where: { id: params.productId, businessId: params.businessId },
    });
    if (!product) {
      this.logger.warn(`Attempted to delete non-existing product`);
      throw new UnauthorizedException('Unauthorized attempt to delete product'); //Mitigate information leakage
    }
    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }

  async deleteService(params: IDeleteServiceParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const service = await this.serviceRepository.findOne({
      where: { id: params.serviceId, businessId: params.businessId },
    });
    if (!service) {
      this.logger.warn(`Attempted to delete non-existing service`);
      throw new UnauthorizedException('Unauthorized attempt to delete service'); //Mitigate information leakage
    }
    await this.serviceRepository.remove(service);
    return { message: 'Service deleted successfully' };
  }
}
