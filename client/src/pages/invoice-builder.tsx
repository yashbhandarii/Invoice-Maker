import { useState, useRef } from "react";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { InvoiceDashboard } from "@/components/invoice/invoice-dashboard";
import { defaultInvoice, InvoiceData } from "@/lib/invoice-types";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer, LayoutDashboard, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvoiceBuilder() {
  const [data, setData] = useState<InvoiceData>(defaultInvoice);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("invoice");

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Invoice-${data.invoiceNo}`,
  });

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
                defaultValues={data} 
                onUpdate={setData} 
                onPrint={() => handlePrint && handlePrint()} 
              />
            </div>

            {/* Preview Area - Scrollable */}
            <div className="flex-1 bg-muted/30 overflow-auto p-4 md:p-8 flex items-start justify-center relative">
              <div className="absolute top-4 right-4 md:hidden">
                <Button onClick={() => handlePrint && handlePrint()} size="icon">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="scale-[0.6] md:scale-[0.85] lg:scale-100 origin-top transition-transform pb-20">
                <InvoicePreview ref={contentRef} data={data} />
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
