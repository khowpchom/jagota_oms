import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./components/layout/Header";
import OrderListView from "./pages/OrderListView";
import CreateOrderView from "./pages/CreateOrderView";
import OrderDetailView from "./pages/OrderDetailView";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<OrderListView />} />
              <Route path="/orders/new" element={<CreateOrderView />} />
              <Route path="/orders/:id" element={<OrderDetailView />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
