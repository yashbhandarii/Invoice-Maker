import { useState, useRef } from "react";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { defaultInvoice, InvoiceData } from "@/lib/invoice-types";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function InvoiceBuilder() {
  const [data, setData] = useState<InvoiceData>(defaultInvoice);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Invoice-${data.invoiceNo}`,
  });

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-background overflow-hidden">
      {/* Sidebar Form - Scrollable */}
      <div className="w-full md:w-[450px] border-r bg-card p-4 md:p-6 overflow-y-auto h-[50vh] md:h-full z-10 shadow-lg">
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
        
        <div className="scale-[0.6] md:scale-[0.85] lg:scale-100 origin-top transition-transform">
          <InvoicePreview ref={contentRef} data={data} />
        </div>
      </div>
    </div>
  );
}
