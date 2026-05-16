import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CustomerLedger } from "./customer-ledger";

interface CustomerLedgerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
}

export function CustomerLedgerDialog({ open, onOpenChange, customerName }: CustomerLedgerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Ledger: {customerName}</DialogTitle>
          <DialogDescription>
            Complete statement of account for {customerName}.
          </DialogDescription>
        </DialogHeader>
        
        {customerName && <CustomerLedger buyerName={customerName} />}
        
      </DialogContent>
    </Dialog>
  );
}
