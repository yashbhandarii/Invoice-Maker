import { useState, useRef, useEffect, useCallback } from "react";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { InvoiceDashboard } from "@/components/invoice/invoice-dashboard";
import { InvoiceHistory } from "@/components/invoice/invoice-history";
import { DeliveryChallan } from "@/components/delivery/delivery-challan";
import { HamaliCharges } from "@/components/hamali/hamali-charges";
import { CustomerManagement } from "@/components/customers/customer-management";
import { ProductCatalog } from "@/components/products/product-catalog";
import { SettingsPage } from "@/components/settings/settings-page";
import { Settings as SettingsIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { useInvoices } from "@/lib/api";
import { InvoiceData } from "@/lib/invoice-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Printer,
  LayoutDashboard,
  FileText,
  Share2,
  Truck,
  Package,
  IndianRupee,
  Users,
  Menu,
  Eye,
  PenLine,
  ZoomIn,
  ZoomOut,
  Loader2,
  History,
  Plus,
  ClipboardList,
} from "lucide-react";
import { PdfShareDialog } from "@/components/ui/pdf-share-dialog";

export default function InvoiceBuilder() {
  const { currentInvoice, setCurrentInvoice, resetCurrentInvoice } = useStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const shareContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("invoice");
  // Invoice sub-tab: "create" or "history"
  const [invoiceSubTab, setInvoiceSubTab] = useState<"create" | "history">("create");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const { toast } = useToast();

  // Zoom and share states
  const [zoom, setZoom] = useState(0.85);
  const [isSharing, setIsSharing] = useState(false);
  const [sharePdfUrl, setSharePdfUrl] = useState("");
  const [sharePdfBase64, setSharePdfBase64] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const { data: invoices = [] } = useInvoices();
  const isSaved = invoices.some((inv) => inv.id === currentInvoice.id);

  const handlePrint = useReactToPrint({
    contentRef: shareContainerRef,
    documentTitle: `(LNB Invoice - ${currentInvoice.invoiceNo} ${currentInvoice.date ? format(new Date(currentInvoice.date), "dd.MM.yyyy") : ""})`,
  });

  const handleShare = async () => {
    if (!isSaved) {
      toast({ title: "Save Required", description: "Please save the invoice first before sharing.", variant: "destructive" });
      return;
    }

    if (!shareContainerRef.current) {
      toast({ title: "Error", description: "Content not found", variant: "destructive" });
      return;
    }

    setIsSharing(true);
    try {
      const dataUrl = await toJpeg(shareContainerRef.current, {
        quality: 0.9,
        pixelRatio: 1.5,
        skipFonts: true,
        cacheBust: true,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      const formattedDate = currentInvoice.date ? format(new Date(currentInvoice.date), "dd.MM.yyyy") : "";
      const fileName = `(LNB Invoice - ${currentInvoice.invoiceNo || "Draft"} ${formattedDate}).pdf`;
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
      toast({ title: "Error", description: `Share failed: ${error?.message || "Unknown error"}`, variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  // Called after a new invoice is saved — reset to fresh blank invoice
  const handleInvoiceSaved = useCallback(() => {
    resetCurrentInvoice();
    setMobileView("editor");
    setInvoiceSubTab("create");
  }, [resetCurrentInvoice]);

  // Load invoice from history into the editor (Create sub-tab)
  const handleEditInvoice = useCallback((invoice: InvoiceData) => {
    setCurrentInvoice(invoice);
    setInvoiceSubTab("create");
    setActiveTab("invoice");
    setMobileView("editor");
  }, [setCurrentInvoice]);

  // Create new blank invoice
  const handleCreateNew = useCallback(() => {
    resetCurrentInvoice();
    setInvoiceSubTab("create");
    setMobileView("editor");
  }, [resetCurrentInvoice]);

  // Hack to allow dashboard to switch tabs via ID click
  useEffect(() => {
    const tabBtn = document.getElementById("tab-invoice");
    if (tabBtn) {
      tabBtn.onclick = () => {
        setActiveTab("invoice");
        setInvoiceSubTab("create");
      };
    }
  }, []);

  // Listen for "View History" button from dashboard
  useEffect(() => {
    const handler = () => {
      setActiveTab("invoice");
      setInvoiceSubTab("history");
    };
    window.addEventListener("open-invoice-history", handler);
    return () => window.removeEventListener("open-invoice-history", handler);
  }, []);


  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "invoice", label: "Invoice", icon: <FileText className="h-4 w-4" /> },
    { id: "delivery", label: "Delivery Challan", icon: <Truck className="h-4 w-4" /> },
    { id: "hamali", label: "Hamali", icon: <IndianRupee className="h-4 w-4" /> },
    { id: "customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
    { id: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white shrink-0 z-30 shadow-sm">
        <div className="h-16 border-b flex flex-col justify-center px-6 bg-slate-50/50">
          <div className="flex items-center gap-2 font-bold text-primary text-base tracking-tight">
            <FileText className="h-5 w-5 text-primary" />
            <span>LNB Invoice Maker</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-hindi ml-7">मे. लालचंद नेमीचंद भंडारी</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={item.id === "invoice" ? "tab-invoice" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
              }`}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === "invoice") setInvoiceSubTab("create");
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>System Status</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Online
            </span>
          </div>
        </div>
      </aside>

      {/* Main App Window */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Navbar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-white shrink-0 z-20 md:hidden">
          <div className="flex items-center gap-2 font-bold text-primary text-lg">
            <FileText className="h-5 w-5" />
            <span>LNB</span>
            <span className="text-[10px] text-muted-foreground font-hindi ml-1">मे. लालचंद नेमीचंद भंडारी</span>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === "invoice") setInvoiceSubTab("create");
                    }}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">

        {activeTab === "dashboard" && (
          <div className="h-full overflow-auto w-full animate-in fade-in zoom-in-95 duration-300">
            <InvoiceDashboard />
          </div>
        )}

        {activeTab === "invoice" && (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Invoice Sub-Tabs */}
            <div className="bg-white border-b shrink-0 flex items-center px-4 gap-1 h-11">
              <button
                onClick={() => setInvoiceSubTab("create")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  invoiceSubTab === "create"
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                {isSaved ? "Edit Invoice" : "Create Invoice"}
              </button>
              <button
                onClick={() => setInvoiceSubTab("history")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  invoiceSubTab === "history"
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Invoice History
                {invoices.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    invoiceSubTab === "history" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {invoices.length}
                  </span>
                )}
              </button>
            </div>

            {/* Create Invoice sub-tab */}
            {invoiceSubTab === "create" && (
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Mobile Toggle Bar */}
                <div className="md:hidden flex items-center border-b bg-white shrink-0 z-20">
                  <button
                    onClick={() => setMobileView("editor")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
                      mobileView === "editor"
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <PenLine className="h-4 w-4" />
                    Editor
                  </button>
                  <button
                    onClick={() => setMobileView("preview")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
                      mobileView === "preview"
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                </div>

                {/* Form Panel */}
                <div
                  className={`w-full md:w-[450px] border-r bg-card p-4 md:p-6 overflow-y-auto md:h-full z-10 shadow-lg ${
                    mobileView === "editor" ? "flex-1 h-full" : "hidden md:block"
                  }`}
                >
                  <InvoiceForm
                    defaultValues={currentInvoice}
                    onUpdate={setCurrentInvoice}
                    onPrint={() => handlePrint && handlePrint()}
                    onShare={handleShare}
                    onSaved={handleInvoiceSaved}
                    isSaved={isSaved}
                  />
                </div>

                {/* Preview Panel */}
                <div
                  className={`flex-1 bg-muted/30 overflow-auto p-4 md:p-8 flex flex-col items-center justify-start relative ${
                    mobileView === "preview" ? "h-full" : "hidden md:flex"
                  }`}
                >
                  {/* Mobile action buttons */}
                  <div className="absolute top-4 right-4 md:hidden flex gap-2 z-20">
                    <Button
                      onClick={handleShare}
                      disabled={!isSaved || isSharing}
                      size="sm"
                      variant="outline"
                      className="h-9 border-green-600 text-green-600 bg-white shadow-sm disabled:opacity-50"
                      title={!isSaved ? "Please save invoice first to share" : "Share"}
                    >
                      {isSharing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Share2 className="h-4 w-4 mr-1" />}
                      Share
                    </Button>
                    <Button
                      onClick={() => handlePrint && handlePrint()}
                      disabled={!isSaved}
                      size="sm"
                      className="h-9 shadow-sm disabled:opacity-50"
                      title={!isSaved ? "Please save invoice first to print" : "Print"}
                    >
                      <Printer className="h-4 w-4 mr-1" /> Print
                    </Button>
                  </div>

                  {/* Zoom controls */}
                  <div className="sticky top-0 mb-4 bg-white/80 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-md flex items-center gap-2 z-20 transition-all select-none">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => setZoom((prev) => Math.max(0.4, prev - 0.1))}
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs font-semibold w-10 text-center select-none">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => setZoom((prev) => Math.min(2.0, prev + 0.1))}
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <div className="w-[1px] h-3 bg-muted mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 rounded-full text-xs font-medium"
                      onClick={() => setZoom(0.85)}
                    >
                      Reset
                    </Button>
                  </div>

                  {isSharing && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-30 animate-in fade-in duration-200">
                      <div className="bg-card p-4 rounded-xl border shadow-lg flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">Uploading PDF for sharing...</span>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "top center",
                      marginBottom: `calc((1 - ${zoom}) * -100%)`,
                    }}
                    className="transition-transform duration-200 pb-20 origin-top"
                  >
                    <InvoicePreview ref={contentRef} data={currentInvoice} />
                  </div>
                </div>

                {/* Hidden container for PDF capture */}
                <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "210mm", height: "297mm", overflow: "hidden" }}>
                  <InvoicePreview ref={shareContainerRef} data={currentInvoice} isStatic={true} />
                </div>

                {/* Share Dialog */}
                <PdfShareDialog
                  isOpen={isShareDialogOpen}
                  onClose={() => setIsShareDialogOpen(false)}
                  pdfUrl={sharePdfUrl}
                  pdfBase64={sharePdfBase64}
                  documentNo={currentInvoice.invoiceNo || "Draft"}
                  documentType="Invoice"
                />
              </div>
            )}

            {/* History sub-tab */}
            {invoiceSubTab === "history" && (
              <div className="flex-1 overflow-hidden">
                <InvoiceHistory
                  onCreateNew={handleCreateNew}
                  onEditInvoice={handleEditInvoice}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "delivery" && (
          <div className="h-full overflow-auto w-full animate-in fade-in zoom-in-95 duration-300">
            <DeliveryChallan />
          </div>
        )}

        {activeTab === "hamali" && (
          <div className="h-full overflow-auto w-full animate-in fade-in zoom-in-95 duration-300">
            <HamaliCharges />
          </div>
        )}

        {activeTab === "customers" && (
          <div className="h-full overflow-auto w-full animate-in fade-in zoom-in-95 duration-300">
            <CustomerManagement />
          </div>
        )}

        {activeTab === "products" && (
          <div className="h-full overflow-auto w-full animate-in fade-in zoom-in-95 duration-300 p-6">
            <ProductCatalog />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="h-full overflow-auto w-full animate-in fade-in zoom-in-95 duration-300">
            <SettingsPage />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
