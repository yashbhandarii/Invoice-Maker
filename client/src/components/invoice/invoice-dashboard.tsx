import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, CreditCard, Calendar, FileText, CheckCircle2, AlertCircle, Scale, Trash2, Edit } from "lucide-react";
import reportImage from "@assets/generated_images/professional_invoice_dashboard_report_with_charts_and_table.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { format } from "date-fns";
import { InvoiceData } from "@/lib/invoice-types";
import { useInvoices, useDeleteInvoice } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function InvoiceDashboard() {
  const { data: invoices = [], isLoading } = useInvoices();

  const { setCurrentInvoice, resetCurrentInvoice } = useStore();
  const deleteMutation = useDeleteInvoice();
  const { toast } = useToast();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
    setPassword("");
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (password === "112233") {
      if (deleteId) {
        deleteMutation.mutate(deleteId, {
          onSuccess: () => {
            toast({
              title: "Invoice Deleted",
              description: "The invoice has been successfully deleted.",
            });
            setIsDeleteDialogOpen(false);
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to delete invoice.",
              variant: "destructive"
            });
          }
        });
      }
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password.",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (e: React.MouseEvent, inv: InvoiceData) => {
    e.stopPropagation();
    setCurrentInvoice(inv);
    window.document.getElementById('tab-invoice')?.click();
  };

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
        const taxable = subTotal - (inv.discount || 0);
        const taxes = taxable * ((inv.cgstRate || 0) + (inv.sgstRate || 0) + (inv.igstRate || 0)) / 100;
        return acc + (taxable + taxes - (inv.advance || 0));
      }, 0);

    const paidCount = invoices.filter(inv => inv.status === "Paid").length;
    const pendingCount = invoices.filter(inv => inv.status === "Pending").length;

    return { totalRevenue, totalWeight, outstanding, paidCount, pendingCount };
  }, [invoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getInvoiceTotal = (inv: InvoiceData) => {
    const subTotal = inv.items.reduce((s, i) => s + i.amount, 0);
    const taxable = subTotal - (inv.discount || 0);
    const taxes = taxable * ((inv.cgstRate || 0) + (inv.sgstRate || 0) + (inv.igstRate || 0)) / 100;
    return taxable + taxes;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Overview of your invoicing status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button className="bg-primary text-white" onClick={() => {
            resetCurrentInvoice();
            window.document.getElementById('tab-invoice')?.click();
          }}>
            New Invoice
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                <p className="text-xs text-slate-500 flex items-center mt-1">
                  Total generated revenue
                </p>
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
                  <AlertCircle className="h-3 w-3 mr-1" /> {stats.pendingCount} invoices pending
                </p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Weight</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalWeight.toFixed(2)} kg</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Total goods weight
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Scale className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Image Placeholder */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full bg-slate-100 rounded-md overflow-hidden border relative group">
              <img
                src={reportImage}
                alt="Revenue Report Chart"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors pointer-events-none" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">
                  Loading invoices...
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No invoices created yet.
                </div>
              ) : (
                invoices.slice().reverse().map((inv, idx) => {
                  const total = getInvoiceTotal(inv);
                  const weight = inv.items.reduce((w, i) => w + (i.weight || 0), 0);

                  return (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {
                      setCurrentInvoice(inv);
                      window.document.getElementById('tab-invoice')?.click();
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{inv.buyerName || "Unknown Buyer"}</p>
                          <p className="text-xs text-slate-500">#{inv.invoiceNo} • {inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : 'No Date'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(total)}</p>
                        <div className="flex gap-2 justify-end mt-1 items-center">
                          {weight > 0 && <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-600">{weight.toFixed(1)}kg</span>}
                          <Badge variant={inv.status === "Paid" ? "default" : inv.status === "Pending" ? "secondary" : "destructive"} className={`text-[10px] h-5 px-2 ${inv.status === "Paid" ? "bg-green-500 hover:bg-green-600" : inv.status === "Pending" ? "bg-orange-400 hover:bg-orange-500 text-white" : ""}`}>
                            {inv.status}
                          </Badge>
                          <div className="flex gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => handleEditClick(e, inv)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDeleteClick(e, inv.id!)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please enter the administrator password to confirm deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.preventDefault();
              handleConfirmDelete();
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
