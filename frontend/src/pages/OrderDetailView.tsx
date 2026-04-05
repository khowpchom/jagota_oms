import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Package, User, Calendar, CreditCard } from "lucide-react";
import { useOrder, useUpdateOrderStatus } from "../hooks/useApi";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/Button";
import type { OrderStatus } from "../types";

export default function OrderDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useOrder(id as string);
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateOrderStatus();

  const [updateError, setUpdateError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageLayout title="Order Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }

  if (error || !order) {
    return (
      <PageLayout title="Order Details">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-red-700">
            Order not found or error loading order details.
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Return to Orders List
          </button>
        </div>
      </PageLayout>
    );
  }

  const handleStatusChange = (newStatus: OrderStatus) => {
    setUpdateError(null);
    updateStatus(
      { id: order.id, statusData: { status: newStatus } },
      {
        onError: (err: unknown) => {
          if (err instanceof Error) {
            setUpdateError(err.message);
          } else {
            setUpdateError("Failed to update status");
          }
        },
      },
    );
  };

  // Helper to determine if a status option should be disabled
  const isStatusDisabled = (targetStatus: OrderStatus) => {
    const statusOrder = ["PENDING", "PROCESSING", "DELIVERED"];
    const currentIndex = statusOrder.indexOf(order.status);
    const targetIndex = statusOrder.indexOf(targetStatus);

    // Cannot move backwards, select current status, or skip steps (e.g. PENDING -> DELIVERED)
    return targetIndex <= currentIndex || targetIndex > currentIndex + 1;
  };

  return (
    <PageLayout title={`Order #${order.id.slice(0, 8)}`} status={order.status}>
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      {updateError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{updateError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-gray-400" />
                Order Items
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {order.items?.map((item) => (
                <li
                  key={item.id}
                  className="px-4 py-4 sm:px-6 flex items-center"
                >
                  <div className="min-w-0 flex-1 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                      <div>
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {item.product?.name || "Unknown Product"}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500">
                          SKU: {item.product?.sku || "N/A"}
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div>
                          <p className="text-sm text-gray-900">
                            {item.quantity} × ฿
                            {Number(item.unitPrice).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="mt-2 text-sm font-medium text-gray-900">
                            Total: ฿
                            {(
                              item.quantity * Number(item.unitPrice)
                            ).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 px-4 py-5 sm:px-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-base font-medium text-gray-700">
                  Order Total
                </span>
                <span className="text-xl font-bold text-gray-900">
                  ฿
                  {Number(order.totalAmount).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-400" />
                Customer Info
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {order.customer?.name || "Unknown"}
                  </dd>
                </div>
                <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                    {order.customer?.email || "N/A"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-gray-400" />
                Order Information
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-2 sm:py-3">
                  <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Date Placed
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
                <div className="py-2 sm:py-3">
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    Order ID
                  </dt>
                  <dd className="text-xs text-gray-900 font-mono break-all bg-gray-50 p-2 rounded border border-gray-200">
                    {order.id}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Update Status
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-3">
                <Button
                  onClick={() => handleStatusChange("PROCESSING")}
                  disabled={isStatusDisabled("PROCESSING") || isUpdating}
                  variant="primary"
                  className="w-full"
                >
                  {isUpdating && order.status === "PENDING"
                    ? "Updating..."
                    : "Mark as Processing"}
                </Button>
                <Button
                  onClick={() => handleStatusChange("DELIVERED")}
                  disabled={isStatusDisabled("DELIVERED") || isUpdating}
                  variant="success"
                  className="w-full"
                >
                  {isUpdating && order.status === "PROCESSING"
                    ? "Updating..."
                    : "Mark as Delivered"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">
                Status can only move forward: Pending → Processing → Delivered.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
