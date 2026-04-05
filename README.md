# 📦 Jagota Order Management System (OMS)

A full-stack Order Management System built with NestJS, React, and MySQL, following Clean Architecture principles.

---

## 🚀 Tech Stack

- **Backend:** NestJS (Node.js framework)
- **Frontend:** React 18 (Vite) + TypeScript + TailwindCSS
- **Database:** MySQL 8.0 (via Docker Compose)
- **ORM:** TypeORM
- **State Management:** TanStack Query (React Query)
- **API Client:** Axios
- **Testing:** Jest (Backend), Vitest & React Testing Library (Frontend)

---

## 🗄️ Database Design (Schema)

The database follows a strict relational schema using `UUID` for all primary keys.

| Table           | Description                  | Key Columns                                           | Relationships                             |
| :-------------- | :--------------------------- | :---------------------------------------------------- | :---------------------------------------- |
| **`Customer`**  | Stores customer profiles.    | `id`, `name`, `email`                                 | 1:N with `Order`                          |
| **`Product`**   | Product catalog & inventory. | `id`, `name`, `price`, `stock`, `sku`                 | 1:N with `OrderItem`                      |
| **`Order`**     | Represents a placed order.   | `id`, `customerId`, `totalAmount`, `status`           | N:1 with `Customer`, 1:N with `OrderItem` |
| **`OrderItem`** | Line items within an order.  | `id`, `orderId`, `productId`, `quantity`, `unitPrice` | N:1 with `Order` & `Product`              |

> 💡 **Note on `unitPrice`:** The system snapshots the product's price into the `OrderItem` at the time of purchase to ensure historical price integrity.

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js (v20+)
- Docker & Docker Compose

### 1. Start the Database

```bash
# From the project root directory
docker compose up -d
```

> 💡 **Database Seeding:**
> The system automatically seeds initial data when the Backend server starts for the first time (`OnModuleInit`).
>
> - **Customers:** 2 sample users (John Doe, Jane Smith).
> - **Products:** 5 sample items (Laptop, Mouse, Keyboard, Monitor, Headphones) with initial stock and prices in THB (฿).

### 2. Start the Backend

First, set up your environment variables:

```bash
cd backend
cp .env.example .env
```

Then, install dependencies and run:

```bash
# Install dependencies
npm install

# Run the server in development mode
npm run start:dev
```

- **API URL:** `http://localhost:3000`
- **Swagger Docs:** `http://localhost:3000/api/docs`
- _(Note: The database automatically seeds sample Customers and Products on the first run)._

### 3. Start the Frontend

First, set up your environment variables:

```bash
cd frontend
cp .env.example .env
```

Then, install dependencies and run:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

- **App URL:** `http://localhost:5173`

---

## 🧪 Running Tests

The project includes comprehensive full-case unit tests for both the frontend and backend, covering UI interactions, API pagination (Infinite Scroll), and database transactions (Pessimistic Locking).

### Backend Tests (Jest)

```bash
cd backend
npm run test
```

### Frontend Tests (Vitest)

```bash
cd frontend
npm run test
```

---

## 🏗 Architecture & Business Rules

### Clean Architecture (Backend)

- **Domain Layer:** Entities defining the core business objects.
- **Application Layer:** Services containing business logic, including transactional operations and **Pessimistic Locking**.
- **Interface Layer:** Controllers exposing REST APIs.
- **Infrastructure Layer:** TypeORM and MySQL configurations.

### Core Business Rules

1. **Stock Validation:** Orders can only be created if products have sufficient stock.
2. **Atomic Transactions:** Creating an order and deducting stock happens in a single SQL transaction.
3. **Concurrency Control:** Uses Pessimistic Locking during stock deduction to prevent race conditions.
4. **Status State Machine:** Order status flows strictly: `PENDING` ➔ `PROCESSING` ➔ `DELIVERED` (Cannot move backwards).
5. **Pagination:** Implements Infinite Scroll for fetching orders efficiently.
