import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Printer } from "lucide-react";
import { useDaybook } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";

export function Daybook() {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const { data: daybook, isLoading } = useDaybook(date);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading daybook...</div>;
  }

  if (!daybook) {
    return <div className="p-8 text-center text-muted-foreground">Failed to load daybook data.</div>;
  }

  // Calculate totals
  const totalInvoiceAmount = daybook.invoices.reduce((sum, inv) => {
    const totals = calculateInvoiceTotals(inv);
    return sum + totals.grandTotal;
  }, 0);

  const totalPaymentsReceived = daybook.payments.reduce((sum, payment) => {
    return sum + Number(payment.amount);
  }, 0);

  const totalChallanFreight = daybook.challans.reduce((sum, challan) => {
    return sum + Number(challan.netFreight || 0);
  }, 0);

  const totalHamaliExpense = daybook.hamali.reduce((sum, record) => {
    return sum + Number(record.totalAmount || 0);
  }, 0);

  const netCash = totalPaymentsReceived - totalHamaliExpense;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 print:bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white border-b print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Daybook / Daily Summary</h2>
          <p className="text-sm text-slate-500">Reconcile your daily cash flow and transactions</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-500" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 h-9"
            />
          </div>
          <Button onClick={handlePrint} variant="outline" className="h-9">
            <Printer className="h-4 w-4 mr-2" />
            Print Summary
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6 pt-4 border-b pb-4">
        <h1 className="text-2xl font-bold">Lalchand Nemichand Bhandari</h1>
        <h2 className="text-xl font-semibold mt-1">Daily Summary Report</h2>
        <p className="text-gray-600 mt-1">Date: {format(new Date(date), "dd MMMM yyyy")}</p>
      </div>

      {/* Content Area */}
      <div className="p-6 overflow-y-auto flex-1 max-w-6xl mx-auto w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-sm border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Sales (Invoices)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">₹{totalInvoiceAmount.toFixed(2)}</div>
              <p className="text-xs text-blue-600 mt-1">{daybook.invoices.length} Bills Generated</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-green-100 bg-green-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Payments Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">₹{totalPaymentsReceived.toFixed(2)}</div>
              <p className="text-xs text-green-600 mt-1">From {daybook.payments.length} Transactions</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-orange-100 bg-orange-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Hamali Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">₹{totalHamaliExpense.toFixed(2)}</div>
              <p className="text-xs text-orange-600 mt-1">{daybook.hamali.length} Records</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-800">Net Cash Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{netCash.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Received - Expenses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Payments Received */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Payments Received</h3>
            {daybook.payments.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No payments received on this date.</p>
            ) : (
              <div className="space-y-3">
                {daybook.payments.map((payment, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm print:shadow-none print:border-gray-300">
                    <div>
                      <div className="font-medium text-slate-800">{payment.buyerName}</div>
                      <div className="text-xs text-slate-500 mt-1">Ref: {payment.invoiceNo} {payment.note ? `| Note: ${payment.note}` : ''}</div>
                    </div>
                    <div className="font-bold text-green-600">₹{Number(payment.amount).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Invoices Created */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Invoices Created</h3>
            {daybook.invoices.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No invoices created on this date.</p>
            ) : (
              <div className="space-y-3">
                {daybook.invoices.map((inv, i) => {
                  const totals = calculateInvoiceTotals(inv);
                  return (
                    <div key={i} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm print:shadow-none print:border-gray-300">
                      <div>
                        <div className="font-medium text-slate-800">{inv.buyerName}</div>
                        <div className="text-xs text-slate-500 mt-1">Bill No: {inv.invoiceNo} | {totals.totalWeight} Qt / Kg</div>
                      </div>
                      <div className="font-bold text-blue-600">₹{totals.grandTotal.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
