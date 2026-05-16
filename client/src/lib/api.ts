import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InvoiceData, ClientData, HamaliCategory, HamaliDailyRecord, DeliveryChallanData, Transporter, Product } from "./invoice-types";

const API_BASE = "/api";

// Client API
export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/clients`);
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json() as Promise<ClientData[]>;
    },
  });
}

export function useAddClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<ClientData, "id">) => {
      const res = await fetch(`${API_BASE}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
      if (!res.ok) throw new Error("Failed to create client");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientData> }) => {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update client");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete client");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// Invoice API
export function useInvoices(filters?: { search?: string, status?: string, fromDate?: string, toDate?: string }) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.status && filters.status !== "all") params.append("status", filters.status);
      if (filters?.fromDate) params.append("fromDate", filters.fromDate);
      if (filters?.toDate) params.append("toDate", filters.toDate);
      
      const res = await fetch(`${API_BASE}/invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json() as Promise<InvoiceData[]>;
    },
  });
}

export function useAddInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: Omit<InvoiceData, "id">) => {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create invoice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceData> }) => {
      const res = await fetch(`${API_BASE}/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update invoice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, password }: { id: string, password?: string }) => {
      const res = await fetch(`${API_BASE}/invoices/${id}`, { 
        method: "DELETE",
        headers: password ? { "X-Admin-Password": password } : undefined
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete invoice");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useDaybook(date: string) {
  return useQuery({
    queryKey: ["daybook", date],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/daybook?date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch daybook");
      return res.json() as Promise<{
        date: string;
        invoices: InvoiceData[];
        payments: any[];
        challans: any[];
        hamali: any[];
      }>;
    },
    enabled: !!date,
  });
}

// Settings API
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json() as Promise<Record<string, string>>;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// Audit Logs API
export function useAuditLogs() {
  return useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/audit-logs`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json() as Promise<any[]>;
    },
  });
}



// Hamali API

// Categories
export function useHamaliCategories() {
  return useQuery({
    queryKey: ["hamaliCategories"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hamali/categories`);
      if (!res.ok) throw new Error("Failed to fetch hamali categories");
      return res.json() as Promise<HamaliCategory[]>;
    },
  });
}

export function useAddHamaliCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Omit<HamaliCategory, "id">) => {
      const res = await fetch(`${API_BASE}/hamali/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
      if (!res.ok) throw new Error("Failed to create hamali category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hamaliCategories"] });
    },
  });
}

export function useUpdateHamaliCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HamaliCategory> }) => {
      const res = await fetch(`${API_BASE}/hamali/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update hamali category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hamaliCategories"] });
    },
  });
}

export function useDeleteHamaliCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/hamali/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete hamali category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hamaliCategories"] });
    },
  });
}

// Records
export function useHamaliRecords() {
  return useQuery({
    queryKey: ["hamaliRecords"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hamali/records`);
      if (!res.ok) throw new Error("Failed to fetch hamali records");
      return res.json() as Promise<HamaliDailyRecord[]>;
    },
  });
}

export function useAddHamaliRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<HamaliDailyRecord, "id" | "createdAt">) => {
      const res = await fetch(`${API_BASE}/hamali/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error("Failed to create hamali record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hamaliRecords"] });
    },
  });
}

export function useDeleteHamaliRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/hamali/records/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete hamali record");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hamaliRecords"] });
    },
  });
}

export function useUpdateHamaliRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`${API_BASE}/hamali/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update hamali record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hamaliRecords"] });
    },
  });
}
// Delivery Challan API
export function useDeliveryChallans() {
  return useQuery({
    queryKey: ["deliveryChallans"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/delivery-challans`);
      if (!res.ok) throw new Error("Failed to fetch delivery challans");
      return res.json() as Promise<DeliveryChallanData[]>;
    },
  });
}

export function useAddDeliveryChallan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (challan: DeliveryChallanData) => {
      const res = await fetch(`${API_BASE}/delivery-challans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challan),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create delivery challan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
    },
  });
}

export function useUpdateDeliveryChallan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeliveryChallanData> }) => {
      const res = await fetch(`${API_BASE}/delivery-challans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update delivery challan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
    },
  });
}

export function useDeleteDeliveryChallan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/delivery-challans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete delivery challan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
    },
  });
}

// Transporter API
// Transporter API

export function useTransporters() {
  return useQuery({
    queryKey: ["transporters"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/transporters`);
      if (!res.ok) throw new Error("Failed to fetch transporters");
      return res.json() as Promise<Transporter[]>;
    },
  });
}

export function useAddTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transporter: Omit<Transporter, "id" | "createdAt">) => {
      const res = await fetch(`${API_BASE}/transporters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transporter),
      });
      if (!res.ok) throw new Error("Failed to create transporter");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transporters"] });
    },
  });
}

export function useUpdateTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transporter> }) => {
      const res = await fetch(`${API_BASE}/transporters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update transporter");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transporters"] });
    },
  });
}

export function useDeleteTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/transporters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete transporter");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transporters"] });
    },
  });
}

// Product API
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json() as Promise<Product[]>;
    },
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: async () => {
      if (!query) return [];
      const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to search products");
      return res.json() as Promise<Product[]>;
    },
    enabled: query.length > 0,
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Omit<Product, "id" | "createdAt" | "updatedAt" | "isActive">) => {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
