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
import { Share2, Link, Check, ExternalLink, MessageSquare, Download, Loader2, CloudUpload } from "lucide-react";
import { useUploadToGoogleDrive, useGoogleDriveStatus } from "@/lib/api";

function GoogleDriveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="currentColor">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

interface PdfShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  documentNo: string;
  documentType: "Invoice" | "Challan";
  pdfBase64?: string;
}

export function PdfShareDialog({
  isOpen,
  onClose,
  pdfUrl,
  documentNo,
  documentType,
  pdfBase64,
}: PdfShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [driveUploadResult, setDriveUploadResult] = useState<{
    webViewLink: string;
    folderName: string;
  } | null>(null);

  const { data: driveStatus } = useGoogleDriveStatus();
  const uploadToDrive = useUploadToGoogleDrive();

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
          description: "Direct file sharing is not supported by your browser. File downloaded to your device.",
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

  const handleUploadToDrive = async () => {
    try {
      let base64 = pdfBase64;
      if (!base64) {
        // Fetch from pdfUrl and convert to base64
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error("Could not load PDF content");
        const blob = await res.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUri = reader.result as string;
            resolve(dataUri.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const folderType = documentType === "Challan" ? "challans" : "invoices";
      const filename = `(LNB ${documentType} - ${documentNo}).pdf`;

      const result = await uploadToDrive.mutateAsync({
        pdfBase64: base64,
        filename,
        folderType,
      });

      setDriveUploadResult({
        webViewLink: result.webViewLink,
        folderName: result.folderName,
      });

      toast({
        title: "Saved to Google Drive!",
        description: `Uploaded into Google Drive > ${result.folderName} folder.`,
      });
    } catch (err: any) {
      toast({
        title: "Google Drive Upload Failed",
        description: err?.message || "Please check your Google Drive settings in Settings > Google Drive.",
        variant: "destructive",
      });
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
            {documentType} #{documentNo} has been saved successfully. Share or archive the document below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {/* Share Link Row */}
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
              className="h-8 px-3 shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none font-medium"
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

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-2 mt-1">
            <Button
              onClick={handleSharePdfFile}
              disabled={isSharing}
              className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 h-10 text-sm font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              Share / Download PDF
            </Button>

            {/* Google Drive Upload Button */}
            {driveUploadResult ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                  <GoogleDriveIcon className="h-4 w-4 shrink-0" />
                  <span>Saved in <strong>Google Drive &gt; {driveUploadResult.folderName}</strong></span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(driveUploadResult.webViewLink, "_blank")}
                  className="h-7 text-xs border-emerald-300 hover:bg-emerald-100 text-emerald-800"
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> Open
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleUploadToDrive}
                disabled={uploadToDrive.isPending}
                className="w-full flex items-center justify-center gap-2 h-10 text-sm font-semibold border-slate-300 hover:bg-slate-100 dark:border-slate-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {uploadToDrive.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Uploading to Google Drive...</span>
                  </>
                ) : (
                  <>
                    <GoogleDriveIcon className="h-4 w-4" />
                    <span>Upload to Google Drive</span>
                  </>
                )}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                onClick={handleWhatsAppShare}
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 h-10 text-sm font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageSquare className="h-4 w-4 fill-white" />
                WhatsApp Link
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open(fullUrl, "_blank")}
                className="w-full flex items-center justify-center gap-2 h-10 text-sm font-semibold border-muted-foreground/30 hover:bg-muted transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <ExternalLink className="h-4 w-4" />
                Preview PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-3">
          <Button variant="ghost" onClick={onClose} className="h-8 px-4 text-sm font-medium">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
