import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { api } from "../lib/api";
import type {
  Order,
  CreateOrderDto,
  UpdateOrderStatusDto,
  Customer,
  Product,
} from "../types";

// Fetch all orders
export const useOrders = () => {
  return useInfiniteQuery({
    queryKey: ["orders"],
    queryFn: async ({
      pageParam = 1,
    }): Promise<{ data: Order[]; nextCursor: number | null }> => {
      const { data } = await api.get(`/orders?page=${pageParam}&limit=10`);
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
  });
};

// Fetch order details
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async (): Promise<Order> => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Fetch customers
export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async (): Promise<Customer[]> => {
      const { data } = await api.get("/customers");
      return data;
    },
  });
};

// Fetch products
export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get("/products");
      return data;
    },
  });
};

// Create order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderData: CreateOrderDto): Promise<Order> => {
      const { data } = await api.post("/orders", orderData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Stock might have changed
    },
  });
};

// Update order status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      statusData,
    }: {
      id: string;
      statusData: UpdateOrderStatusDto;
    }): Promise<Order> => {
      const { data } = await api.patch(`/orders/${id}/status`, statusData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
    },
  });
};
