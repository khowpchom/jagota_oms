import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './domain/entities/customer.entity';
import { Product } from './domain/entities/product.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('core')
@Controller('api')
export class AppController {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  @Get('customers')
  @ApiOperation({ summary: 'Get all customers' })
  getCustomers() {
    return this.customerRepo.find();
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  getProducts() {
    return this.productRepo.find();
  }
}
