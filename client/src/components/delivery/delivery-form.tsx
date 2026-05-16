import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deliveryChallanSchema, DeliveryChallanData, defaultChallan } from "@/lib/invoice-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Printer, Share2, Save, UserPlus, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClients, useAddClient, useTransporters, useAddTransporter, useProducts } from "@/lib/api";
import { ClientAutocomplete } from "@/components/ui/client-autocomplete";
import { ProductAutocomplete } from "@/components/ui/product-autocomplete";
import { TransporterAutocomplete } from "@/components/ui/transporter-autocomplete";
import { ClientData } from "@/lib/invoice-types";

interface DeliveryFormProps {
    defaultValues?: DeliveryChallanData;
    onUpdate: (data: DeliveryChallanData) => void;
    onPrint: () => void;

    onShare?: () => void;
    onSave?: () => void;
}

export function DeliveryForm({ defaultValues, onUpdate, onPrint, onShare, onSave }: DeliveryFormProps) {
    const form = useForm<DeliveryChallanData>({
        resolver: zodResolver(deliveryChallanSchema),
        defaultValues: defaultValues || defaultChallan,
        mode: "onChange"
    });
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("details");

    useEffect(() => {
        if (defaultValues) {
            form.reset(defaultValues);
        }
    }, [defaultValues?.id, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    });

    // Watch for changes and update parent
    useEffect(() => {
        const subscription = form.watch((value) => {
            onUpdate(value as DeliveryChallanData);
        });
        return () => subscription.unsubscribe();
    }, [form.watch, onUpdate]);

    const { register, watch, setValue } = form;
    const { data: clients = [] } = useClients();
    const { data: products = [] } = useProducts();

    const handleClientSelect = (clientData: ClientData) => {
        setValue("clientName", clientData.name);
        setValue("clientAddress", clientData.address || "");
    };

    const handleAddNewClient = (name: string) => {
        setValue("clientName", name);
        setValue("clientAddress", "");
    };

    const { data: transporters = [] } = useTransporters();
    const addTransporterMutation = useAddTransporter();
    const addClientMutation = useAddClient();

    const handleInternalSave = async () => {
        const data = form.getValues();

        // Check if transporter exists, if not add them
        if (data.driverName && !transporters.find(t => t.name.toLowerCase() === data.driverName?.toLowerCase())) {
            try {
                await addTransporterMutation.mutateAsync({
                    name: data.driverName,
                    vehicleNo: data.vehicleNo || null,
                    mobile: data.driverMobile || null
                });
                toast({ title: "Transporter Saved", description: "New transporter added to database." });
            } catch (e) {
                console.error("Failed to auto-save transporter");
            }
        }

        // Check if client exists, if not add them
        if (data.clientName && !clients.find(c => c.name.toLowerCase() === data.clientName?.toLowerCase())) {
            try {
                await addClientMutation.mutateAsync({
                    name: data.clientName,
                    address: data.clientAddress || "",
                    mobile: "",
                    email: ""
                });
            } catch (e) { }
        }

        onSave?.();
    };

    // Auto-calculate freight totals
    const items = watch("items");
    useEffect(() => {
        const totalFreightSum = items?.reduce((sum, item) => sum + (Number(item.totalFreight) || 0), 0) || 0;
        const totalGivenFreightSum = items?.reduce((sum, item) => sum + (Number(item.givenFreight) || 0), 0) || 0;
        const totalRemainingFreightSum = items?.reduce((sum, item) => sum + (Number(item.remainingFreight) || 0), 0) || 0;

        // Also update row-level remaining freight if needed (Total - Given)
        // Assuming logic: Remaining = Total - Given
        items?.forEach((item, index) => {
            const total = Number(item.totalFreight) || 0;
            const given = Number(item.givenFreight) || 0;
            const remaining = total - given;
            if (item.remainingFreight !== remaining) {
                setValue(`items.${index}.remainingFreight`, remaining);
            }
        });

        const netFreight = totalRemainingFreightSum; // Or logic based on requirement

        if (watch("totalFreightSum") !== totalFreightSum) setValue("totalFreightSum", totalFreightSum);

    }, [JSON.stringify(items)]);

    // Auto-calculate remaining freight based on global totals
    const totalFreightSumVal = watch("totalFreightSum");
    const totalGivenFreightSumVal = watch("totalGivenFreightSum");
    const expenseAmountVal = watch("expenseAmount");

    useEffect(() => {
        const remaining = (Number(totalFreightSumVal) || 0) - (Number(totalGivenFreightSumVal) || 0) - (Number(expenseAmountVal) || 0);
        setValue("totalRemainingFreightSum", remaining);
    }, [totalFreightSumVal, totalGivenFreightSumVal, expenseAmountVal, setValue]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight">Delivery Editor</h2>
                <div className="flex gap-2">
                    <Button onClick={onShare} variant="outline" size="sm" className="h-8 border-green-600 text-green-600 hover:bg-green-50">
                        <Share2 className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button onClick={handleInternalSave} variant="default" size="sm" className="bg-green-600 text-white hover:bg-green-700 h-8">
                        <Save className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Save</span>
                    </Button>
                    <Button onClick={onPrint} variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90 h-8">
                        <Printer className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Print</span>
                    </Button>
                </div>
            </div>

            <form className="space-y-4 flex-1 overflow-y-auto pr-2 pb-20">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Mobile Tab Navigation (Dropdown) */}
                    <div className="md:hidden mb-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <span className="capitalize">
                                        {activeTab === 'details' ? 'Challan Details' :
                                            activeTab === 'sender' ? 'Buyers' :
                                                activeTab === 'items' ? 'Items' :
                                                    'Company'}
                                    </span>
                                    <Menu className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <DropdownMenuItem onClick={() => setActiveTab('details')}>Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActiveTab('sender')}>Buyers</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActiveTab('items')}>Items</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActiveTab('company')}>Company</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Desktop Tab Navigation */}
                    <div className="hidden md:block overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                        <TabsList className="grid w-full min-w-[280px] grid-cols-4 h-auto">
                            <TabsTrigger value="details" className="text-xs py-2">Details</TabsTrigger>
                            <TabsTrigger value="sender" className="text-xs py-2">Buyers</TabsTrigger>
                            <TabsTrigger value="items" className="text-xs py-2">Items</TabsTrigger>
                            <TabsTrigger value="company" className="text-xs py-2">Company</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="details" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Challan Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Challan No.</Label>
                                        <Input {...register("challanNo")} className="h-8" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Date</Label>
                                        <Input type="date" {...register("date")} className="h-8" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Transport Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Driver/Transporter Name</Label>
                                        <TransporterAutocomplete
                                            value={watch("driverName") || ""}
                                            onSelect={(transporter, customName) => {
                                                if (transporter) {
                                                    setValue("driverName", transporter.name);
                                                    setValue("driverMobile", transporter.mobile || "");
                                                    setValue("vehicleNo", transporter.vehicleNo || "");
                                                } else if (customName) {
                                                    setValue("driverName", customName);
                                                    // Don't clear other fields, maybe they typed them first or want to keep them
                                                }
                                            }}
                                            className="h-8"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Mobile No.</Label>
                                        <Input {...register("driverMobile")} className="h-8" placeholder="Optional" />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Vehicle No.</Label>
                                    <Input {...register("vehicleNo")} className="h-8" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sender" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Buyers Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3">
                                <div>
                                    <Label className="text-xs">Buyers Name</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <ClientAutocomplete
                                                clients={clients}
                                                value={watch("clientName")}
                                                onChange={(val) => setValue("clientName", val)}
                                                onSelect={handleClientSelect}
                                                onAddNew={handleAddNewClient}
                                                placeholder="Select or type buyer name..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Buyers Address</Label>
                                    <Input {...register("clientAddress")} className="h-8" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="items" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-base">Goods</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => append({
                                        id: Math.random().toString(),
                                        description: "",
                                        bags: 0,
                                        weight: 0,
                                        totalFreight: 0,
                                        givenFreight: 0,
                                        remainingFreight: 0
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

                                        <div>
                                            <Label className="text-[10px] uppercase text-muted-foreground">Description of Goods</Label>
                                            <ProductAutocomplete
                                                products={products}
                                                value={watch(`items.${index}.description`)}
                                                onChange={(val) => setValue(`items.${index}.description`, val)}
                                                onSelect={(product) => {
                                                    setValue(`items.${index}.description`, product.name);
                                                }}
                                                placeholder="Search or type goods..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            <div>
                                                <Label className="text-[10px] uppercase text-muted-foreground">No. of Bags</Label>
                                                <Input type="number" {...register(`items.${index}.bags`, { valueAsNumber: true })} className="h-7 text-xs bg-white" />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase text-muted-foreground">Weight (Kg)</Label>
                                                <Input type="number" {...register(`items.${index}.weight`, { valueAsNumber: true })} className="h-7 text-xs bg-white" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <Label className="text-[10px] uppercase text-muted-foreground">Total Freight</Label>
                                                <Input type="number" {...register(`items.${index}.totalFreight`, { valueAsNumber: true })} className="h-7 text-xs bg-white" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Freight Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                                        <Label className="text-xs font-medium">Hide Freight in Preview</Label>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={watch("hideFreight") || false}
                                                onCheckedChange={(checked) => setValue("hideFreight", checked)}
                                                id="hide-freight"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs items-center">
                                        <div className="font-medium">Total Freight:</div>
                                        <Input
                                            type="number"
                                            {...register("totalFreightSum", { valueAsNumber: true })}
                                            className="h-7 text-right"
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2 border-t">
                                        <div>
                                            <Label className="text-xs">Given Freight</Label>
                                            <Input type="number" {...register("totalGivenFreightSum", { valueAsNumber: true })} className="h-7 text-right" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="col-span-1">
                                                <Label className="text-xs">Expense Reason</Label>
                                                <Input {...register("expenseReason")} className="h-7" placeholder="Reason" />
                                            </div>
                                            <div className="col-span-1">
                                                <Label className="text-xs">Amount</Label>
                                                <Input type="number" {...register("expenseAmount", { valueAsNumber: true })} className="h-7 text-right" placeholder="0.00" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs items-center pt-2 border-t">
                                            <div className="font-medium">Remaining:</div>
                                            <Input
                                                value={watch("totalRemainingFreightSum")?.toFixed(2) || "0.00"}
                                                readOnly
                                                className="h-7 text-right"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-xs">Note</Label>
                                        <Input {...register("notes")} className="h-8" placeholder="Additional notes..." />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="company" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Company Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3">
                                <div>
                                    <Label className="text-xs">Company Name</Label>
                                    <Input {...register("companyName")} className="h-8" />
                                </div>
                                <div>
                                    <Label className="text-xs">Address</Label>
                                    <Input {...register("companyAddress")} className="h-8" />
                                </div>
                                <div>
                                    <Label className="text-xs">GST No</Label>
                                    <Input {...register("companyGst")} className="h-8" />
                                </div>
                                <div>
                                    <Label className="text-xs">Contact No (e.g. Ashish: ... | Dipak: ...)</Label>
                                    <Input {...register("companyContact")} className="h-8" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </div>
    );
}
