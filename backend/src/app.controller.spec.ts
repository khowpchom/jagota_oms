import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from './domain/entities/customer.entity';
import { Product } from './domain/entities/product.entity';

import { Repository } from 'typeorm';

describe('AppController', () => {
  let appController: AppController;
  let mockCustomerRepo: Partial<Record<keyof Repository<Customer>, jest.Mock>>;
  let mockProductRepo: Partial<Record<keyof Repository<Product>, jest.Mock>>;

  beforeEach(async () => {
    mockCustomerRepo = {
      find: jest.fn().mockResolvedValue([{ id: '1', name: 'John Doe' }]),
    };
    mockProductRepo = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: '1', name: 'Laptop', price: 999.99 }]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepo,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('customers and products', () => {
    it('should return an array of customers', async () => {
      const customers = await appController.getCustomers();
      expect(customers).toEqual([{ id: '1', name: 'John Doe' }]);
      expect(mockCustomerRepo.find).toHaveBeenCalledTimes(1);
    });

    it('should return an array of products', async () => {
      const products = await appController.getProducts();
      expect(products).toEqual([{ id: '1', name: 'Laptop', price: 999.99 }]);
      expect(mockProductRepo.find).toHaveBeenCalledTimes(1);
    });
  });
});
