import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OrderListView from "./OrderListView";
import { MemoryRouter } from "react-router-dom";
import * as useApi from "../hooks/useApi";
import { useInView } from "react-intersection-observer";

vi.mock("../hooks/useApi");
vi.mock("react-intersection-observer", () => ({
  useInView: vi.fn(),
}));

const mockUseOrders = useApi.useOrders as unknown as ReturnType<typeof vi.fn>;
const mockUseInView = useInView as unknown as ReturnType<typeof vi.fn>;

describe("OrderListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseInView.mockReturnValue({ ref: vi.fn(), inView: false });
  });

  it("should render loading state", () => {
    mockUseOrders.mockReturnValue({
      isLoading: true,
      data: undefined,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<OrderListView />, { wrapper: MemoryRouter });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should render error state", () => {
    mockUseOrders.mockReturnValue({
      isLoading: false,
      data: undefined,
      error: new Error("Failed to load"),
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<OrderListView />, { wrapper: MemoryRouter });
    expect(
      screen.getByText("Error loading orders. Please try again later."),
    ).toBeInTheDocument();
  });

  it("should render empty state", () => {
    mockUseOrders.mockReturnValue({
      isLoading: false,
      data: { pages: [{ data: [], nextCursor: null }] },
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<OrderListView />, { wrapper: MemoryRouter });
    expect(screen.getByText("No orders found.")).toBeInTheDocument();
  });

  it("should render orders list", () => {
    mockUseOrders.mockReturnValue({
      isLoading: false,
      data: {
        pages: [
          {
            data: [
              {
                id: "1234567890",
                customer: { name: "John Doe" },
                createdAt: "2026-04-05T12:00:00.000Z",
                totalAmount: "150.50",
                status: "PENDING",
              },
            ],
            nextCursor: null,
          },
        ],
      },
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<OrderListView />, { wrapper: MemoryRouter });
    expect(screen.getByText("12345678...")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("฿150.50")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("should call fetchNextPage when in view and hasNextPage is true", () => {
    const fetchNextPage = vi.fn();
    mockUseOrders.mockReturnValue({
      isLoading: false,
      data: { pages: [{ data: [], nextCursor: 2 }] },
      error: null,
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    });

    mockUseInView.mockReturnValue({ ref: vi.fn(), inView: true });

    render(<OrderListView />, { wrapper: MemoryRouter });
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
