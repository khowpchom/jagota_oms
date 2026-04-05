export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export interface Order {
  id: string;
  customerId: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface CreateOrderDto {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
