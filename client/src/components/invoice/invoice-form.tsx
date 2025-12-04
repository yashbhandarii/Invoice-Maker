import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, InvoiceData } from "@/lib/invoice-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Printer } from "lucide-react";
import { useEffect } from "react";

interface InvoiceFormProps {
  defaultValues: InvoiceData;
  onUpdate: (data: InvoiceData) => void;
  onPrint: () => void;
}

export function InvoiceForm({ defaultValues, onUpdate, onPrint }: InvoiceFormProps) {
  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues,
    mode: "onChange"
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Watch for changes and update parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      // We cast because watch returns partial values sometimes
      onUpdate(value as InvoiceData);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onUpdate]);

  const { register, watch, setValue } = form;

  // Auto-calculate line amounts when qty/weight/rate changes
  const items = watch("items");
  useEffect(() => {
    items.forEach((item, index) => {
      const qty = Number(item.qty) || 0;
      const weight = Number(item.weight) || 0;
      const rate = Number(item.rate) || 0;
      
      // Logic: If weight is present, use weight * rate, else qty * rate
      // Or maybe standard is Qty * Rate, but if Weight is there...
      // Based on image: Weight 22, Rate 22, Amount 484. So 22*22=484.
      // So calculate based on Weight if > 0, else Qty.
      
      const calculatedAmount = (weight > 0 ? weight : qty) * rate;
      
      if (item.amount !== calculatedAmount) {
        setValue(`items.${index}.amount`, calculatedAmount);
      }
    });
  }, [JSON.stringify(items.map(i => ({ q: i.qty, w: i.weight, r: i.rate })))]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Invoice Editor</h2>
        <Button onClick={onPrint} variant="default" className="bg-primary text-white hover:bg-primary/90">
          <Printer className="w-4 h-4 mr-2" />
          Print / PDF
        </Button>
      </div>

      <form className="space-y-4 flex-1 overflow-y-auto pr-2">
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Line Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
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
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0 last:pb-0">
                    <div className="col-span-2">
                      <Label className="text-xs">HSN</Label>
                      <Input {...register(`items.${index}.hsnCode`)} placeholder="HSN" className="h-8 text-xs" />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">Description</Label>
                      <Input {...register(`items.${index}.description`)} placeholder="Item Name" className="h-8 text-xs" />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Qty</Label>
                      <Input 
                        type="number" 
                        step="any" 
                        {...register(`items.${index}.qty`, { valueAsNumber: true })} 
                        className="h-8 text-xs px-1" 
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Weight</Label>
                      <Input 
                        type="number" 
                        step="any" 
                        {...register(`items.${index}.weight`, { valueAsNumber: true })} 
                        className="h-8 text-xs px-1" 
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Rate</Label>
                      <Input 
                        type="number" 
                        step="any" 
                        {...register(`items.${index}.rate`, { valueAsNumber: true })} 
                        className="h-8 text-xs" 
                      />
                    </div>
                    <div className="col-span-1">
                       <Label className="text-xs">Amt</Label>
                       <div className="text-xs py-2 font-bold text-right">
                         {watch(`items.${index}.amount`)?.toFixed(2)}
                       </div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {fields.length === 0 && (
                   <div className="text-center py-8 text-muted-foreground text-sm border-dashed border rounded-md">
                      No items added. Click "Add Item" to start.
                   </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Totals & Taxes</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Amount</Label>
                  <Input type="number" step="any" {...register("discount", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>Advance Paid</Label>
                  <Input type="number" step="any" {...register("advance", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>CGST Rate (%)</Label>
                  <Input type="number" step="any" {...register("cgstRate", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>SGST Rate (%)</Label>
                  <Input type="number" step="any" {...register("sgstRate", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>IGST Rate (%)</Label>
                  <Input type="number" step="any" {...register("igstRate", { valueAsNumber: true })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Buyer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Buyer Name</Label>
                  <Input {...register("buyerName")} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input {...register("buyerAddress")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GSTIN</Label>
                    <Input {...register("buyerGst")} />
                  </div>
                  <div>
                    <Label>State Code</Label>
                    <Input {...register("buyerStateCode")} />
                  </div>
                </div>
                <div>
                  <Label>By / Through (Transport)</Label>
                  <Input {...register("buyerThrough")} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice No.</Label>
                    <Input {...register("invoiceNo")} />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" {...register("date")} />
                  </div>
                </div>
                <div>
                  <Label>Vehicle No.</Label>
                  <Input {...register("vehicleNo")} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Seller Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input {...register("sellerName")} />
                </div>
                <div>
                  <Label>Hindi Name (Optional)</Label>
                  <Input {...register("sellerHindiName")} />
                </div>
                <div>
                  <Label>Subtitle / Business Type</Label>
                  <Input {...register("sellerSubtitle")} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input {...register("sellerAddress")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>PAN</Label>
                    <Input {...register("sellerPan")} />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input {...register("sellerGst")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact 1</Label>
                    <Input {...register("sellerContact1")} />
                  </div>
                  <div>
                    <Label>Contact 2</Label>
                    <Input {...register("sellerContact2")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bank" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input {...register("bankName")} />
                </div>
                <div>
                  <Label>Account No.</Label>
                  <Input {...register("bankAccountNo")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>IFSC Code</Label>
                    <Input {...register("bankIfsc")} />
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <Input {...register("bankBranch")} />
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
