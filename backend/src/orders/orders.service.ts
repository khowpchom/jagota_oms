import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from '../domain/entities/order.entity';
import { OrderItem } from '../domain/entities/order-item.entity';
import { Product } from '../domain/entities/product.entity';
import { Customer } from '../domain/entities/customer.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = await queryRunner.manager.findOne(Customer, {
        where: { id: createOrderDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId },
          lock: { mode: 'pessimistic_write' }, // Lock for update
        });

        if (!product) {
          throw new NotFoundException(`Product ${itemDto.productId} not found`);
        }

        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}`,
          );
        }

        // Deduct stock
        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        // Calculate amount
        totalAmount += Number(product.price) * itemDto.quantity;

        // Prepare order item
        const orderItem = new OrderItem();
        orderItem.productId = product.id;
        orderItem.quantity = itemDto.quantity;
        orderItem.unitPrice = product.price;

        orderItems.push(orderItem);
      }

      // Save Order
      const order = new Order();
      order.customerId = customer.id;
      order.totalAmount = totalAmount;
      order.items = orderItems;

      const savedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      return this.findOne(savedOrder.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Order[]; nextCursor: number | null }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.orderRepository.findAndCount({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const nextCursor = skip + limit < total ? page + 1 : null;
    return { data, nextCursor };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id);

    const statusOrder = [
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.DELIVERED,
    ];
    const currentIndex = statusOrder.indexOf(order.status);
    const nextIndex = statusOrder.indexOf(updateOrderStatusDto.status);

    if (nextIndex < currentIndex) {
      throw new BadRequestException(
        `Cannot move status backwards from ${order.status} to ${updateOrderStatusDto.status}`,
      );
    }

    if (nextIndex > currentIndex + 1) {
      throw new BadRequestException(
        `Invalid status transition. Cannot skip from ${order.status} directly to ${updateOrderStatusDto.status}`,
      );
    }

    order.status = updateOrderStatusDto.status;
    return this.orderRepository.save(order);
  }
}
