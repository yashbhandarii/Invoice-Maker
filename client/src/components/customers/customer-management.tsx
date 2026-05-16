
import { useState } from "react";
import { useClients, useAddClient, useDeleteClient, useUpdateClient, useTransporters, useAddTransporter, useUpdateTransporter, useDeleteTransporter, useDeliveryChallans } from "@/lib/api";
import { ClientData, Transporter } from "@/lib/invoice-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Search, History, Users, Truck, Menu, Pencil } from "lucide-react";
import { CustomerHistoryDialog } from "@/components/customers/customer-history-dialog";
import { CustomerLedgerDialog } from "@/components/customers/customer-ledger-dialog";
import { FileText } from "lucide-react";

export function CustomerManagement() {
    const { data: clients = [], isLoading: isClientsLoading } = useClients();
    const addClientMutation = useAddClient();
    const updateClientMutation = useUpdateClient();
    const deleteClientMutation = useDeleteClient();

    const { data: transporters = [], isLoading: isTransportersLoading } = useTransporters();
    const { data: challans = [] } = useDeliveryChallans();
    const addTransporterMutation = useAddTransporter();
    const updateTransporterMutation = useUpdateTransporter();
    const deleteTransporterMutation = useDeleteTransporter();

    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("customers");

    // History State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [ledgerOpen, setLedgerOpen] = useState(false);
    const [selectedCustomerName, setSelectedCustomerName] = useState("");

    // Client Dialog State
    const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<ClientData | null>(null);
    const [clientFormData, setClientFormData] = useState<Partial<ClientData>>({
        name: "", address: "", gst: "", stateCode: "", transport: "", email: "", mobile: ""
    });

    // Transporter Dialog State
    const [isTransporterDialogOpen, setIsTransporterDialogOpen] = useState(false);
    const [editingTransporter, setEditingTransporter] = useState<Transporter | null>(null);
    const [transporterFormData, setTransporterFormData] = useState<Partial<Transporter>>({
        name: "", vehicleNo: "", mobile: ""
    });

    // Client Filters
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.address?.toLowerCase().includes(search.toLowerCase()) ||
        client.gst?.toLowerCase().includes(search.toLowerCase())
    );

    // Transporter Filters
    const filteredTransporters = transporters.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.vehicleNo?.toLowerCase().includes(search.toLowerCase()) ||
        t.mobile?.includes(search)
    );

    // Client Handlers
    const handleEditClient = (client: ClientData) => {
        setEditingClient(client);
        setClientFormData({
            name: client.name,
            address: client.address || "",
            gst: client.gst || "",
            stateCode: client.stateCode || "",
            transport: client.transport || "",
            email: client.email || "",
            mobile: client.mobile || ""
        });
        setIsClientDialogOpen(true);
    };

    const handleDeleteClient = async (id: string) => {
        if (confirm("Are you sure you want to delete this customer?")) {
            try {
                await deleteClientMutation.mutateAsync(id);
                toast({ title: "Deleted", description: "Customer deleted successfully" });
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete customer", variant: "destructive" });
            }
        }
    };

    const handleSaveClient = async () => {
        if (!clientFormData.name) {
            toast({ title: "Error", description: "Name is required", variant: "destructive" });
            return;
        }
        try {
            if (editingClient) {
                await updateClientMutation.mutateAsync({ id: editingClient.id, data: clientFormData });
                toast({ title: "Updated", description: "Customer updated successfully" });
            } else {
                await addClientMutation.mutateAsync(clientFormData as any);
                toast({ title: "Created", description: "Customer created successfully" });
            }
            setIsClientDialogOpen(false);
            setEditingClient(null);
            setClientFormData({ name: "", address: "", gst: "", stateCode: "", transport: "", email: "", mobile: "" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save customer", variant: "destructive" });
        }
    };

    const openNewClientDialog = () => {
        setEditingClient(null);
        setClientFormData({ name: "", address: "", gst: "", stateCode: "", transport: "", email: "", mobile: "" });
        setIsClientDialogOpen(true);
    };

    // Transporter Handlers
    const handleEditTransporter = (transporter: Transporter) => {
        setEditingTransporter(transporter);
        setTransporterFormData({
            name: transporter.name,
            vehicleNo: transporter.vehicleNo || "",
            mobile: transporter.mobile || ""
        });
        setIsTransporterDialogOpen(true);
    };

    const handleDeleteTransporter = async (id: string) => {
        if (confirm("Are you sure you want to delete this transporter?")) {
            try {
                await deleteTransporterMutation.mutateAsync(id);
                toast({ title: "Deleted", description: "Transporter deleted successfully" });
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete transporter", variant: "destructive" });
            }
        }
    };

    const handleSaveTransporter = async () => {
        if (!transporterFormData.name) {
            toast({ title: "Error", description: "Name is required", variant: "destructive" });
            return;
        }
        try {
            if (editingTransporter) {
                await updateTransporterMutation.mutateAsync({ id: editingTransporter.id, data: transporterFormData });
                toast({ title: "Updated", description: "Transporter updated successfully" });
            } else {
                await addTransporterMutation.mutateAsync(transporterFormData as any);
                toast({ title: "Created", description: "Transporter created successfully" });
            }
            setIsTransporterDialogOpen(false);
            setEditingTransporter(null);
            setTransporterFormData({ name: "", vehicleNo: "", mobile: "" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save transporter", variant: "destructive" });
        }
    };

    const openNewTransporterDialog = () => {
        setEditingTransporter(null);
        setTransporterFormData({ name: "", vehicleNo: "", mobile: "" });
        setIsTransporterDialogOpen(true);
    };

    // Helper to find associated challans
    const getAssociatedChallans = (driverName: string) => {
        return challans
            .filter(c => c.driverName?.toLowerCase() === driverName.toLowerCase())
            .map(c => c.challanNo)
            .join(", ");
    };

    return (
        <div className="h-full p-4 md:p-6 flex flex-col gap-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        {activeTab === "customers" ? <Users className="h-8 w-8 text-primary" /> : <Truck className="h-8 w-8 text-primary" />}
                        {activeTab === "customers" ? "Customers" : "Transporters"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {activeTab === "customers" ? "Manage your buyers and their details." : "Manage transporters and view delivery history."}
                    </p>
                </div>
                <Button onClick={activeTab === "customers" ? openNewClientDialog : openNewTransporterDialog} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    {activeTab === "customers" ? "Add Customer" : "Add Transporter"}
                </Button>
            </div>

            {/* Mobile Tab Navigation (Dropdown) */}
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span className="capitalize flex items-center gap-2">
                                {activeTab === "customers" ? <><Users className="h-4 w-4" /> Customers</> : <><Truck className="h-4 w-4" /> Transporters</>}
                            </span>
                            <Menu className="h-4 w-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuItem onClick={() => setActiveTab('customers')}>
                            <Users className="h-4 w-4 mr-2" /> Customers
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('transporters')}>
                            <Truck className="h-4 w-4 mr-2" /> Transporters
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs defaultValue="customers" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="hidden md:grid w-64 grid-cols-2">
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="transporters">Transporters</TabsTrigger>
                </TabsList>

                <TabsContent value="customers" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <CardTitle>Customer List</CardTitle>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search customers..."
                                        className="pl-8"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead>GSTIN</TableHead>
                                            <TableHead>State Code</TableHead>
                                            <TableHead>Mobile</TableHead>
                                            <TableHead>By / Through</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isClientsLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : filteredClients.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No customers found</TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredClients.map((client) => (
                                                <TableRow key={client.id}>
                                                    <TableCell className="font-medium">{client.name}</TableCell>
                                                    <TableCell>{client.address}</TableCell>
                                                    <TableCell>{client.gst}</TableCell>
                                                    <TableCell>{client.stateCode}</TableCell>
                                                    <TableCell>{client.mobile}</TableCell>
                                                    <TableCell>{client.transport}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => {
                                                                    setSelectedCustomerName(client.name);
                                                                    setHistoryOpen(true);
                                                                }}
                                                                title="View History"
                                                            >
                                                                <History className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                                onClick={() => {
                                                                    setSelectedCustomerName(client.name);
                                                                    setLedgerOpen(true);
                                                                }}
                                                                title="View Ledger (Khata)"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-50" onClick={() => handleEditClient(client)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClient(client.id!)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
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

                <TabsContent value="transporters" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <CardTitle>Transporter List</CardTitle>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search transporters..."
                                        className="pl-8"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Driver Name</TableHead>
                                            <TableHead>Vehicle No</TableHead>
                                            <TableHead>Mobile</TableHead>
                                            <TableHead className="w-[30%]">Associated Challans</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isTransportersLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : filteredTransporters.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transporters found</TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredTransporters.map((transporter) => (
                                                <TableRow key={transporter.id}>
                                                    <TableCell className="font-medium">{transporter.name}</TableCell>
                                                    <TableCell>{transporter.vehicleNo}</TableCell>
                                                    <TableCell>{transporter.mobile}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {getAssociatedChallans(transporter.name) || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditTransporter(transporter)}>
                                                            <Pencil className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTransporter(transporter.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-600" />
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

            {/* Client Dialog */}
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingClient ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                        <DialogDescription>
                            Enter the details of the customer here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={clientFormData.name} onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Address</Label>
                            <Input id="address" value={clientFormData.address} onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="mobile" className="text-right">Mobile</Label>
                            <Input id="mobile" value={clientFormData.mobile} onChange={(e) => setClientFormData({ ...clientFormData, mobile: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" type="email" value={clientFormData.email} onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="gst" className="text-right">GSTIN</Label>
                            <Input id="gst" value={clientFormData.gst} onChange={(e) => setClientFormData({ ...clientFormData, gst: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stateCode" className="text-right">State Code</Label>
                            <Input id="stateCode" value={clientFormData.stateCode} onChange={(e) => setClientFormData({ ...clientFormData, stateCode: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="transport" className="text-right">By / Through</Label>
                            <Input id="transport" value={clientFormData.transport} onChange={(e) => setClientFormData({ ...clientFormData, transport: e.target.value })} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveClient}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transporter Dialog */}
            <Dialog open={isTransporterDialogOpen} onOpenChange={setIsTransporterDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTransporter ? "Edit Transporter" : "Add New Transporter"}</DialogTitle>
                        <DialogDescription>
                            Enter details for the transporter.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="t-name" className="text-right">Driver Name</Label>
                            <Input id="t-name" value={transporterFormData.name} onChange={(e) => setTransporterFormData({ ...transporterFormData, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="t-vehicle" className="text-right">Vehicle No</Label>
                            <Input id="t-vehicle" value={transporterFormData.vehicleNo || ""} onChange={(e) => setTransporterFormData({ ...transporterFormData, vehicleNo: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="t-mobile" className="text-right">Mobile</Label>
                            <Input id="t-mobile" value={transporterFormData.mobile || ""} onChange={(e) => setTransporterFormData({ ...transporterFormData, mobile: e.target.value })} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTransporterDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTransporter}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CustomerHistoryDialog
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                customerName={selectedCustomerName}
            />

            <CustomerLedgerDialog
                open={ledgerOpen}
                onOpenChange={setLedgerOpen}
                customerName={selectedCustomerName}
            />
        </div>
    );
}
