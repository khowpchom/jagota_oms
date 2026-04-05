import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, OrderStatus } from '../domain/entities/order.entity';
import { Product } from '../domain/entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Customer } from '../domain/entities/customer.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: Repository<Order>;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const customer = { id: 'c1', name: 'John Doe' };
      const product = { id: 'p1', name: 'Laptop', price: '1000', stock: 10 };
      const createOrderDto = {
        customerId: 'c1',
        items: [{ productId: 'p1', quantity: 2 }],
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(customer) // Find customer
        .mockResolvedValueOnce(product); // Find product

      const savedOrder = {
        id: 'o1',
        customerId: 'c1',
        totalAmount: 2000,
        items: [],
      };
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(product) // Save updated product stock
        .mockResolvedValueOnce(savedOrder); // Save order

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(savedOrder as unknown as Order);

      const result = await service.createOrder(createOrderDto);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(Customer, {
        where: { id: 'c1' },
      });
      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(Product, {
        where: { id: 'p1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(product.stock).toBe(8); // Stock deducted
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', stock: 8 }),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.any(Order),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(savedOrder);
    });

    it('should throw NotFoundException if customer not found', async () => {
      const createOrderDto = {
        customerId: 'c1',
        items: [{ productId: 'p1', quantity: 2 }],
      };
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      const customer = { id: 'c1', name: 'John Doe' };
      const createOrderDto = {
        customerId: 'c1',
        items: [{ productId: 'p1', quantity: 2 }],
      };
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce(null);

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const customer = { id: 'c1', name: 'John Doe' };
      const product = { id: 'p1', name: 'Laptop', price: '1000', stock: 1 };
      const createOrderDto = {
        customerId: 'c1',
        items: [{ productId: 'p1', quantity: 2 }],
      };
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce(product);

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should prevent race conditions by throwing BadRequestException when concurrent request reads updated stock', async () => {
      const customer = { id: 'c1', name: 'John Doe' };
      // User 1 reads stock = 1
      const productForUser1 = {
        id: 'p1',
        name: 'Laptop',
        price: '1000',
        stock: 1,
      };
      // User 2 reads stock = 0 (after User 1's pessimistic lock is released and stock is deducted)
      const productForUser2 = {
        id: 'p1',
        name: 'Laptop',
        price: '1000',
        stock: 0,
      };

      const createOrderDto = {
        customerId: 'c1',
        items: [{ productId: 'p1', quantity: 1 }],
      };

      // Simulate User 1 success
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce(productForUser1);

      mockQueryRunner.manager.save.mockResolvedValueOnce({
        ...productForUser1,
        stock: 0,
      }); // save product
      mockQueryRunner.manager.save.mockResolvedValueOnce({ id: 'o1' }); // save order

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce({ id: 'o1' } as unknown as Order);

      await service.createOrder(createOrderDto); // User 1 succeeds

      // Simulate User 2 coming in right after lock is released
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce(productForUser2);

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const orders = [{ id: 'o1' }, { id: 'o2' }];
      const findAndCountSpy = jest
        .spyOn(orderRepo, 'findAndCount')
        .mockResolvedValue([orders as Order[], 2]);

      const result = await service.findAll(1, 10);
      expect(result.data).toEqual(orders);
      expect(result.nextCursor).toBeNull();
      expect(findAndCountSpy).toHaveBeenCalledWith({
        relations: ['customer'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('should return nextCursor when there are more orders', async () => {
      const orders = [{ id: 'o1' }];
      jest
        .spyOn(orderRepo, 'findAndCount')
        .mockResolvedValue([orders as Order[], 5]);

      const result = await service.findAll(1, 1);
      expect(result.data).toEqual(orders);
      expect(result.nextCursor).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return an order if found', async () => {
      const order = { id: 'o1', customer: {}, items: [] };
      jest
        .spyOn(orderRepo, 'findOne')
        .mockResolvedValue(order as unknown as Order);

      const result = await service.findOne('o1');
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException if order not found', async () => {
      jest.spyOn(orderRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status successfully (PENDING to PROCESSING)', async () => {
      const order = { id: 'o1', status: OrderStatus.PENDING };
      jest.spyOn(service, 'findOne').mockResolvedValue(order as Order);
      const saveSpy = jest.spyOn(orderRepo, 'save').mockResolvedValue({
        ...order,
        status: OrderStatus.PROCESSING,
      } as Order);

      const result = await service.updateStatus('o1', {
        status: OrderStatus.PROCESSING,
      });
      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(saveSpy).toHaveBeenCalledWith({
        ...order,
        status: OrderStatus.PROCESSING,
      });
    });

    it('should throw BadRequestException when moving status backwards', async () => {
      const order = { id: 'o1', status: OrderStatus.DELIVERED };
      jest.spyOn(service, 'findOne').mockResolvedValue(order as Order);

      await expect(
        service.updateStatus('o1', { status: OrderStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
