import { useState, useRef, useEffect } from "react";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { InvoiceDashboard } from "@/components/invoice/invoice-dashboard";
import { DeliveryChallan } from "@/components/delivery/delivery-challan";
import { HamaliCharges } from "@/components/hamali/hamali-charges";
import { CustomerManagement } from "@/components/customers/customer-management";
import { ProductCatalog } from "@/components/products/product-catalog";
import { SettingsPage } from "@/components/settings/settings-page";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
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
  PenLine
} from "lucide-react";

export default function InvoiceBuilder() {
  const { currentInvoice, setCurrentInvoice } = useStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("invoice");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `(LNB Invoice - ${currentInvoice.invoiceNo} ${currentInvoice.date ? format(new Date(currentInvoice.date), "dd.MM.yyyy") : ""})`,
  });

  const handleShare = async () => {
    if (!contentRef.current) {
      toast({ title: "Error", description: "Content not found", variant: "destructive" });
      return;
    }

    try {
      // Using html-to-image instead of html2canvas for better support of modern CSS
      const dataUrl = await toPng(contentRef.current, { cacheBust: true, pixelRatio: 2 });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);

      const formattedDate = currentInvoice.date ? format(new Date(currentInvoice.date), "dd.MM.yyyy") : "";
      const fileName = `(LNB Invoice - ${currentInvoice.invoiceNo || "Draft"} ${formattedDate}).pdf`;
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Invoice ${currentInvoice.invoiceNo}`,
            text: `Please find the invoice ${currentInvoice.invoiceNo} attached.`,
          });
        } catch (e: any) {
          if (e.name !== 'AbortError') throw e;
        }
      } else {
        pdf.save(fileName);

        const message = `Please find the invoice ${currentInvoice.invoiceNo || "Draft"} attached.`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");

        toast({
          title: "PDF Downloaded",
          description: "Please attach the downloaded PDF to the WhatsApp chat.",
        });
      }
    } catch (error: any) {
      console.error("Error sharing PDF:", error);
      toast({
        title: "Error",
        description: `Share failed: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // Hack to allow dashboard to switch tabs via ID click
  useEffect(() => {
    const tabBtn = document.getElementById('tab-invoice');
    if (tabBtn) {
      tabBtn.onclick = () => setActiveTab("invoice");
    }
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-white shrink-0 z-20">
        <div className="flex items-center gap-2 font-bold text-primary text-lg">
          <FileText className="h-5 w-5" />
          <span className="md:hidden">LNB</span>
          <span className="hidden md:inline">Lalchand Nemichand Bhandari</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setActiveTab("dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("invoice")}>
                  <FileText className="h-4 w-4 mr-2" /> Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("delivery")}>
                  <Truck className="h-4 w-4 mr-2" /> Delivery Challan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("hamali")}>
                  <IndianRupee className="h-4 w-4 mr-2" /> Hamali
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("customers")}>
                  <Users className="h-4 w-4 mr-2" /> Customers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("products")}>
                  <Package className="h-4 w-4 mr-2" /> Products
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                  <SettingsIcon className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-md overflow-x-auto">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "dashboard" ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"}
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
            </Button>
            <Button
              id="tab-invoice"
              variant={activeTab === "invoice" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "invoice" ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"}
              onClick={() => setActiveTab("invoice")}
            >
              <FileText className="h-4 w-4 mr-2" /> Invoice
            </Button>
            <Button
              variant={activeTab === "delivery" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "delivery" ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"}
              onClick={() => setActiveTab("delivery")}
            >
              <Truck className="h-4 w-4 mr-2" /> Delivery Challan
            </Button>
            <Button
              variant={activeTab === "hamali" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "hamali" ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"}
              onClick={() => setActiveTab("hamali")}
            >
              <IndianRupee className="h-4 w-4 mr-2" /> Hamali
            </Button>
            <Button
              variant={activeTab === "customers" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "customers" ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"}
              onClick={() => setActiveTab("customers")}
            >
              <Users className="h-4 w-4 mr-2" /> Customers
            </Button>
            <Button
              variant={activeTab === "products" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "products" ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"}
              onClick={() => setActiveTab("products")}
            >
              <Package className="h-4 w-4 mr-2" /> Products
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "settings" ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"}
              onClick={() => setActiveTab("settings")}
            >
              <SettingsIcon className="h-4 w-4 mr-2" /> Settings
            </Button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user && (
            <div className="text-sm font-medium text-slate-600">
              Welcome, {user.username}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()} className="text-slate-500 hover:text-red-600">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
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
          <div className="h-full w-full flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-300">
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
            <div className={`w-full md:w-[450px] border-r bg-card p-4 md:p-6 overflow-y-auto md:h-full z-10 shadow-lg ${
              mobileView === "editor" ? "flex-1 h-full" : "hidden md:block"
            }`}>
              <InvoiceForm
                defaultValues={currentInvoice}
                onUpdate={setCurrentInvoice}
                onPrint={() => handlePrint && handlePrint()}
                onShare={handleShare}
              />
            </div>

            {/* Preview Panel */}
            <div className={`flex-1 bg-muted/30 overflow-auto p-4 md:p-8 flex items-start justify-center relative ${
              mobileView === "preview" ? "h-full" : "hidden md:flex"
            }`}>
              {/* Mobile action buttons */}
              <div className="absolute top-4 right-4 md:hidden flex gap-2 z-10">
                <Button onClick={handleShare} size="sm" variant="outline" className="h-9 border-green-600 text-green-600 bg-white shadow-sm">
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
                <Button onClick={() => handlePrint && handlePrint()} size="sm" className="h-9 shadow-sm">
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
              </div>

              <div className="scale-[0.48] sm:scale-[0.6] md:scale-[0.85] lg:scale-100 origin-top transition-transform pb-20">
                <InvoicePreview ref={contentRef} data={currentInvoice} />
              </div>
            </div>
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
  );
}
