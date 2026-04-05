import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Customer } from './domain/entities/customer.entity';
import { Product } from './domain/entities/product.entity';
import { Order } from './domain/entities/order.entity';
import { OrderItem } from './domain/entities/order-item.entity';
import { OrdersModule } from './orders/orders.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [Customer, Product, Order, OrderItem],
        synchronize: true, // Use synchronize: true for development as requested
        timezone: 'Z', // Force UTC timezone
      }),
      inject: [ConfigService],
    }),
    OrdersModule,
    SeedModule,
    TypeOrmModule.forFeature([Customer, Product]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
