import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Share2, Link, Check, ExternalLink, MessageSquare, Download, Loader2 } from "lucide-react";

interface PdfShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  documentNo: string;
  documentType: "Invoice" | "Challan";
}

export function PdfShareDialog({
  isOpen,
  onClose,
  pdfUrl,
  documentNo,
  documentType,
}: PdfShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleSharePdfFile = async () => {
    setIsSharing(true);
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");
      const blob = await response.blob();
      const file = new File([blob], `${documentType}_${documentNo}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${documentType} #${documentNo}`,
          text: `Please find attached ${documentType} #${documentNo}`,
        });
      } else {
        // Fallback: trigger download
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `${documentType}_${documentNo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "PDF Downloaded",
          description: "Your browser doesn't support direct file sharing. Please drag and drop the downloaded file to WhatsApp.",
        });
      }
    } catch (err) {
      console.error("Error sharing file:", err);
      toast({
        title: "Sharing Failed",
        description: "Could not share or download the PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const fullUrl = `${window.location.origin}${pdfUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "The document link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the link from the input field.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Please find the ${documentType === "Invoice" ? "Invoice" : "Delivery Challan"} #${documentNo} here:\n${fullUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Share2 className="h-6 w-6 animate-pulse" />
          </div>
          <DialogTitle className="text-center text-xl font-bold tracking-tight">
            Share {documentType}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm">
            {documentType} #{documentNo} has been saved successfully. Share the secure link below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border">
            <Link className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
            <Input
              value={fullUrl}
              readOnly
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-8 text-xs select-all text-muted-foreground font-mono"
            />
            <Button
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copied
                </>
              ) : (
                "Copy"
              )}
            </Button>
          </div>

          <Button
            onClick={handleSharePdfFile}
            disabled={isSharing}
            className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 h-11 text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            Share PDF Document
          </Button>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              onClick={handleWhatsAppShare}
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 h-11 text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquare className="h-4 w-4 fill-white" />
              WhatsApp Link
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open(fullUrl, "_blank")}
              className="w-full flex items-center justify-center gap-2 h-11 text-sm font-semibold border-muted-foreground/30 hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink className="h-4 w-4" />
              Open PDF
            </Button>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button variant="ghost" onClick={onClose} className="h-9 px-4 text-sm font-medium">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
