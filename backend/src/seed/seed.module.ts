import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Customer } from '../domain/entities/customer.entity';
import { Product } from '../domain/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Product])],
  providers: [SeedService],
})
export class SeedModule {}
