import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../domain/entities/order.entity';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            createOrder: jest.fn().mockResolvedValue({ id: 'o1' }),
            findAll: jest
              .fn()
              .mockResolvedValue({ data: [{ id: 'o1' }], nextCursor: null }),
            findOne: jest.fn().mockResolvedValue({ id: 'o1' }),
            updateStatus: jest
              .fn()
              .mockResolvedValue({ id: 'o1', status: OrderStatus.PROCESSING }),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should create an order', async () => {
    const dto = { customerId: 'c1', items: [{ productId: 'p1', quantity: 2 }] };
    const createOrderSpy = jest.spyOn(service, 'createOrder');
    const result = await controller.create(dto);
    expect(result).toEqual({ id: 'o1' });
    expect(createOrderSpy).toHaveBeenCalledWith(dto);
  });

  it('should find all orders with pagination', async () => {
    const findAllSpy = jest.spyOn(service, 'findAll');
    const result = await controller.findAll('1', '10');
    expect(result).toEqual({ data: [{ id: 'o1' }], nextCursor: null });
    expect(findAllSpy).toHaveBeenCalledWith(1, 10);
  });

  it('should find one order', async () => {
    const findOneSpy = jest.spyOn(service, 'findOne');
    const result = await controller.findOne('o1');
    expect(result).toEqual({ id: 'o1' });
    expect(findOneSpy).toHaveBeenCalledWith('o1');
  });

  it('should update order status', async () => {
    const updateStatusSpy = jest.spyOn(service, 'updateStatus');
    const dto = { status: OrderStatus.PROCESSING };
    const result = await controller.updateStatus('o1', dto);
    expect(result).toEqual({ id: 'o1', status: OrderStatus.PROCESSING });
    expect(updateStatusSpy).toHaveBeenCalledWith('o1', dto);
  });
});
