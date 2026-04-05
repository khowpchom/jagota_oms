import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OrderDetailView from "./OrderDetailView";
import { MemoryRouter } from "react-router-dom";
import * as useApi from "../hooks/useApi";

vi.mock("../hooks/useApi");

const mockUseOrder = useApi.useOrder as unknown as ReturnType<typeof vi.fn>;
const mockUseUpdateOrderStatus =
  useApi.useUpdateOrderStatus as unknown as ReturnType<typeof vi.fn>;

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "1" }),
  };
});

describe("OrderDetailView", () => {
  const mutateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrder.mockReturnValue({
      data: {
        id: "1",
        status: "PENDING",
        totalAmount: "100.00",
        createdAt: "2023-01-01T00:00:00Z",
        customer: { id: "c1", name: "John Doe", email: "john@example.com" },
        items: [
          {
            id: "i1",
            quantity: 2,
            unitPrice: "50.00",
            product: { id: "p1", name: "Product X", sku: "SKU-1" },
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    mockUseUpdateOrderStatus.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });
  });

  it("renders loading state", () => {
    mockUseOrder.mockReturnValue({ isLoading: true });
    render(<OrderDetailView />, { wrapper: MemoryRouter });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockUseOrder.mockReturnValue({
      error: new Error("Not found"),
      isLoading: false,
    });
    render(<OrderDetailView />, { wrapper: MemoryRouter });
    expect(screen.getByText(/Order not found/i)).toBeInTheDocument();
  });

  it("renders order details correctly", () => {
    render(<OrderDetailView />, { wrapper: MemoryRouter });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Product X")).toBeInTheDocument();
    expect(screen.getByText("SKU: SKU-1")).toBeInTheDocument();
    expect(screen.getByText("฿100.00")).toBeInTheDocument();
  });

  it("allows updating status from PENDING to PROCESSING", async () => {
    render(<OrderDetailView />, { wrapper: MemoryRouter });

    const processingButton = screen.getByText("Mark as Processing");
    expect(processingButton).not.toBeDisabled();

    fireEvent.click(processingButton);

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        { id: "1", statusData: { status: "PROCESSING" } },
        expect.any(Object),
      );
    });
  });

  it("disables backwards status updates", () => {
    mockUseOrder.mockReturnValue({
      data: {
        id: "1",
        status: "DELIVERED",
        totalAmount: "100.00",
        createdAt: "2023-01-01T00:00:00Z",
      },
      isLoading: false,
    });

    render(<OrderDetailView />, { wrapper: MemoryRouter });

    const processingButton = screen.getByText("Mark as Processing");
    const deliveredButton = screen.getByText("Mark as Delivered");

    expect(processingButton).toBeDisabled();
    expect(deliveredButton).toBeDisabled();
  });

  it("shows error when updating status fails", async () => {
    mutateMock.mockImplementation((data, options) => {
      options.onError(new Error("Update failed"));
    });

    render(<OrderDetailView />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText("Mark as Processing"));

    await waitFor(() => {
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });
  });
});
