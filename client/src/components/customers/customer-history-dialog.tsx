import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useInvoices } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";
import { ExternalLink, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface CustomerHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerName: string;
}

export function CustomerHistoryDialog({
    open,
    onOpenChange,
    customerName,
}: CustomerHistoryDialogProps) {
    const { data: invoices = [], isLoading } = useInvoices();
    const { setCurrentInvoice } = useStore();

    // Filter invoices for this customer
    const customerInvoices = useMemo(() => {
        if (!customerName) return [];
        return invoices
            .filter((inv) => inv.buyerName?.toLowerCase() === customerName.toLowerCase())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, customerName]);

    // Calculate total revenue
    const totalRevenue = useMemo(() => {
        return customerInvoices.reduce((sum, inv) => {
            const { grandTotal } = calculateInvoiceTotals(inv);
            return sum + grandTotal;
        }, 0);
    }, [customerInvoices]);

    const handleViewInvoice = (invoice: any) => {
        setCurrentInvoice(invoice);
        onOpenChange(false); // Close dialog

        // Trigger tab switch in parent InvoiceBuilder
        // Using timeout to ensure state update propagates
        setTimeout(() => {
            const tabBtn = document.getElementById('tab-invoice');
            if (tabBtn) tabBtn.click();
        }, 50);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Customer History</DialogTitle>
                    <DialogDescription>
                        Transaction history for <span className="font-semibold text-foreground">{customerName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalRevenue)}
                        </div>
                    </div>

                    <div className="rounded-md border overflow-auto flex-1 h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Invoice No</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : customerInvoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No invoices found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customerInvoices.map((invoice) => {
                                        const { grandTotal } = calculateInvoiceTotals(invoice);
                                        return (
                                            <TableRow key={invoice.id}>
                                                <TableCell>{formatDate(invoice.date)}</TableCell>
                                                <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${invoice.status === "Paid"
                                                                ? "bg-green-100 text-green-700"
                                                                : invoice.status === "Pending"
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : "bg-red-100 text-red-700"
                                                            }`}
                                                    >
                                                        {invoice.status || "Pending"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(grandTotal)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleViewInvoice(invoice)}
                                                        title="Load Invoice"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
