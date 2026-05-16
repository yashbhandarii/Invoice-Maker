import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface Payment {
    date: string;
    amount: number;
    method?: string;
    note?: string;
}

interface InvoicePaymentDialogProps {
    invoiceId: string;
    invoiceNo: string;
    grandTotal: number;
    payments: Payment[];
    paidAmount: number;
    remainingAmount: number;
    onPaymentAdded: () => void;
}

export function InvoicePaymentDialog({
    invoiceId,
    invoiceNo,
    grandTotal,
    payments,
    paidAmount,
    remainingAmount,
    onPaymentAdded,
}: InvoicePaymentDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [paymentNote, setPaymentNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddPayment = async () => {
        const amount = parseFloat(paymentAmount);

        if (!amount || amount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid payment amount",
                variant: "destructive",
            });
            return;
        }

        if (amount > remainingAmount) {
            toast({
                title: "Amount Exceeds Balance",
                description: `Payment amount cannot exceed remaining balance of ₹${remainingAmount.toFixed(2)}`,
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: paymentDate,
                    amount,
                    method: paymentMethod,
                    note: paymentNote || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to add payment");
            }

            toast({
                title: "Payment Recorded",
                description: `Payment of ₹${amount.toFixed(2)} added successfully`,
            });

            // Reset form
            setPaymentAmount("");
            setPaymentNote("");
            setPaymentDate(format(new Date(), "yyyy-MM-dd"));

            onPaymentAdded();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add payment",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePayment = async (index: number) => {
        try {
            const response = await fetch(`/api/invoices/${invoiceId}/payments/${index}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete payment");
            }

            toast({
                title: "Payment Deleted",
                description: "Payment removed successfully",
            });

            onPaymentAdded();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete payment",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <DollarSign className="h-4 w-4" />
                    Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Payment Tracking - Invoice #{invoiceNo}</DialogTitle>
                    <DialogDescription>
                        Record and manage payments for this invoice
                    </DialogDescription>
                </DialogHeader>

                {/* Payment Summary */}
                <Card className="bg-slate-50">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Invoice Total</p>
                                <p className="text-lg font-bold">₹{grandTotal.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Paid Amount</p>
                                <p className="text-lg font-bold text-green-600">₹{paidAmount.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Remaining</p>
                                <p className="text-lg font-bold text-orange-600">₹{remainingAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Payment Form */}
                <div className="space-y-4 py-4">
                    <h3 className="font-semibold text-sm">Add New Payment</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-date">Payment Date</Label>
                            <Input
                                id="payment-date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment-amount">Amount (₹)</Label>
                            <Input
                                id="payment-amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Card">Card</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment-note">Note/Reference (Optional)</Label>
                            <Input
                                id="payment-note"
                                placeholder="e.g., Cheque #12345"
                                value={paymentNote}
                                onChange={(e) => setPaymentNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleAddPayment}
                        disabled={isSubmitting || remainingAmount <= 0}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Adding..." : "Add Payment"}
                    </Button>
                </div>

                {/* Payment History */}
                {payments.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm">Payment History</h3>
                        <div className="space-y-2">
                            {payments.map((payment, index) => (
                                <Card key={index} className="border">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">₹{payment.amount.toFixed(2)}</span>
                                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                                        {payment.method || "Cash"}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {format(new Date(payment.date), "MMM dd, yyyy")}
                                                </p>
                                                {payment.note && (
                                                    <p className="text-xs text-slate-600 mt-1">{payment.note}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeletePayment(index)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {payments.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        No payments recorded yet
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
