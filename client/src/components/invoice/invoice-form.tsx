import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, InvoiceData, defaultInvoice, ClientData } from "@/lib/invoice-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Printer, Save, UserPlus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useClients, useAddClient, useAddInvoice, useUpdateInvoice } from "@/lib/api";

interface InvoiceFormProps {
  defaultValues: InvoiceData;
  onUpdate: (data: InvoiceData) => void;
  onPrint: () => void;
}

export function InvoiceForm({ defaultValues, onUpdate, onPrint }: InvoiceFormProps) {
  const { toast } = useToast();
  const { data: clients = [] } = useClients();
  const addClientMutation = useAddClient();
  const addInvoiceMutation = useAddInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const prevIdRef = useRef(defaultValues?.id);

  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues || defaultInvoice,
    mode: "onChange"
  });

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

  const { register, watch, setValue, getValues } = form;

  // Auto-calculate line amounts
  const items = watch("items");
  useEffect(() => {
    items.forEach((item, index) => {
      const qty = Number(item.qty) || 0;
      const weight = Number(item.weight) || 0;
      const rate = Number(item.rate) || 0;
      const calculatedAmount = (weight > 0 ? weight : qty) * rate;

      if (item.amount !== calculatedAmount) {
        setValue(`items.${index}.amount`, calculatedAmount);
      }
    });
  }, [JSON.stringify(items.map(i => ({ q: i.qty, w: i.weight, r: i.rate })))]);

  const handleSaveClient = async () => {
    const data = getValues();
    if (!data.buyerName) {
      toast({ title: "Error", description: "Buyer name is required to save client.", variant: "destructive" });
      return;
    }

    try {
      await addClientMutation.mutateAsync({
        name: data.buyerName,
        address: data.buyerAddress,
        gst: data.buyerGst,
        stateCode: data.buyerStateCode,
        transport: data.buyerThrough
      });
      toast({ title: "Success", description: "Client saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save client.", variant: "destructive" });
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(clientId);
      setValue("buyerName", client.name);
      setValue("buyerAddress", client.address || "");
      setValue("buyerGst", client.gst || "");
      setValue("buyerStateCode", client.stateCode || "");
      setValue("buyerThrough", client.transport || "");
    }
  };

  const handleSaveInvoice = async () => {
    const rawData = getValues();

    // Sanitize data to ensure numbers are valid and ID is handled correctly
    const cleanData = {
      ...rawData,
      discount: Number(rawData.discount) || 0,
      cgstRate: Number(rawData.cgstRate) || 0,
      sgstRate: Number(rawData.sgstRate) || 0,
      igstRate: Number(rawData.igstRate) || 0,
      advance: Number(rawData.advance) || 0,
      items: rawData.items.map(item => ({
        ...item,
        qty: Number(item.qty) || 0,
        weight: Number(item.weight) || 0,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0,
      }))
    };

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
          <Button onClick={handleSaveInvoice} variant="outline" size="sm" className="h-8">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={onPrint} variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90 h-8">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <form className="space-y-4 flex-1 overflow-y-auto pr-2 pb-20">
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="items" className="text-xs py-2">Items</TabsTrigger>
            <TabsTrigger value="client" className="text-xs py-2">Client</TabsTrigger>
            <TabsTrigger value="invoice" className="text-xs py-2">Invoice</TabsTrigger>
            <TabsTrigger value="company" className="text-xs py-2">Seller</TabsTrigger>
            <TabsTrigger value="bank" className="text-xs py-2">Bank</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4 mt-4">
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
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 p-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-slate-50 p-3 rounded-md border space-y-3 relative group">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <div className="col-span-3">
                        <Label className="text-[10px] uppercase text-muted-foreground">HSN Code</Label>
                        <Input {...register(`items.${index}.hsnCode`)} className="h-7 text-xs bg-white" placeholder="HSN" />
                      </div>
                      <div className="col-span-9">
                        <Label className="text-[10px] uppercase text-muted-foreground">Description</Label>
                        <Input {...register(`items.${index}.description`)} className="h-7 text-xs bg-white" placeholder="Item Description" />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 p-3">
                <div>
                  <Label className="text-xs">Discount</Label>
                  <Input className="h-8" type="number" step="any" {...register("discount", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label className="text-xs">Advance</Label>
                  <Input className="h-8" type="number" step="any" {...register("advance", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select onValueChange={(val) => setValue("status", val as any)} defaultValue={watch("status")}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-2 pt-2 border-t mt-2">
                  <div>
                    <Label className="text-[10px]">CGST %</Label>
                    <Input className="h-7 text-xs" type="number" step="any" {...register("cgstRate", { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label className="text-[10px]">SGST %</Label>
                    <Input className="h-7 text-xs" type="number" step="any" {...register("sgstRate", { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label className="text-[10px]">IGST %</Label>
                    <Input className="h-7 text-xs" type="number" step="any" {...register("igstRate", { valueAsNumber: true })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Buyer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {clients && clients.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-xs mb-1 block">Load Saved Client</Label>
                    <Select onValueChange={handleClientSelect} value={selectedClient}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Buyer Name</Label>
                  <div className="flex gap-2">
                    <Input {...register("buyerName")} className="h-8" />
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleSaveClient} title="Save Client">
                      <UserPlus className="h-4 w-4" />
                    </Button>
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
                    <Label className="text-xs">State Code</Label>
                    <Input {...register("buyerStateCode")} className="h-8" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Transport</Label>
                  <Input {...register("buyerThrough")} className="h-8" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-4 mt-4">
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
          </TabsContent>

          <TabsContent value="company" className="space-y-4 mt-4">
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
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-4">
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
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
