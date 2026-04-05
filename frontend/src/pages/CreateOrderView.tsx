import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { useCustomers, useProducts, useCreateOrder } from "../hooks/useApi";

export default function CreateOrderView() {
  const navigate = useNavigate();
  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: "productId" | "quantity",
    value: string | number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer");
      return;
    }

    // Validate items
    const invalidItems = items.some(
      (item) => !item.productId || item.quantity < 1,
    );
    if (invalidItems) {
      setError(
        "Please ensure all items have a selected product and a valid quantity",
      );
      return;
    }

    // Validate stock
    const stockErrors: string[] = [];
    items.forEach((item) => {
      const product = products?.find((p) => p.id === item.productId);
      if (product && item.quantity > product.stock) {
        stockErrors.push(
          `Insufficient stock for ${product.name} (Available: ${product.stock})`,
        );
      }
    });

    if (stockErrors.length > 0) {
      setError(stockErrors.join(". "));
      return;
    }

    createOrder(
      { customerId, items },
      {
        onSuccess: () => {
          navigate("/");
        },
        onError: (err: unknown) => {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to create order");
          }
        },
      },
    );
  };

  // Calculate total preview
  const calculateTotal = () => {
    return items.reduce((total, item) => {
      if (item.productId && products) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          return total + Number(product.price) * item.quantity;
        }
      }
      return total;
    }, 0);
  };

  if (loadingCustomers || loadingProducts) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate("/")}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <ShoppingCart className="w-6 h-6 mr-2 text-blue-600" />
          Create New Order
        </h2>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label
              htmlFor="customer"
              className="block text-sm font-medium text-gray-700"
            >
              Customer
            </label>
            <select
              id="customer"
              name="customer"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Order Items
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-end gap-4 bg-gray-50 p-4 rounded-md border border-gray-200"
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`product-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Product
                    </label>
                    <select
                      id={`product-${index}`}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                      value={item.productId}
                      onChange={(e) =>
                        handleItemChange(index, "productId", e.target.value)
                      }
                      required
                    >
                      <option value="" disabled>
                        Select product
                      </option>
                      {products?.map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                          disabled={product.stock === 0}
                        >
                          {product.name} - ฿
                          {Number(product.price).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      required
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="mb-1 p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-base font-medium text-gray-700">
                Estimated Total:
              </span>
              <span className="text-2xl font-bold text-gray-900">
                ฿
                {calculateTotal().toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
