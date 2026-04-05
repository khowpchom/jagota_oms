import type { ReactNode } from "react";
import { StatusBadge } from "../ui/StatusBadge";
import type { OrderStatus } from "../../types";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  status?: OrderStatus;
}

export function PageLayout({ children, title, status }: PageLayoutProps) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {status && <StatusBadge status={status} />}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
