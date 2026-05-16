import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, InvoiceData, defaultInvoice, ClientData } from "@/lib/invoice-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Printer, Save, Share2, Menu } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useClients, useAddInvoice, useUpdateInvoice, useInvoices, useSettings, useProducts } from "@/lib/api";
import { ProductAutocomplete } from "@/components/ui/product-autocomplete";
import { ClientAutocomplete } from "@/components/ui/client-autocomplete";
import { calculateItemAmount, calculateInvoiceTotals } from "@/lib/invoice-utils";
import { InvoicePaymentDialog } from "@/components/invoice/invoice-payment-dialog";


interface InvoiceFormProps {
  defaultValues: InvoiceData;
  onUpdate: (data: InvoiceData) => void;
  onPrint: () => void;
  onShare?: () => void;
}

export function InvoiceForm({ defaultValues, onUpdate, onPrint, onShare }: InvoiceFormProps) {
  const { toast } = useToast();
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();

  const addInvoiceMutation = useAddInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const prevIdRef = useRef(defaultValues?.id);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveInvoice();
      }
      // Ctrl+P to print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        onPrint();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrint]); // Added onPrint to dependency array
  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues || defaultInvoice,
    mode: "onChange"
  });

  const { data: settingsData } = useSettings();

  // Apply default settings to new invoices
  useEffect(() => {
    if (settingsData && !defaultValues?.id) {
      if (settingsData.companyName && form.getValues("sellerName") === defaultInvoice.sellerName) {
        form.setValue("sellerName", settingsData.companyName);
      }
      if (settingsData.address && form.getValues("sellerAddress") === defaultInvoice.sellerAddress) {
        form.setValue("sellerAddress", settingsData.address);
      }
      if (settingsData.gstin && form.getValues("sellerGst") === defaultInvoice.sellerGst) {
        form.setValue("sellerGst", settingsData.gstin);
      }
      if (settingsData.pan && form.getValues("sellerPan") === defaultInvoice.sellerPan) {
        form.setValue("sellerPan", settingsData.pan);
      }
      if (settingsData.bankName && form.getValues("bankName") === defaultInvoice.bankName) {
        form.setValue("bankName", settingsData.bankName);
      }
      if (settingsData.accountNo && form.getValues("bankAccountNo") === defaultInvoice.bankAccountNo) {
        form.setValue("bankAccountNo", settingsData.accountNo);
      }
      if (settingsData.ifsc && form.getValues("bankIfsc") === defaultInvoice.bankIfsc) {
        form.setValue("bankIfsc", settingsData.ifsc);
      }
      if (settingsData.branch && form.getValues("bankBranch") === defaultInvoice.bankBranch) {
        form.setValue("bankBranch", settingsData.branch);
      }
    }
  }, [settingsData, defaultValues?.id, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Reset form when defaultValues change (e.g. loading a saved invoice)
  // CRITICAL: Only reset if the ID changes to avoid infinite loop with onUpdate
  useEffect(() => {
    if (defaultValues && defaultValues.id !== prevIdRef.current) {
      prevIdRef.current = defaultValues.id;
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  // Watch for changes and update parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      onUpdate(value as InvoiceData);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onUpdate]);

  // Auto-suggest invoice number for new invoices
  useEffect(() => {
    const fetchSuggestedNumber = async () => {
      // Only suggest for new invoices (no ID)
      if (!defaultValues?.id && !form.getValues("invoiceNo")) {
        try {
          const response = await fetch("/api/invoices/suggest-number");
          const data = await response.json();
          if (data.suggestedNumber) {
            form.setValue("invoiceNo", data.suggestedNumber);
          }
        } catch (error) {
          console.error("Failed to fetch suggested invoice number:", error);
        }
      }
    };
    fetchSuggestedNumber();
  }, [defaultValues?.id]);

  const { register, watch, setValue, getValues } = form;

  const items = form.watch("items");
  const buyerStateCode = form.watch("buyerStateCode");

  // GST Auto-Detection Logic
  useEffect(() => {
    if (!buyerStateCode) return;
    
    // Default home state is Maharashtra (27)
    // If state code is 27, it's intra-state (CGST + SGST)
    // If state code is anything else, it's inter-state (IGST)
    if (buyerStateCode === "27") {
      // Intra-state
      const currentIgst = form.getValues("igstRate");
      if (currentIgst && currentIgst > 0) {
        // Clear IGST if they are switching to Intra-state
        form.setValue("igstRate", 0);
      }
    } else {
      // Inter-state
      const currentCgst = form.getValues("cgstRate");
      const currentSgst = form.getValues("sgstRate");
      if ((currentCgst && currentCgst > 0) || (currentSgst && currentSgst > 0)) {
        // Clear CGST/SGST if they are switching to Inter-state
        form.setValue("cgstRate", 0);
        form.setValue("sgstRate", 0);
      }
    }
  }, [buyerStateCode, form.setValue, form.getValues]);

  useEffect(() => {
    const currentItems = form.getValues("items");
    currentItems.forEach((item, index) => {
      const qty = Number(item.qty) || 0;
      const weight = Number(item.weight) || 0;
      const rate = Number(item.rate) || 0;
      const amount = calculateItemAmount(qty, weight, rate);
      if (item.amount !== amount) {
        form.setValue(`items.${index}.amount`, amount, { shouldValidate: false });
      }
    });
  }, [JSON.stringify(items.map(i => ({ q: i.qty, w: i.weight, r: i.rate })))]); // Keep dependency but scope it tightly



  const handleClientSelect = (clientData: ClientData) => {
    setSelectedClient(clientData.id);
    setValue("buyerName", clientData.name);
    setValue("buyerAddress", clientData.address || "");
    setValue("buyerGst", clientData.gst || "");
    setValue("buyerStateCode", clientData.stateCode || "");
    setValue("buyerThrough", clientData.transport || "");
  };



  const handleSaveInvoice = async () => {
    const rawData = getValues();

    // Auto-save client logic removed

    // Sanitize data to ensure numbers are valid and ID is handled correctly
    const cleanData = {
      ...rawData,
      discount: Number(rawData.discount) || 0,
      discountLabel: rawData.discountLabel || "Discount",
      cgstRate: Number(rawData.cgstRate) || 0,
      sgstRate: Number(rawData.sgstRate) || 0,
      igstRate: Number(rawData.igstRate) || 0,
      advance: Number(rawData.advance) || 0,
      advanceLabel: rawData.advanceLabel || "Advance",
      otherCharges: Number(rawData.otherCharges) || 0,
      otherChargesLabel: rawData.otherChargesLabel || "Freight / Labour",
      items: rawData.items.map(item => ({
        ...item,
        qty: Number(item.qty) || 0,
        weight: Number(item.weight) || 0,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0,
      }))
    } as any;

    // Remove deprecated fields that no longer exist in DB schema
    delete cleanData.brokerName;
    delete cleanData.commissionRate;
    delete cleanData.commissionAmount;

    // Remove empty ID to let server/database generate it
    if (!cleanData.id) {
      delete cleanData.id;
    }

    try {
      if (cleanData.id) {
        // Update existing invoice
        try {
          await updateInvoiceMutation.mutateAsync({
            id: cleanData.id,
            data: cleanData
          });
          toast({ title: "Success", description: "Invoice updated successfully." });
        } catch (updateError: any) {
          // If update fails because ID not found (404), try to create as new
          if (updateError.message && updateError.message.toLowerCase().includes("not found")) {
            console.warn("Invoice ID not found during update, creating new invoice instead...");
            delete cleanData.id;
            await addInvoiceMutation.mutateAsync(cleanData);
            toast({ title: "Success", description: "Original ID not found. Created as new invoice." });
          } else {
            throw updateError;
          }
        }
      } else {
        // Create new invoice
        await addInvoiceMutation.mutateAsync(cleanData);
        toast({ title: "Success", description: "Invoice saved successfully." });
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h2 className="text-xl font-bold tracking-tight">Editor</h2>
        <div className="flex gap-2">
          {defaultValues?.id && (
            <InvoicePaymentDialog
              invoiceId={defaultValues.id}
              invoiceNo={defaultValues.invoiceNo}
              grandTotal={calculateInvoiceTotals(defaultValues).grandTotal}
              payments={(defaultValues as any).payments || []}
              paidAmount={(defaultValues as any).paidAmount || 0}
              remainingAmount={(defaultValues as any).remainingAmount || calculateInvoiceTotals(defaultValues).grandTotal}
              onPaymentAdded={() => {
                // Refresh invoice data
                window.location.reload();
              }}
            />
          )}
          <Button onClick={handleSaveInvoice} variant="outline" size="sm" className="h-8">
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button onClick={onShare} variant="outline" size="sm" className="h-8 border-green-600 text-green-600 hover:bg-green-50">
            <Share2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button onClick={onPrint} variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90 h-8">
            <Printer className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </div>

      <form className="space-y-6 flex-1 overflow-y-auto pr-2 pb-20">
        {/* Top Section: Buyer & Invoice Info */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Buyer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div>
                <Label className="text-xs">Buyer Name</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <ClientAutocomplete
                      clients={clients}
                      value={watch("buyerName")}
                      onChange={(val) => setValue("buyerName", val)}
                      onSelect={handleClientSelect}
                      placeholder="Select buyer..."
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input {...register("buyerAddress")} className="h-8" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">GSTIN</Label>
                  <Input {...register("buyerGst")} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">State</Label>
                  <Input {...register("buyerStateCode")} className="h-8" />
                </div>
              </div>
              <div>
                <Label className="text-xs">By / Through</Label>
                <Input {...register("buyerThrough")} className="h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Invoice Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Invoice No.</Label>
                  <Input {...register("invoiceNo")} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" {...register("date")} className="h-8" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Vehicle No.</Label>
                <Input {...register("vehicleNo")} className="h-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section: Line Items */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => append({
                id: Math.random().toString(),
                hsnCode: "",
                description: "",
                qty: 1,
                weight: 0,
                rate: 0,
                amount: 0
              })}
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-3">
            {fields.map((field, index) => (
              <div key={field.id} className="bg-slate-50 p-3 rounded-md border space-y-3 relative group">
                <div className="absolute right-2 top-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4 sm:col-span-3">
                    <Label className="text-[10px] uppercase text-muted-foreground">HSN Code</Label>
                    <Input {...register(`items.${index}.hsnCode`)} className="h-7 text-xs bg-white" placeholder="HSN" />
                  </div>
                  <div className="col-span-8 sm:col-span-9">
                    <Label className="text-[10px] uppercase text-muted-foreground">Product / Description</Label>
                    <ProductAutocomplete
                      products={products}
                      value={watch(`items.${index}.description`)}
                      onChange={(val) => setValue(`items.${index}.description`, val)}
                      onSelect={(product) => {
                        setValue(`items.${index}.description`, product.name);
                        if (product.hsnCode) setValue(`items.${index}.hsnCode`, product.hsnCode);
                        if (product.defaultRate) setValue(`items.${index}.rate`, product.defaultRate);
                      }}
                      placeholder="Search or type item..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`items.${index}.qty`, { valueAsNumber: true })}
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Weight</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`items.${index}.weight`, { valueAsNumber: true })}
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Rate</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`items.${index}.rate`, { valueAsNumber: true })}
                      className="h-7 text-xs bg-white"
                      onKeyDown={(e) => {
                        // Shortcut: Press Enter on the last rate field to add a new item row
                        if (e.key === 'Enter' && index === fields.length - 1) {
                          e.preventDefault();
                          append({
                            id: Math.random().toString(),
                            hsnCode: "",
                            description: "",
                            qty: 1,
                            weight: 0,
                            rate: 0,
                            amount: 0
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Amount</Label>
                    <div className="h-7 flex items-center justify-end px-2 font-bold text-xs bg-slate-100 rounded border text-slate-700">
                      {watch(`items.${index}.amount`)?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs border-dashed border rounded-md bg-slate-50">
                No items added.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Section: Payment Details & Taxes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Details & Taxes</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Field Label</Label>
                  <Input className="h-8 font-medium" {...register("discountLabel")} placeholder="Ex: Discount" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Amount</Label>
                  <Input className="h-8" type="number" step="any" {...register("discount", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Field Label</Label>
                  <Input className="h-8 font-medium" {...register("advanceLabel")} placeholder="Ex: Advance" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Amount</Label>
                  <Input className="h-8" type="number" step="any" {...register("advance", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Addition Label</Label>
                  <Input className="h-8 font-medium" {...register("otherChargesLabel")} placeholder="Ex: Freight / Labour" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Addition Amount</Label>
                  <Input className="h-8" type="number" step="any" {...register("otherCharges", { valueAsNumber: true })} />
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1">
                <Label className="text-xs">Invoice Status</Label>
                <Select onValueChange={(val) => setValue("status", val as any)} defaultValue={watch("status")}>
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4 border-t mt-4">
              <div>
                <Label className="text-[10px]">CGST %</Label>
                <Input 
                  className="h-7 text-xs disabled:opacity-50" 
                  type="number" 
                  step="any" 
                  {...register("cgstRate", { valueAsNumber: true })} 
                  disabled={Boolean(watch("buyerStateCode") && watch("buyerStateCode") !== "27")} 
                />
              </div>
              <div>
                <Label className="text-[10px]">SGST %</Label>
                <Input 
                  className="h-7 text-xs disabled:opacity-50" 
                  type="number" 
                  step="any" 
                  {...register("sgstRate", { valueAsNumber: true })} 
                  disabled={Boolean(watch("buyerStateCode") && watch("buyerStateCode") !== "27")} 
                />
              </div>
              <div>
                <Label className="text-[10px]">IGST %</Label>
                <Input 
                  className="h-7 text-xs disabled:opacity-50" 
                  type="number" 
                  step="any" 
                  {...register("igstRate", { valueAsNumber: true })} 
                  disabled={watch("buyerStateCode") === "27"} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collapsible Advanced Section: Seller & Bank */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-sm font-medium py-3 border rounded px-4 bg-muted/30">
              Advanced Settings (Seller & Bank Details)
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Seller Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3">
                    <div>
                      <Label className="text-xs">Company Name</Label>
                      <Input {...register("sellerName")} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">Hindi Name</Label>
                      <Input {...register("sellerHindiName")} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">Subtitle</Label>
                      <Input {...register("sellerSubtitle")} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">Address</Label>
                      <Input {...register("sellerAddress")} className="h-8" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">PAN</Label>
                        <Input {...register("sellerPan")} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">GSTIN</Label>
                        <Input {...register("sellerGst")} className="h-8" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Contact 1</Label>
                        <Input {...register("sellerContact1")} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Contact 2</Label>
                        <Input {...register("sellerContact2")} className="h-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Bank Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3">
                    <div>
                      <Label className="text-xs">Bank Name</Label>
                      <Input {...register("bankName")} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">Account No.</Label>
                      <Input {...register("bankAccountNo")} className="h-8" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">IFSC Code</Label>
                        <Input {...register("bankIfsc")} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Branch</Label>
                        <Input {...register("bankBranch")} className="h-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </div >
  );
}
