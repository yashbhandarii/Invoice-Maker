import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CreditCard, Calendar, Scale, AlertCircle, Plus, ClipboardList } from "lucide-react";
import { RevenueChart } from "./revenue-chart";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { useInvoices } from "@/lib/api";

export function InvoiceDashboard() {
  const { data: invoices = [] } = useInvoices();
  const { resetCurrentInvoice } = useStore();

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((acc, inv) => {
      const subTotal = inv.items.reduce((s, i) => s + i.amount, 0);
      const taxable = subTotal - (inv.discount || 0);
      const taxes = taxable * ((inv.cgstRate || 0) + (inv.sgstRate || 0) + (inv.igstRate || 0)) / 100;
      return acc + taxable + taxes;
    }, 0);

    const totalWeight = invoices.reduce((acc, inv) => {
      return acc + inv.items.reduce((w, i) => w + (i.weight || 0), 0);
    }, 0);

    const outstanding = invoices
      .filter(inv => inv.status === "Pending" || inv.status === "Overdue")
      .reduce((acc, inv) => {
        const subTotal = inv.items.reduce((s, i) => s + i.amount, 0);
        const taxable = subTotal - (Number(inv.discount) || 0);
        const taxes = taxable * ((Number(inv.cgstRate) || 0) + (Number(inv.sgstRate) || 0) + (Number(inv.igstRate) || 0)) / 100;
        const grandTotal = taxable + taxes + (Number(inv.otherCharges) || 0);
        const remaining = (inv as any).remainingAmount ?? (grandTotal - ((Number((inv as any).paidAmount)) || Number(inv.advance) || 0));
        return acc + remaining;
      }, 0);

    const paidCount = invoices.filter(inv => inv.status === "Paid").length;
    const pendingCount = invoices.filter(inv => inv.status === "Pending").length;
    const overdueCount = invoices.filter(inv => inv.status === "Overdue").length;

    return { totalRevenue, totalWeight, outstanding, paidCount, pendingCount, overdueCount };
  }, [invoices]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Overview of your invoicing status</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              window.document.getElementById('tab-invoice')?.click();
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-invoice-history')), 100);
            }}
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            View History
          </Button>
          <Button
            className="bg-primary text-white gap-2"
            onClick={() => {
              resetCurrentInvoice();
              window.document.getElementById('tab-invoice')?.click();
            }}
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                <p className="text-xs text-slate-500 mt-1">{invoices.length} total invoices</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Outstanding</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.outstanding)}</h3>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" /> {stats.pendingCount} pending
                </p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Paid Invoices</p>
                <h3 className="text-2xl font-bold mt-1">{stats.paidCount}</h3>
                <p className="text-xs text-green-600 mt-1">✓ Fully paid</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Weight</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalWeight.toFixed(1)} kg</h3>
                <p className="text-xs text-slate-500 mt-1">Total goods weight</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Scale className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Monthly Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[350px] w-full pt-4">
            <RevenueChart invoices={invoices} />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-3xl font-bold text-green-600">{stats.paidCount}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Paid</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-3xl font-bold text-orange-500">{stats.pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Pending</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-3xl font-bold text-red-500">{stats.overdueCount}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Overdue</p>
        </div>
      </div>
    </div>
  );
}
