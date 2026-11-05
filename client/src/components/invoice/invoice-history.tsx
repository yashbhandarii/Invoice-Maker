import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Search,
  Edit,
  Trash2,
  Copy,
  FileText,
  Plus,
  ArrowUpDown,
  IndianRupee,
  Calendar,
  User,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Share2,
  Printer,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { InvoiceData } from "@/lib/invoice-types";
import { usePaginatedInvoices, useDeleteInvoice } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { InvoicePreview } from "./invoice-preview";
import { PdfShareDialog } from "../ui/pdf-share-dialog";

interface InvoiceHistoryProps {
  onCreateNew: () => void;
  onEditInvoice: (invoice: InvoiceData) => void;
}

export function InvoiceHistory({ onCreateNew, onEditInvoice }: InvoiceHistoryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, isLoading } = usePaginatedInvoices({
    page,
    limit,
    search,
    status: statusFilter,
    fromDate,
    toDate,
    sortOrder,
  });

  const invoices = data?.invoices || [];
  const totalCount = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.pages || 0;
  const stats = data?.stats || { totalRevenue: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 };

  const deleteMutation = useDeleteInvoice();
  const { toast } = useToast();

  // Print & Share States & Refs
  const [printInvoice, setPrintInvoice] = useState<InvoiceData | null>(null);
  const [shareInvoice, setShareInvoice] = useState<InvoiceData | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [sharePdfUrl, setSharePdfUrl] = useState("");
  const [sharePdfBase64, setSharePdfBase64] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const historyPrintRef = useRef<HTMLDivElement>(null);
  const historyShareContainerRef = useRef<HTMLDivElement>(null);

  const handleHistoryPrint = useReactToPrint({
    contentRef: historyPrintRef,
    documentTitle: printInvoice
      ? `(LNB Invoice - ${printInvoice.invoiceNo} ${printInvoice.date ? format(new Date(printInvoice.date), "dd.MM.yyyy") : ""})`
      : "Invoice",
    onAfterPrint: () => setPrintInvoice(null),
  });

  useEffect(() => {
    if (printInvoice && historyPrintRef.current) {
      const timer = setTimeout(() => {
        handleHistoryPrint();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [printInvoice]);

  const handleShareClick = async (inv: InvoiceData) => {
    setShareInvoice(inv);
    setIsGeneratingPdf(true);
    setTimeout(async () => {
      try {
        if (!historyShareContainerRef.current) {
          throw new Error("Content container not found");
        }
        const dataUrl = await toJpeg(historyShareContainerRef.current, {
          quality: 0.96,
          pixelRatio: 2.8,
          skipFonts: true,
          cacheBust: true,
        });
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "MEDIUM");

        const formattedDate = inv.date ? format(new Date(inv.date), "dd.MM.yyyy") : "";
        const fileName = `(LNB Invoice - ${inv.invoiceNo || "Draft"} ${formattedDate}).pdf`;
        const pdfBase64 = pdf.output("datauristring").split(",")[1];
        setSharePdfBase64(pdfBase64);

        const response = await fetch("/api/share-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64, filename: fileName }),
        });

        if (!response.ok) throw new Error("Failed to upload PDF");

        const resData = await response.json();
        setSharePdfUrl(resData.url);
        setIsShareDialogOpen(true);
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Share failed: ${error?.message || "Unknown error"}`,
          variant: "destructive",
        });
        setShareInvoice(null);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 300);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const getInvoiceTotal = (inv: InvoiceData) => {
    const subTotal = inv.items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxable = subTotal - (Number(inv.discount) || 0);
    const taxes =
      taxable *
      ((Number(inv.cgstRate) || 0) +
        (Number(inv.sgstRate) || 0) +
        (Number(inv.igstRate) || 0)) /
      100;
    return taxable + taxes + (Number(inv.otherCharges) || 0);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
    setPassword("");
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!password) {
      toast({ title: "Password Required", description: "Please enter the admin password.", variant: "destructive" });
      return;
    }
    if (!deleteId) return;
    deleteMutation.mutate(
      { id: deleteId, password },
      {
        onSuccess: () => {
          toast({ title: "Deleted", description: "Invoice deleted successfully." });
          setIsDeleteDialogOpen(false);
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to delete.", variant: "destructive" });
        },
      }
    );
  };

  const handleClone = (e: React.MouseEvent, inv: InvoiceData) => {
    e.stopPropagation();
    const cloned: InvoiceData = { ...inv };
    delete cloned.id;
    cloned.invoiceNo = "";
    cloned.date = new Date().toISOString().split("T")[0];
    cloned.status = "Pending";
    delete (cloned as any).createdAt;
    delete (cloned as any).updatedAt;
    delete (cloned as any).financialYear;
    onEditInvoice(cloned);
    toast({ title: "Invoice Cloned", description: "Edit and save to create a new invoice." });
  };

  // Summary stats
  const { totalRevenue, paidCount, pendingCount, overdueCount } = stats;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice History
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {totalCount} invoice{totalCount !== 1 ? "s" : ""} found
            </p>
          </div>
          <Button
            onClick={onCreateNew}
            className="bg-primary text-white hover:bg-primary/90 gap-2 self-start sm:self-auto"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
            <IndianRupee className="h-3 w-3" />
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">
            ✓ {paidCount} Paid
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 rounded-full px-3 py-1 text-xs font-semibold">
              ⏳ {pendingCount} Pending
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-100 text-red-700 rounded-full px-3 py-1 text-xs font-semibold">
              ⚠ {overdueCount} Overdue
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-6 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by name, invoice no..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-32 h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-full sm:w-36 h-8 text-sm"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            title="From Date"
          />
          <Input
            type="date"
            className="w-full sm:w-36 h-8 text-sm"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            title="To Date"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-slate-100 border-b px-6 py-2 shrink-0 hidden sm:block">
        <div className="grid grid-cols-[80px_1fr_130px_110px_90px_150px] gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <button
            onClick={() => {
              setSortOrder((s) => (s === "desc" ? "asc" : "desc"));
              setPage(1);
            }}
            className="flex items-center gap-1 hover:text-slate-800 transition-colors text-left"
          >
            <Hash className="h-3 w-3" />
            Inv No
            <ArrowUpDown className="h-2.5 w-2.5" />
          </button>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Buyer
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Date
          </span>
          <span className="flex items-center gap-1">
            <IndianRupee className="h-3 w-3" />
            Amount
          </span>
          <span>Status</span>
          <span>Actions</span>
        </div>
      </div>

      {/* Invoice Rows */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-slate-500">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <FileText className="h-12 w-12 text-slate-200" />
            <p className="text-slate-500 font-medium">No invoices found</p>
            <p className="text-xs text-slate-400">
              {search || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first invoice"}
            </p>
            <Button onClick={onCreateNew} size="sm" className="mt-1 gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((inv) => {
              const total = getInvoiceTotal(inv);
              const weight = inv.items.reduce((w, i) => w + (i.weight || 0), 0);
              const statusColor =
                inv.status === "Paid"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : inv.status === "Overdue"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-orange-100 text-orange-700 border-orange-200";

              return (
                <div
                  key={inv.id}
                  onClick={() => onEditInvoice(inv)}
                  className="group px-6 py-3 hover:bg-blue-50/60 cursor-pointer transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="bg-primary/10 rounded-lg p-2 shrink-0 mt-0.5">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-800">#{inv.invoiceNo}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium truncate">{inv.buyerName || "—"}</p>
                        <p className="text-xs text-slate-400">
                          {inv.date ? format(new Date(inv.date), "dd MMM yyyy") : "No date"}
                          {weight > 0 && ` • ${weight.toFixed(1)}kg`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-bold text-sm text-slate-800">{formatCurrency(total)}</span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPrintInvoice(inv); }}
                          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Print"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShareClick(inv); }}
                          disabled={isGeneratingPdf && shareInvoice?.id === inv.id}
                          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                          title="Share"
                        >
                          {isGeneratingPdf && shareInvoice?.id === inv.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditInvoice(inv); }}
                          className="p-1.5 rounded-md text-blue-500 hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleClone(e, inv)}
                          className="p-1.5 rounded-md text-green-600 hover:bg-green-100 transition-colors"
                          title="Clone"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, inv.id!)}
                          className="p-1.5 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:grid grid-cols-[80px_1fr_130px_110px_90px_150px] gap-3 items-center">
                    <span className="font-bold text-sm text-primary">#{inv.invoiceNo}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{inv.buyerName || "—"}</p>
                      {weight > 0 && (
                        <p className="text-xs text-slate-400">{weight.toFixed(1)} kg</p>
                      )}
                    </div>
                    <span className="text-sm text-slate-500">
                      {inv.date ? format(new Date(inv.date), "dd MMM yyyy") : "—"}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{formatCurrency(total)}</span>
                    <span>
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${statusColor}`}>
                        {inv.status}
                      </span>
                    </span>
                    <div
                      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setPrintInvoice(inv); }}
                        className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShareClick(inv); }}
                        disabled={isGeneratingPdf && shareInvoice?.id === inv.id}
                        className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        title="Share Invoice"
                      >
                        {isGeneratingPdf && shareInvoice?.id === inv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditInvoice(inv); }}
                        className="p-1.5 rounded-md text-blue-500 hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleClone(e, inv)}
                        className="p-1.5 rounded-md text-green-600 hover:bg-green-100 transition-colors"
                        title="Clone"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, inv.id!)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div className="bg-white border-t px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="text-xs sm:text-sm text-slate-500 font-medium order-2 sm:order-1">
            Showing <span className="font-semibold text-slate-700">{Math.min((page - 1) * limit + 1, totalCount)}</span> to{" "}
            <span className="font-semibold text-slate-700">{Math.min(page * limit, totalCount)}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalCount}</span> invoices
          </div>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            {/* Page Size Select */}
            <div className="flex items-center gap-2 mr-4">
              <span className="text-xs text-slate-500 font-medium">Rows:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[70px] h-8 text-xs font-semibold bg-white border">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1 || totalPages === 0}
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || totalPages === 0}
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Render dynamic page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (page > 3 && totalPages > 5) {
                  pageNum = page - 3 + i;
                  if (pageNum + (4 - i) > totalPages) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 text-xs font-semibold ${
                      page === pageNum
                        ? "bg-primary text-white font-bold border-primary hover:bg-primary/90"
                        : "bg-white text-slate-700"
                    }`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || totalPages === 0}
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || totalPages === 0}
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Enter the admin password to confirm deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmDelete()}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden Print Container */}
      {printInvoice && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "210mm", height: "297mm", overflow: "hidden" }}>
          <InvoicePreview ref={historyPrintRef} data={printInvoice} isStatic={true} />
        </div>
      )}

      {/* Hidden Share Container (to capture PNG) */}
      {shareInvoice && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "210mm", height: "297mm", overflow: "hidden" }}>
          <InvoicePreview ref={historyShareContainerRef} data={shareInvoice} isStatic={true} />
        </div>
      )}

      {/* Share Dialog */}
      <PdfShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => {
          setIsShareDialogOpen(false);
          setShareInvoice(null);
        }}
        pdfUrl={sharePdfUrl}
        pdfBase64={sharePdfBase64}
        documentNo={shareInvoice?.invoiceNo || "Draft"}
        documentType="Invoice"
      />
    </div>
  );
}
