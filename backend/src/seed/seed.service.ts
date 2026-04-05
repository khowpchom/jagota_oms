import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../domain/entities/customer.entity';
import { Product } from '../domain/entities/product.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.seedCustomers();
    await this.seedProducts();
  }

  private async seedCustomers() {
    const count = await this.customerRepo.count();
    if (count === 0) {
      await this.customerRepo.save([
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
      ]);
      console.log('Seeded 2 customers.');
    }
  }

  private async seedProducts() {
    const count = await this.productRepo.count();
    if (count === 0) {
      await this.productRepo.save([
        { name: 'Laptop', price: 35000.0, stock: 50, sku: 'SKU-LAPTOP-001' },
        { name: 'Mouse', price: 890.0, stock: 100, sku: 'SKU-MOUSE-002' },
        { name: 'Keyboard', price: 1590.0, stock: 80, sku: 'SKU-KEYBOARD-003' },
        { name: 'Monitor', price: 6990.0, stock: 30, sku: 'SKU-MONITOR-004' },
        {
          name: 'Headphones',
          price: 2590.0,
          stock: 60,
          sku: 'SKU-HEADPHONES-005',
        },
      ]);
      console.log('Seeded 5 products.');
    }
  }
}
