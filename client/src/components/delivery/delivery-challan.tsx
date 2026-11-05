import { useRef, useState, useEffect } from "react";
import { DeliveryForm } from "./delivery-form";
import { DeliveryPreview } from "./delivery-preview";
import { DeliveryChallanData, defaultChallan } from "@/lib/invoice-types";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Share2, Printer, Trash2, FileText, RefreshCw, Eye, PenLine, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { PdfShareDialog } from "@/components/ui/pdf-share-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeliveryChallans, useAddDeliveryChallan, useDeleteDeliveryChallan, useUpdateDeliveryChallan, useClients, useAddClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeliveryChallan() {
    const [data, setData] = useState<DeliveryChallanData>(defaultChallan);
    const contentRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("create");
    const [mobileChallanView, setMobileChallanView] = useState<"editor" | "preview">("editor");

    // Payment Dialog State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedChallanId, setSelectedChallanId] = useState<string | null>(null);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentAmount, setPaymentAmount] = useState("");

    // API Hooks
    const { data: history = [], isLoading, refetch } = useDeliveryChallans();
    const addMutation = useAddDeliveryChallan();
    const updateMutation = useUpdateDeliveryChallan();
    const deleteMutation = useDeleteDeliveryChallan();
    const { data: clients = [] } = useClients();
    const addClientMutation = useAddClient();

    // Auto-increment Challan No
    useEffect(() => {
        if (activeTab === "create" && !data.id && history.length > 0 && !data.challanNo) {
            const maxChallanNo = history.reduce((max, curr) => {
                const num = Number(curr.challanNo);
                return !isNaN(num) && num > max ? num : max;
            }, 0);
            setData(prev => ({ ...prev, challanNo: String(maxChallanNo + 1) }));
        } else if (activeTab === "create" && !data.id && history.length === 0 && !data.challanNo) {
            setData(prev => ({ ...prev, challanNo: "1" }));
        }
    }, [history, data.challanNo, activeTab, data.id]);

    // Print specific challan (for history)
    const [printData, setPrintData] = useState<DeliveryChallanData | null>(null);
    const historyPrintRef = useRef<HTMLDivElement>(null);

    const shareContainerRef = useRef<HTMLDivElement>(null);
    const isSaved = history.some(c => c.id === data.id);

    // Zoom and share states
    const [zoom, setZoom] = useState(0.85);
    const [isSharing, setIsSharing] = useState(false);
    const [sharePdfUrl, setSharePdfUrl] = useState("");
    const [sharePdfBase64, setSharePdfBase64] = useState("");
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: shareContainerRef,
        documentTitle: `(LNB Challan - ${data.challanNo} ${format(new Date(data.date || new Date()), "dd.MM.yyyy")})`,
    });

    const handleHistoryPrint = useReactToPrint({
        contentRef: historyPrintRef,
        documentTitle: `(LNB Challan - ${printData?.challanNo || 'Print'} ${format(new Date(printData?.date || new Date()), "dd.MM.yyyy")})`,
        onAfterPrint: () => setPrintData(null),
    });

    // Effect to trigger print when printData is set
    useEffect(() => {
        if (printData && historyPrintRef.current) {
            handleHistoryPrint();
        }
    }, [printData]);

    const handleShare = async (shareData: DeliveryChallanData = data, ref = shareContainerRef) => {
        if (!isSaved) {
            toast({ title: "Save Required", description: "Please save the challan first before sharing.", variant: "destructive" });
            return;
        }

        if (!ref.current) return;

        setIsSharing(true);
        try {
            // Using optimized pixelRatio: 1.5 for fast rendering on mobile
            const dataUrl = await toJpeg(ref.current, {
                quality: 0.96,
                pixelRatio: 2.8,
                skipFonts: true,
                cacheBust: true,
            });
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "MEDIUM");

            const dateStr = shareData.date || new Date().toISOString().split('T')[0];
            const formattedDate = format(new Date(dateStr), "dd.MM.yyyy");
            const fileName = `(LNB Challan - ${shareData.challanNo || "Draft"} ${formattedDate}).pdf`;

            const pdfBase64 = pdf.output("datauristring").split(",")[1];
            setSharePdfBase64(pdfBase64);

            const response = await fetch("/api/share-pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pdfBase64,
                    filename: fileName,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to upload PDF");
            }

            const resData = await response.json();
            setSharePdfUrl(resData.url);
            setIsShareDialogOpen(true);
        } catch (error) {
            console.error("Error sharing PDF:", error);
            toast({ title: "Error", description: "Share failed", variant: "destructive" });
        } finally {
            setIsSharing(false);
        }
    };

    const handleNew = () => {
        setData({
            ...defaultChallan,
            challanNo: ""
        });
    };

    const handleSave = async () => {
        if (!data.challanNo) {
            toast({ title: "Error", description: "Challan No is required", variant: "destructive" });
            return;
        }

        try {
            if (data.id) {
                const saved = await updateMutation.mutateAsync({ id: data.id, data });
                toast({ title: "Updated", description: "Challan updated successfully" });
                if (saved) {
                    setData(saved);
                }
            } else {
                const saved = await addMutation.mutateAsync(data);
                toast({ title: "Saved", description: "Challan saved successfully" });

                // Auto-save client if new
                if (data.clientName) {
                    const existingClient = clients.find(c => c.name.toLowerCase() === data.clientName?.toLowerCase());
                    if (!existingClient) {
                        try {
                            await addClientMutation.mutateAsync({
                                name: data.clientName,
                                address: data.clientAddress || "",
                                gst: "", // Not present in delivery form
                                stateCode: "",
                                transport: ""
                            });
                            toast({ title: "Client Saved", description: "New buyer added to customers list." });
                        } catch (err) {
                            console.error("Failed to auto-save client", err);
                        }
                    }
                }

                if (saved) {
                    setData(saved);
                }
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleEdit = (challan: DeliveryChallanData) => {
        // Ensure payments is initialized if missing from old data
        setData({
            ...challan,
            payments: challan.payments || []
        });
        setActiveTab("create");
    };

    const openPaymentDialog = (id: string) => {
        setSelectedChallanId(id);
        setPaymentAmount("");
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setIsPaymentOpen(true);
    };

    const handlePaymentSubmit = async () => {
        if (!selectedChallanId || !paymentAmount) return;

        const challan = history.find(c => c.id === selectedChallanId);
        if (!challan) return;

        const amount = Number(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Error", description: "Invalid amount", variant: "destructive" });
            return;
        }

        if (amount > (challan.totalRemainingFreightSum || 0)) {
            toast({ title: "Error", description: "Amount cannot exceed pending freight", variant: "destructive" });
            return;
        }

        const newPayment = {
            date: paymentDate,
            amount: amount,
            note: "Payment"
        };

        const updatedPayments = [...(challan.payments || []), newPayment];
        const newGivenFreight = (challan.totalGivenFreightSum || 0) + amount;
        const newRemaining = (challan.totalFreightSum || 0) - newGivenFreight - (challan.expenseAmount || 0);

        try {
            await updateMutation.mutateAsync({
                id: selectedChallanId,
                data: {
                    payments: updatedPayments,
                    totalGivenFreightSum: newGivenFreight,
                    totalRemainingFreightSum: newRemaining
                }
            });
            toast({ title: "Success", description: "Payment recorded successfully" });
            setIsPaymentOpen(false);
        } catch (error: any) {
            console.error("Payment error:", error);
            toast({ title: "Error", description: error.message || "Failed to record payment", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this challan?")) {
            try {
                await deleteMutation.mutateAsync(id);
                toast({ title: "Deleted", description: "Challan deleted successfully" });
            } catch (error: any) {
                toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
            }
        }
    };

    return (
        <div className="h-full w-full flex flex-col p-4 gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <TabsList>
                        <TabsTrigger value="create">Create Challan</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="create" className="flex-1 h-full mt-0">
                    <div className="h-full w-full flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Mobile Toggle Bar */}
                        <div className="md:hidden flex items-center border-b bg-white shrink-0 z-20">
                            <button
                                onClick={() => setMobileChallanView("editor")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
                                    mobileChallanView === "editor"
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <PenLine className="h-4 w-4" />
                                Editor
                            </button>
                            <button
                                onClick={() => setMobileChallanView("preview")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
                                    mobileChallanView === "preview"
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
                            mobileChallanView === "editor" ? "flex-1 h-full" : "hidden md:block"
                        }`}>
                            <DeliveryForm
                                defaultValues={data}
                                onUpdate={setData}
                                onPrint={() => handlePrint && handlePrint()}
                                onShare={() => handleShare(data, shareContainerRef)}
                                onSave={handleSave}
                                isSaved={isSaved}
                                onNew={handleNew}
                            />
                        </div>

                        {/* Preview Panel */}
                        <div className={`flex-1 bg-muted/30 overflow-auto p-4 md:p-8 flex flex-col items-center justify-start relative ${
                            mobileChallanView === "preview" ? "h-full" : "hidden md:flex"
                        }`}>
                            <div className="absolute top-4 right-4 md:hidden flex gap-2 z-20">
                                <Button 
                                    onClick={() => handleShare(data, shareContainerRef)} 
                                    disabled={!isSaved || isSharing}
                                    size="sm" 
                                    variant="outline" 
                                    className="h-9 border-green-600 text-green-600 bg-white shadow-sm disabled:opacity-50"
                                    title={!isSaved ? "Please save challan first to share" : "Share"}
                                >
                                    {isSharing ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                        <Share2 className="h-4 w-4 mr-1" />
                                    )}
                                    Share
                                </Button>
                                <Button 
                                    onClick={() => handlePrint && handlePrint()} 
                                    disabled={!isSaved}
                                    size="sm" 
                                    className="h-9 shadow-sm disabled:opacity-50"
                                    title={!isSaved ? "Please save challan first to print" : "Print"}
                                >
                                    <Printer className="h-4 w-4 mr-1" /> Print
                                </Button>
                            </div>

                            {/* Glassy zoom controls */}
                            <div className="sticky top-0 mb-4 bg-white/80 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-md flex items-center gap-2 z-20 transition-all select-none">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
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
                                    onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
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
                                    marginBottom: `calc((1 - ${zoom}) * -100%)`
                                }} 
                                className="transition-transform duration-200 pb-20 origin-top"
                            >
                                <DeliveryPreview ref={contentRef} data={data} />
                            </div>
                        </div>

                        {/* Hidden container for PDF capture - unscaled and offscreen */}
                        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "210mm", height: "297mm", overflow: "hidden" }}>
                            <DeliveryPreview ref={shareContainerRef} data={data} isStatic={true} />
                        </div>

                        {/* Share Dialog */}
                        <PdfShareDialog
                            isOpen={isShareDialogOpen}
                            onClose={() => setIsShareDialogOpen(false)}
                            pdfUrl={sharePdfUrl}
                            pdfBase64={sharePdfBase64}
                            documentNo={data.challanNo || "Draft"}
                            documentType="Challan"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
                    <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Challan History</CardTitle>
                                    <CardDescription>View and manage saved challans</CardDescription>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => refetch()}>
                                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 flex-1 overflow-auto">
                            <div className="rounded-md border bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Challan No</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Buyer</TableHead>
                                            <TableHead className="text-right">Total Freight</TableHead>
                                            <TableHead className="text-right">Payment History</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : history.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No challans found</TableCell>
                                            </TableRow>
                                        ) : (
                                            history.map((challan: any) => (
                                                <TableRow key={challan.id}>
                                                    <TableCell className="font-medium align-top">{challan.challanNo}</TableCell>
                                                    <TableCell className="align-top">{format(new Date(challan.date), "dd MMM yyyy")}</TableCell>
                                                    <TableCell className="align-top">{challan.clientName || "-"}</TableCell>
                                                    <TableCell className="text-right align-top">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-semibold">₹{challan.totalFreightSum?.toFixed(2)}</span>
                                                            {challan.totalRemainingFreightSum > 0 && (
                                                                <span className="text-xs text-red-600">Pending: ₹{challan.totalRemainingFreightSum?.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right align-top">
                                                        <div className="flex flex-col items-end gap-1">
                                                            {challan.payments && challan.payments.length > 0 ? (
                                                                challan.payments.map((payment: any, index: number) => (
                                                                    <div key={index} className="text-xs text-muted-foreground">
                                                                        Paid: {format(new Date(payment.date), "dd/MM/yy")} - ₹{payment.amount}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-1 align-top">
                                                        {challan.totalRemainingFreightSum > 0 && (
                                                            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50" onClick={() => openPaymentDialog(challan.id)} title="Pay Pending">
                                                                <span className="font-bold">₹</span>
                                                            </Button>
                                                        )}
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600" onClick={() => handleEdit(challan)} title="Edit">
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => setPrintData(challan)} title="Print">
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(challan.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Hidden Preview for History Printing */}
            <div className="hidden">
                {printData && (
                    <div className="w-[210mm]">
                        <DeliveryPreview ref={historyPrintRef} data={printData} />
                    </div>
                )}
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pay Pending Freight</DialogTitle>
                        <DialogDescription>
                            Record a payment for the pending freight amount.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="col-span-3"
                                placeholder="Enter amount"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
                        <Button onClick={handlePaymentSubmit}>Save Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
