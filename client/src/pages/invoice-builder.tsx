import { useState, useRef, useEffect } from "react";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { InvoiceDashboard } from "@/components/invoice/invoice-dashboard";
import { useStore } from "@/lib/store";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer, LayoutDashboard, FileText, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

export default function InvoiceBuilder() {
  const { currentInvoice, setCurrentInvoice } = useStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("invoice");
  const { toast } = useToast();

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Invoice-${currentInvoice.invoiceNo}`,
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

      const fileName = `Invoice-${currentInvoice.invoiceNo || "Draft"}.pdf`;
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
          <span>InvoiceGen</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-md">
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
            <FileText className="h-4 w-4 mr-2" /> Invoice Builder
          </Button>
        </div>

        <div className="w-24"></div> {/* Spacer for balance */}
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
            {/* Sidebar Form - Scrollable */}
            <div className="w-full md:w-[450px] border-r bg-card p-4 md:p-6 overflow-y-auto h-[40vh] md:h-full z-10 shadow-lg">
              <InvoiceForm
                defaultValues={currentInvoice}
                onUpdate={setCurrentInvoice}
                onPrint={() => handlePrint && handlePrint()}
                onShare={handleShare}
              />
            </div>

            {/* Preview Area - Scrollable */}
            <div className="flex-1 bg-muted/30 overflow-auto p-4 md:p-8 flex items-start justify-center relative">
              <div className="absolute top-4 right-4 md:hidden flex gap-2">
                <Button onClick={handleShare} size="icon" variant="outline" className="border-green-600 text-green-600">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button onClick={() => handlePrint && handlePrint()} size="icon">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>

              <div className="scale-[0.6] md:scale-[0.85] lg:scale-100 origin-top transition-transform pb-20">
                <InvoicePreview ref={contentRef} data={currentInvoice} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
