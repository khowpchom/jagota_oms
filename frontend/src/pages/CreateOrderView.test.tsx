import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateOrderView from "./CreateOrderView";
import { MemoryRouter } from "react-router-dom";
import * as useApi from "../hooks/useApi";

vi.mock("../hooks/useApi");

const mockUseCustomers = useApi.useCustomers as unknown as ReturnType<
  typeof vi.fn
>;
const mockUseProducts = useApi.useProducts as unknown as ReturnType<
  typeof vi.fn
>;
const mockUseCreateOrder = useApi.useCreateOrder as unknown as ReturnType<
  typeof vi.fn
>;

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CreateOrderView", () => {
  const mutateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCustomers.mockReturnValue({
      data: [{ id: "c1", name: "Customer A" }],
      isLoading: false,
    });

    mockUseProducts.mockReturnValue({
      data: [
        { id: "p1", name: "Product X", price: "10.00", stock: 100 },
        { id: "p2", name: "Product Y", price: "20.00", stock: 50 },
      ],
      isLoading: false,
    });

    mockUseCreateOrder.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });
  });

  it("renders form and allows submitting order", async () => {
    render(<CreateOrderView />, { wrapper: MemoryRouter });

    // Select customer
    fireEvent.change(screen.getByRole("combobox", { name: /^Customer$/i }), {
      target: { value: "c1" },
    });

    // Select product
    fireEvent.change(screen.getByRole("combobox", { name: /^Product$/i }), {
      target: { value: "p1" },
    });

    // Submit form
    fireEvent.click(screen.getByText(/Create Order/i));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        { customerId: "c1", items: [{ productId: "p1", quantity: 1 }] },
        expect.any(Object),
      );
    });
  });

  it("adds and removes items", async () => {
    render(<CreateOrderView />, { wrapper: MemoryRouter });

    // Add item
    fireEvent.click(screen.getByText(/Add Item/i));
    const productSelects = screen.getAllByRole("combobox", {
      name: /^Product$/i,
    });
    expect(productSelects.length).toBe(2);

    // Select second product
    fireEvent.change(productSelects[1], { target: { value: "p2" } });

    // Remove item
    const removeButtons = screen.getAllByTitle("Remove item");
    fireEvent.click(removeButtons[0]);

    const remainingSelects = screen.getAllByRole("combobox", {
      name: /^Product$/i,
    });
    expect(remainingSelects.length).toBe(1);
    expect((remainingSelects[0] as HTMLSelectElement).value).toBe("p2");
  });

  it("shows error when creating order fails", async () => {
    mutateMock.mockImplementation((data, options) => {
      options.onError(new Error("Test error"));
    });

    render(<CreateOrderView />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByRole("combobox", { name: /^Customer$/i }), {
      target: { value: "c1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /^Product$/i }), {
      target: { value: "p1" },
    });
    fireEvent.click(screen.getByText(/Create Order/i));

    await waitFor(() => {
      expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    });
  });
});
