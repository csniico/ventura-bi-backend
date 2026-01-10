import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { SearchQueryDto } from './dto/search-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FindResourceDto } from './dto/find-resource.dto';

@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourceController {
  private readonly logger = new Logger(ResourceController.name);

  constructor(private readonly resourceService: ResourceService) {}

  private getUserId(req: { user: { userId: string } }): string | null {
    if ('userId' in req.user) {
      return req.user.userId;
    } else {
      return null;
    }
  }

  @Get('/search')
  async searchResources(
    @Req() req: { user: { userId: string } },
    @Query() query: SearchQueryDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    return await this.resourceService.searchProductsAndServices({
      ownerId,
      businessId: query.businessId,
      searchQuery: query.q,
      searchFilters:
        query.filters === 'on'
          ? {
              minPrice: query.minPrice,
              maxPrice: query.maxPrice,
              minAvailableQuantity: query.minQty,
            }
          : undefined,
      limit: query.limit,
      page: query.page,
    });
  }

  @Get('/')
  async findResources(
    @Req() req: { user: { userId: string } },
    @Query() query: FindResourceDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    if (query.type === 'product') {
      if (query.filter === 'one') {
        return await this.resourceService.findOneProduct({
          ownerId,
          businessId: query.businessId,
          productId: query.resourceId!,
        });
      } else {
        // For 'many', we'll use findManyProducts with IDs
        // Note: This needs productIds array, so this endpoint might need adjustment
        // For now, returning a message
        throw new UnauthorizedException(
          'Use /search endpoint for finding many products',
        );
      }
    } else {
      if (query.filter === 'one') {
        return await this.resourceService.findOneService({
          ownerId,
          businessId: query.businessId,
          serviceId: query.resourceId!,
        });
      } else {
        throw new UnauthorizedException(
          'Use /search endpoint for finding many services',
        );
      }
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/product')
  async createProduct(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateProductDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    return await this.resourceService.createProduct({
      ownerId,
      businessId: dto.businessId,
      name: dto.name,
      primaryImage: dto.primaryImage,
      supportingImages: dto.supportingImages,
      availableQuantity: dto.availableQuantity,
      description: dto.description,
      notes: dto.notes,
      price: dto.price,
    });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/service')
  async createService(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateServiceDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    return await this.resourceService.createService({
      ownerId,
      businessId: dto.businessId,
      name: dto.name,
      primaryImage: dto.primaryImage,
      supportingImages: dto.supportingImages,
      description: dto.description,
      notes: dto.notes,
      price: dto.price,
      businessHours: dto.businessHours,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Put('/product/:productId')
  async updateProduct(
    @Req() req: { user: { userId: string } },
    @Param('productId') productId: string,
    @Query('businessId') businessId: string,
    @Body() dto: UpdateProductDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    return await this.resourceService.updateProduct({
      ownerId,
      businessId,
      productId,
      name: dto.name,
      primaryImage: dto.primaryImage,
      supportingImages: dto.supportingImages,
      availableQuantity: dto.availableQuantity,
      description: dto.description,
      notes: dto.notes,
      price: dto.price,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Put('/service/:serviceId')
  async updateService(
    @Req() req: { user: { userId: string } },
    @Param('serviceId') serviceId: string,
    @Query('businessId') businessId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    return await this.resourceService.updateService({
      ownerId,
      businessId,
      serviceId,
      name: dto.name,
      primaryImage: dto.primaryImage,
      supportingImages: dto.supportingImages,
      description: dto.description,
      notes: dto.notes,
      price: dto.price,
      businessHours: dto.businessHours,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/product/:productId')
  async deleteProduct(
    @Req() req: { user: { userId: string } },
    @Param('productId') productId: string,
    @Query('businessId') businessId: string,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    return await this.resourceService.deleteProduct({
      ownerId,
      businessId,
      productId,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/service/:serviceId')
  async deleteService(
    @Req() req: { user: { userId: string } },
    @Param('serviceId') serviceId: string,
    @Query('businessId') businessId: string,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    return await this.resourceService.deleteService({
      ownerId,
      businessId,
      serviceId,
    });
  }
}
