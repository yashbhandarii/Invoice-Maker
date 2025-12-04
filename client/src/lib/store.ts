import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InvoiceData, ClientData, defaultInvoice } from './invoice-types';

interface AppState {
  invoices: InvoiceData[];
  clients: ClientData[];
  currentInvoice: InvoiceData;
  
  addInvoice: (invoice: InvoiceData) => void;
  updateInvoice: (id: string, invoice: Partial<InvoiceData>) => void;
  setCurrentInvoice: (invoice: InvoiceData) => void;
  saveCurrentInvoice: () => void;
  
  addClient: (client: ClientData) => void;
  removeClient: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      invoices: [],
      clients: [],
      currentInvoice: { ...defaultInvoice, id: Math.random().toString(36).substr(2, 9) },

      addInvoice: (invoice) => set((state) => ({ 
        invoices: [...state.invoices, { ...invoice, id: invoice.id || Math.random().toString(36).substr(2, 9) }] 
      })),

      updateInvoice: (id, updatedData) => set((state) => ({
        invoices: state.invoices.map((inv) => inv.id === id || inv.invoiceNo === id ? { ...inv, ...updatedData } : inv)
      })),

      setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),

      saveCurrentInvoice: () => {
        const { currentInvoice, invoices } = get();
        const existingIndex = invoices.findIndex(inv => inv.invoiceNo === currentInvoice.invoiceNo);
        
        if (existingIndex >= 0) {
          const updatedInvoices = [...invoices];
          updatedInvoices[existingIndex] = currentInvoice;
          set({ invoices: updatedInvoices });
        } else {
          set({ invoices: [...invoices, { ...currentInvoice, id: Math.random().toString(36).substr(2, 9) }] });
        }
      },

      addClient: (client) => set((state) => {
        if (state.clients.some(c => c.name === client.name)) return state;
        return { clients: [...state.clients, client] };
      }),

      removeClient: (id) => set((state) => ({
        clients: state.clients.filter(c => c.id !== id)
      })),
    }),
    {
      name: 'invoice-app-storage',
    }
  )
);
