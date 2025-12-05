import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InvoiceData, ClientData, defaultInvoice } from './invoice-types';

interface AppState {
  currentInvoice: InvoiceData;
  setCurrentInvoice: (invoice: InvoiceData) => void;
  resetCurrentInvoice: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentInvoice: { ...defaultInvoice, id: Math.random().toString(36).substr(2, 9) },
      
      setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
      
      resetCurrentInvoice: () => set({ 
        currentInvoice: { ...defaultInvoice, id: Math.random().toString(36).substr(2, 9) } 
      }),
    }),
    {
      name: 'invoice-app-current',
    }
  )
);
