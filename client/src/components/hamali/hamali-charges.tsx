import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Trash2, Plus, Save, FileText, Settings, Calculator, History, Printer, Menu, Edit, ChevronDown, ChevronRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useReactToPrint } from "react-to-print";
import {
    useHamaliCategories,
    useAddHamaliCategory,
    useUpdateHamaliCategory,
    useDeleteHamaliCategory,
    useHamaliRecords,
    useAddHamaliRecord,
    useUpdateHamaliRecord,
    useDeleteHamaliRecord
} from "@/lib/api";
import { HamaliCategory, HamaliRecordItem } from "@/lib/invoice-types";

// Default categories as per requirement
const DEFAULT_CATEGORIES = [
    { name: "शेतकरी भुसार आवक", rate: 11.88 },
    { name: "व्यापारी भुसार आवक", rate: 2.66112 },
    { name: "शेतकरी वाराई", rate: 1.5 },
    { name: "पाला फोडणे व काटा करून शिवणे व थप्पी लावणे", rate: 10.51776 },
    { name: "पाला फोडणे, टप करणे व काटा कस्न थप्पी लावणे", rate: 14.41 },
    { name: "मोटार भराई, उत्तराई किंवा थप्पी लावणे पूर्ण गोडाऊनमध्ये कोठेही", rate: 2.5344 },
    { name: "गठ लावणे किंवा थप्पी लावणे पूर्ण गोडाऊनमध्ये कोठेही", rate: 2.5344 },
    { name: "स्टेज काटा करून शिवणे व थप्पी लावणे पूर्ण (प्रति नग)", rate: 5.54 },
    { name: "रोकड विक्री काटा करून", rate: 10.29 },
    { name: "रोकड विक्री काटा न करता", rate: 4.8 },
    { name: "मालाची फिरवाई", rate: 2.66 },
    { name: "वाहतूक पूर्ण गोडाऊन करिता", rate: 2.66 },
    { name: "पाला फोडणे, तोडणे, टप करणे व थप्पी लावणे.", rate: 16.15 },
    { name: "पाला फोडणे, तोडणे, काटा करणे व थप्पी लावणे.", rate: 12.14 },
    { name: "मोठी गोणी", rate: 10 },
    { name: "साखर गोणी", rate: 6 },
    { name: "वाराई", rate: 1 },
];

interface HamaliEntry {
    id: string;
    categoryId: string;
    bags: number;
    comment: string;
}

export function HamaliCharges() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("calculator");
    const printRef = useRef<HTMLDivElement>(null);
    const [pdfData, setPdfData] = useState<any>(null);

    // API Hooks
    const { data: categories = [], isLoading: isLoadingCategories } = useHamaliCategories();
    const { data: records = [], isLoading: isLoadingRecords } = useHamaliRecords();

    const addCategoryMutation = useAddHamaliCategory();
    const updateCategoryMutation = useUpdateHamaliCategory();
    const deleteCategoryMutation = useDeleteHamaliCategory();
    const addRecordMutation = useAddHamaliRecord();
    const updateRecordMutation = useUpdateHamaliRecord();
    const deleteRecordMutation = useDeleteHamaliRecord();

    // Calculator state
    const [entries, setEntries] = useState<HamaliEntry[]>([]);
    const [expenses, setExpenses] = useState<{ id: string, name: string, amount: number }[]>([]);
    const [expenseName, setExpenseName] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [comment, setComment] = useState("");
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

    // History state
    const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

    // Settings state
    const [newCatName, setNewCatName] = useState("");
    const [newCatRate, setNewCatRate] = useState("");
    const [editingCatId, setEditingCatId] = useState<string | null>(null);

    // Initialize entries when categories load (if not editing a record)
    useEffect(() => {
        if (categories.length > 0 && !editingRecordId && entries.length === 0) {
            setEntries(categories.map(cat => ({
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
                categoryId: cat.id,
                bags: 0,
                comment: ""
            })));
        }
    }, [categories, editingRecordId]);

    const handleSeedDefaults = async () => {
        try {
            for (const cat of DEFAULT_CATEGORIES) {
                await addCategoryMutation.mutateAsync({ name: cat.name, rate: cat.rate, isDefault: true });
            }
            toast({ title: "Defaults Loaded", description: "Default categories have been added." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to load defaults", variant: "destructive" });
        }
    };

    // Calculator Logic
    const calculateGrossTotal = () => {
        let total = 0;
        entries.forEach(entry => {
            const cat = categories.find(c => c.id === entry.categoryId);
            if (cat) total += entry.bags * cat.rate;
        });
        return total;
    };

    const calculateExpensesTotal = () => {
        return expenses.reduce((acc, curr) => acc + curr.amount, 0);
    };

    const calculateNetTotal = () => {
        return calculateGrossTotal() - calculateExpensesTotal();
    };

    const handleEntryChange = (id: string, field: "bags" | "comment", val: string) => {
        setEntries(prev => prev.map(entry => {
            if (entry.id === id) {
                return { ...entry, [field]: field === "bags" ? (parseInt(val) || 0) : val };
            }
            return entry;
        }));
    };

    const handleAddDuplicateEntry = (categoryId: string) => {
        setEntries(prev => {
            const lastIndex = prev.findLastIndex(e => e.categoryId === categoryId);
            const newEntry = {
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
                categoryId,
                bags: 0,
                comment: ""
            };
            const next = [...prev];
            next.splice(lastIndex !== -1 ? lastIndex + 1 : next.length, 0, newEntry);
            return next;
        });
    };

    const handleRemoveEntry = (id: string) => {
        setEntries(prev => prev.filter(e => e.id !== id));
    };

    const handleAddExpense = () => {
        if (!expenseName || !expenseAmount) return;
        const amount = parseFloat(expenseAmount);
        if (isNaN(amount) || amount <= 0) return;

        setExpenses(prev => [...prev, {
            id: Date.now().toString(),
            name: expenseName,
            amount: amount
        }]);
        setExpenseName("");
        setExpenseAmount("");
    };

    const handleRemoveExpense = (id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const handleSaveRecord = async () => {
        const total = calculateNetTotal();
        const gross = calculateGrossTotal();

        if (gross === 0 && expenses.length === 0) {
            toast({ title: "Empty Record", description: "Please enter bags or expenses.", variant: "destructive" });
            return;
        }

        const items: HamaliRecordItem[] = entries
            .filter(e => e.bags > 0)
            .map(e => {
                const cat = categories.find(c => c.id === e.categoryId);
                return {
                    categoryId: cat!.id,
                    categoryName: cat!.name,
                    rate: cat!.rate,
                    bags: e.bags,
                    total: e.bags * cat!.rate,
                    comment: e.comment
                };
            });

        // Append expenses as negative items
        expenses.forEach(exp => {
            items.push({
                categoryId: "EXPENSE",
                categoryName: `Expense: ${exp.name}`,
                rate: -exp.amount,
                bags: 1,
                total: -exp.amount,
                comment: ""
            });
        });

        try {
            if (editingRecordId) {
                await updateRecordMutation.mutateAsync({
                    id: editingRecordId,
                    data: {
                        totalAmount: total,
                        items,
                        comment
                    }
                });
                toast({ title: "Updated", description: "Record updated successfully." });
                setEditingRecordId(null);
            } else {
                await addRecordMutation.mutateAsync({
                    date: new Date().toISOString(),
                    totalAmount: total,
                    items,
                    comment
                });
                toast({ title: "Saved", description: "Daily record saved successfully." });
            }
            
            // Reset to empty one-per-category
            setEntries(categories.map(cat => ({
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
                categoryId: cat.id,
                bags: 0,
                comment: ""
            })));
            setExpenses([]);
            setComment("");
        } catch (error) {
            toast({ title: "Error", description: "Failed to save record", variant: "destructive" });
        }
    };

    const cancelEdit = () => {
        setEditingRecordId(null);
        setEntries(categories.map(cat => ({
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
            categoryId: cat.id,
            bags: 0,
            comment: ""
        })));
        setExpenses([]);
        setComment("");
        toast({ description: "Editing cancelled." });
    };

    const handleEditRecord = (record: any) => {
        setActiveTab("calculator");
        setEditingRecordId(record.id);
        setComment(record.comment || "");

        const newEntries: HamaliEntry[] = [];
        const newExpenses: { id: string, name: string, amount: number }[] = [];

        record.items.forEach((item: any) => {
            if (item.categoryId === "EXPENSE") {
                newExpenses.push({
                    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
                    name: item.categoryName.replace("Expense: ", ""),
                    amount: Math.abs(item.rate)
                });
            } else {
                newEntries.push({
                    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
                    categoryId: item.categoryId,
                    bags: item.bags,
                    comment: item.comment || ""
                });
            }
        });

        // Add missing categories so they still appear in the editor
        categories.forEach(cat => {
            if (!newEntries.some(e => e.categoryId === cat.id)) {
                newEntries.push({
                    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random(),
                    categoryId: cat.id,
                    bags: 0,
                    comment: ""
                });
            }
        });

        // Re-sort by original category order
        const sortedEntries: HamaliEntry[] = [];
        categories.forEach(cat => {
            const catEntries = newEntries.filter(e => e.categoryId === cat.id);
            sortedEntries.push(...catEntries);
        });

        setEntries(sortedEntries);
        setExpenses(newExpenses);
    };

    // Helper to get report data
    const getReportData = (record?: any) => {
        let itemsToPrint = [];
        let totalAmount = 0;
        let dateObj = new Date();

        if (record) {
            itemsToPrint = record.items;
            totalAmount = record.totalAmount;
            dateObj = new Date(record.date);
        } else {
            const regularItems = entries
                .filter(e => e.bags > 0)
                .map(e => {
                    const cat = categories.find(c => c.id === e.categoryId);
                    return {
                        categoryName: cat?.name || "",
                        rate: cat?.rate || 0,
                        bags: e.bags,
                        total: e.bags * (cat?.rate || 0),
                        comment: e.comment
                    };
                });

            const expenseItems = expenses.map(exp => ({
                categoryName: `Expense: ${exp.name}`,
                rate: -exp.amount,
                bags: 1,
                total: -exp.amount,
                comment: ""
            }));

            itemsToPrint = [...regularItems, ...expenseItems];
            totalAmount = calculateNetTotal();
            dateObj = new Date();
        }

        if (itemsToPrint.length === 0) return null;

        const activeCats = itemsToPrint.filter((i: any) => i.rate > 0).length;
        const totalBags = itemsToPrint.reduce((acc: number, item: any) => item.rate > 0 ? acc + (item.bags || 0) : acc, 0);

        return {
            items: itemsToPrint,
            totalAmount,
            dateObj,
            activeCategories: activeCats,
            totalBags,
            comment: record ? record.comment : comment
        };
    };

    const handlePrintProcess = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Hamali-Report-${format(new Date(), 'dd-MM-yyyy')}`,
        onAfterPrint: () => setPdfData(null),
    });

    const triggerPrint = (record?: any) => {
        const data = getReportData(record);
        if (!data) {
            toast({ title: "Empty", description: "Nothing to print.", variant: "destructive" });
            return;
        }
        setPdfData(data);
        setTimeout(() => handlePrintProcess(), 500);
    };

    const generatePDF = async (record?: any) => {
        const data = getReportData(record);
        if (!data) {
            toast({ title: "Empty", description: "Nothing to print.", variant: "destructive" });
            return;
        }
        setPdfData(data);

        setTimeout(async () => {
            if (!printRef.current) {
                toast({ title: "Error", description: "PDF generation failed: Rendering element not found.", variant: "destructive" });
                setPdfData(null);
                return;
            }
            try {
                const elementHeight = printRef.current.scrollHeight;
                const elementWidth = printRef.current.scrollWidth;
                const canvas = await html2canvas(printRef.current, {
                    scale: 2,
                    backgroundColor: "#ffffff",
                    useCORS: true,
                    width: elementWidth,
                    height: elementHeight,
                    windowHeight: elementHeight,
                    windowWidth: elementWidth
                });

                const imgData = canvas.toDataURL('image/png');
                const pdfe = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdfe.internal.pageSize.getWidth();
                const pdfHeight = pdfe.internal.pageSize.getHeight();
                const imgWidth = pdfWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let heightLeft = imgHeight;
                let position = 0;

                pdfe.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position -= pdfHeight;
                    pdfe.addPage();
                    pdfe.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pdfHeight;
                }

                const dateStr = format(data.dateObj, 'dd-MM-yyyy_HH-mm');
                pdfe.save(`Hamali_Report_${dateStr}.pdf`);
                setPdfData(null);
            } catch (err: any) {
                toast({ title: "PDF Error", description: `Failed: ${err.message || 'Unknown error'}`, variant: "destructive" });
                setPdfData(null);
            }
        }, 1000);
    };

    // Settings Handlers
    const handleAddCategory = () => {
        if (!newCatName || !newCatRate) return;
        addCategoryMutation.mutate({ name: newCatName, rate: parseFloat(newCatRate), isDefault: false }, {
            onSuccess: () => {
                setNewCatName("");
                setNewCatRate("");
                toast({ title: "Category Added" });
            }
        });
    };

    const handleDeleteCategory = (id: string) => {
        deleteCategoryMutation.mutate(id);
    };

    const handleEditRate = (cat: HamaliCategory, newRate: string) => {
        updateCategoryMutation.mutate({ id: cat.id, data: { rate: parseFloat(newRate) } });
        setEditingCatId(null);
    };

    const handleDeleteRecord = (id: string) => {
        if (confirm("Are you sure you want to delete this record?")) {
            deleteRecordMutation.mutate(id);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-full relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Hamali Charges</h2>
                    <p className="text-slate-500">Calculate and manage labor charges</p>
                </div>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="md:hidden mb-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span className="capitalize flex items-center gap-2">
                                {activeTab === 'calculator' ? <><Calculator className="h-4 w-4" /> Calculator</> :
                                    activeTab === 'history' ? <><History className="h-4 w-4" /> History</> :
                                        <><Settings className="h-4 w-4" /> Settings</>}
                            </span>
                            <Menu className="h-4 w-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuItem onClick={() => setActiveTab('calculator')}>
                            <Calculator className="h-4 w-4 mr-2" /> Calculator
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('history')}>
                            <History className="h-4 w-4 mr-2" /> History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                            <Settings className="h-4 w-4 mr-2" /> Settings
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="hidden md:block overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    <TabsList className="grid w-full min-w-[320px] grid-cols-3 max-w-md mx-auto mb-6">
                        <TabsTrigger value="calculator" className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" /> Calculator
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" /> History
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* CALCULATOR TAB */}
                <TabsContent value="calculator">
                    {editingRecordId && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-amber-800">Editing Record</h4>
                                <p className="text-sm text-amber-700">You are currently editing an existing record. Save to update.</p>
                            </div>
                            <Button variant="ghost" className="text-amber-700 hover:text-amber-900 hover:bg-amber-100" onClick={cancelEdit}>
                                Cancel Edit
                            </Button>
                        </div>
                    )}
                    <Card className="border-0 shadow-none">
                        <CardContent className="p-0">
                            {categories.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">No categories defined.</p>
                                    <Button onClick={handleSeedDefaults}>Load Default Categories</Button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Inputs Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                                        {entries.map((entry, index) => {
                                            const cat = categories.find(c => c.id === entry.categoryId);
                                            if (!cat) return null;
                                            
                                            // Determine if this is a duplicate entry (not the first one for this category)
                                            const firstIndexOfCat = entries.findIndex(e => e.categoryId === cat.id);
                                            const isDuplicate = index !== firstIndexOfCat;

                                            return (
                                                <div key={entry.id} className="space-y-2 relative border p-3 rounded-lg bg-white shadow-sm group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <Label className="text-sm font-medium text-slate-700">
                                                            {cat.name}
                                                        </Label>
                                                        <div className="flex gap-1">
                                                            {!isDuplicate && (
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    className="h-6 w-6 text-slate-400 hover:text-primary" 
                                                                    onClick={() => handleAddDuplicateEntry(cat.id)}
                                                                    title="Add another row for this category"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {isDuplicate && (
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    className="h-6 w-6 text-slate-400 hover:text-red-500" 
                                                                    onClick={() => handleRemoveEntry(entry.id)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="Bags"
                                                            value={entry.bags || ""}
                                                            onChange={(e) => handleEntryChange(entry.id, "bags", e.target.value)}
                                                            className="flex-1 w-24"
                                                        />
                                                        <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[5rem]">
                                                            @ ₹{cat.rate}
                                                        </span>
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        placeholder="Comment (optional)"
                                                        value={entry.comment}
                                                        onChange={(e) => handleEntryChange(entry.id, "comment", e.target.value)}
                                                        className="h-8 text-sm mt-2"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Results Table */}
                                    <div className="pt-6">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide">Calculation Results</h3>
                                        <div className="rounded-md border overflow-x-auto bg-white">
                                            <Table>
                                                <TableHeader className="bg-slate-100">
                                                    <TableRow>
                                                        <TableHead className="font-bold text-slate-700">Category</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-700">Bags</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-700">Rate/Bag</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-700">Total</TableHead>
                                                        <TableHead className="font-bold text-slate-700">Comment</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {entries.filter(e => e.bags > 0).length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                                Enter bags above to see results
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        entries.filter(e => e.bags > 0).map(entry => {
                                                            const cat = categories.find(c => c.id === entry.categoryId);
                                                            if (!cat) return null;
                                                            const total = entry.bags * cat.rate;
                                                            return (
                                                                <TableRow key={entry.id}>
                                                                    <TableCell className="font-medium text-slate-700">{cat.name}</TableCell>
                                                                    <TableCell className="text-right">{entry.bags}</TableCell>
                                                                    <TableCell className="text-right">₹{cat.rate.toFixed(4)}</TableCell>
                                                                    <TableCell className="text-right font-bold text-slate-900">₹{total.toFixed(2)}</TableCell>
                                                                    <TableCell className="text-slate-500 text-sm max-w-[150px] truncate">{entry.comment}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Expenses Section */}
                                    <div className="pt-6 border-t">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide">Less: Expenses</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4">
                                            <div className="md:col-span-6">
                                                <Label>Expense Name</Label>
                                                <Input
                                                    value={expenseName}
                                                    onChange={(e) => setExpenseName(e.target.value)}
                                                    placeholder="e.g. Tea, Labour Advance"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <Label>Amount</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={expenseAmount}
                                                    onChange={(e) => setExpenseAmount(e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <Button onClick={handleAddExpense} variant="secondary" className="w-full">
                                                    <Plus className="h-4 w-4 mr-2" /> Add Expense
                                                </Button>
                                            </div>
                                        </div>

                                        {expenses.length > 0 && (
                                            <div className="rounded-md border bg-red-50 mb-6">
                                                <Table>
                                                    <TableBody>
                                                        {expenses.map((exp) => (
                                                            <TableRow key={exp.id}>
                                                                <TableCell className="font-medium text-red-700">{exp.name}</TableCell>
                                                                <TableCell className="text-right text-red-700">- ₹{exp.amount.toFixed(2)}</TableCell>
                                                                <TableCell className="text-right w-[50px]">
                                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveExpense(exp.id)}>
                                                                        <Trash2 className="h-3 w-3 text-red-500" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Comment Section */}
                                    <div className="pt-4 pb-2">
                                        <Label htmlFor="comment">General Comment / Note</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Textarea
                                                id="comment"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Enter comments here (will appear on PDF)..."
                                                className="flex-1 min-h-[80px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t-2 border-slate-100 gap-4">
                                        <div className="flex flex-col gap-1 w-full md:w-auto">
                                            <div className="text-sm text-slate-500">Gross Total: ₹{calculateGrossTotal().toFixed(2)}</div>
                                            {expenses.length > 0 && (
                                                <div className="text-sm text-red-500">Less Expenses: -₹{calculateExpensesTotal().toFixed(2)}</div>
                                            )}
                                            <div className="text-2xl font-bold text-primary">
                                                Net Payable: ₹{calculateNetTotal().toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                            <Button variant="outline" onClick={() => triggerPrint()} className="w-full md:w-auto">
                                                <Printer className="h-4 w-4 mr-2" /> Print
                                            </Button>
                                            <Button variant="outline" onClick={() => generatePDF()} disabled={calculateNetTotal() === 0} className="w-full md:w-auto">
                                                <FileText className="h-4 w-4 mr-2" /> Export PDF
                                            </Button>
                                            <Button onClick={handleSaveRecord} className="bg-primary hover:bg-primary/90 w-full md:w-auto" disabled={calculateNetTotal() === 0}>
                                                <Save className="h-4 w-4 mr-2" /> {editingRecordId ? "Update Record" : "Save Record"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Calculation History</h3>
                                <p className="text-sm text-slate-500">View and manage your saved daily calculations</p>
                            </div>
                        </div>

                        {records.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl border-slate-200">
                                <p className="text-muted-foreground">No history available.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {records.map((rec) => {
                                    const isExpanded = expandedRecordId === rec.id;
                                    const recordDate = new Date(rec.createdAt);
                                    const isEditable = (Date.now() - recordDate.getTime()) < 2 * 60 * 60 * 1000; // 2 hours
                                    
                                    const activeCats = rec.items.filter((i: any) => i.rate > 0).length;
                                    const totalBags = rec.items.reduce((acc: number, item: any) => item.rate > 0 ? acc + (item.bags || 0) : acc, 0);

                                    return (
                                        <Card key={rec.id} className="border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div 
                                                className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100"
                                                onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-500" /> : <ChevronRight className="h-5 w-5 text-slate-500" />}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">{format(new Date(rec.date), 'M/d/yyyy')}</span>
                                                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-xs font-medium text-slate-700 border border-slate-300">
                                                                {format(new Date(rec.date), 'hh:mm a')}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-slate-500 mt-1">
                                                            {activeCats} categories • {totalBags} total bags
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="font-bold text-lg text-slate-900">
                                                        ₹{rec.totalAmount.toFixed(2)}
                                                    </div>
                                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                        {isEditable && (
                                                            <Button size="icon" variant="outline" className="h-8 w-8 text-slate-600 hover:text-primary" onClick={() => handleEditRecord(rec)} title="Edit Record (Available for 2 hours)">
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        <Button size="icon" variant="outline" className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:border-slate-300" onClick={() => triggerPrint(rec)} title="Print Record">
                                                            <Printer className="h-3 w-3" />
                                                        </Button>
                                                        <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:border-blue-200" onClick={() => generatePDF(rec)} title="Export PDF">
                                                            <FileText className="h-3 w-3" />
                                                        </Button>
                                                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleDeleteRecord(rec.id)} title="Delete Record">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-slate-200 bg-white p-4">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="font-bold text-slate-900">Category</TableHead>
                                                                <TableHead className="font-bold text-slate-900 text-center">Bags</TableHead>
                                                                <TableHead className="font-bold text-slate-900 text-center">Rate/Bag</TableHead>
                                                                <TableHead className="font-bold text-slate-900 text-center">Total</TableHead>
                                                                <TableHead className="font-bold text-slate-900">Comment</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {rec.items.map((item: any, idx: number) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell className={`font-medium ${item.rate < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                                                        {item.categoryName}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">{item.bags}</TableCell>
                                                                    <TableCell className="text-center">₹{Math.abs(item.rate).toFixed(2)}</TableCell>
                                                                    <TableCell className={`text-center font-bold ${item.rate < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                                                        {item.rate < 0 ? '-' : ''}₹{Math.abs(item.total).toFixed(2)}
                                                                    </TableCell>
                                                                    <TableCell className="text-slate-500 text-sm">{item.comment || "—"}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                    <div className="flex justify-end p-4 border-t border-slate-200">
                                                        <div className="text-right">
                                                            <span className="text-slate-500 font-medium uppercase text-sm mr-4">Grand Total:</span>
                                                            <span className="text-xl font-bold text-slate-900">₹{rec.totalAmount.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    {rec.comment && (
                                                        <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
                                                            <span className="font-bold text-xs uppercase text-slate-500 mb-1 block">General Note</span>
                                                            <p className="text-sm text-slate-700">{rec.comment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Categories</CardTitle>
                            <CardDescription>Add, edit or delete Hamali categories.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-6">
                                <Input
                                    placeholder="Category Name"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Rate"
                                    type="number"
                                    value={newCatRate}
                                    onChange={(e) => setNewCatRate(e.target.value)}
                                    className="w-24"
                                />
                                <Button onClick={handleAddCategory}>Add</Button>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Rate (₹)</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((cat) => (
                                            <TableRow key={cat.id}>
                                                <TableCell>{cat.name}</TableCell>
                                                <TableCell>
                                                    {editingCatId === cat.id ? (
                                                        <Input
                                                            type="number"
                                                            defaultValue={cat.rate}
                                                            className="w-20 h-8"
                                                            onBlur={(e) => handleEditRate(cat, e.target.value)}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span
                                                            className="cursor-pointer hover:underline"
                                                            onClick={() => setEditingCatId(cat.id)}
                                                        >
                                                            {cat.rate}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Hidden Printable Area */}
            {pdfData && (
                <div
                    ref={printRef}
                    className="absolute top-0 left-0 z-[9999]"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '10mm',
                        backgroundColor: '#ffffff',
                        color: '#0f172a'
                    }}
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold uppercase" style={{ color: '#1e293b' }}>Labor Charges Report</h1>
                        <p className="mt-1" style={{ color: '#64748b' }}>Daily Calculation Summary</p>
                        <div className="w-full h-px mt-4" style={{ backgroundColor: '#000000' }}></div>
                    </div>

                    {/* Summary Box */}
                    <div
                        className="rounded-xl border-2 p-6 mb-8 flex justify-between items-center text-center"
                        style={{
                            backgroundColor: '#ffffff',
                            borderColor: '#0f172a',
                            color: '#0f172a'
                        }}
                    >
                        <div>
                            <p className="text-xs font-bold uppercase" style={{ color: '#0f172a' }}>Date</p>
                            <p className="text-lg font-medium" style={{ color: '#0f172a' }}>{format(pdfData.dateObj, 'EEEE, MMM dd, yyyy')}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase" style={{ color: '#0f172a' }}>Time</p>
                            <p className="text-lg font-medium" style={{ color: '#0f172a' }}>{format(pdfData.dateObj, 'hh:mm a')}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase" style={{ color: '#0f172a' }}>Categories</p>
                            <p className="text-lg font-medium" style={{ color: '#0f172a' }}>{pdfData.activeCategories}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase" style={{ color: '#0f172a' }}>Total Bags</p>
                            <p className="text-lg font-medium" style={{ color: '#0f172a' }}>{pdfData.totalBags}</p>
                        </div>
                    </div>

                    {/* Comment in PDF */}
                    {pdfData.comment && (
                        <div className="mb-8 p-4 rounded-lg border-2" style={{ borderColor: '#0f172a', backgroundColor: '#ffffff' }}>
                            <p className="text-xs font-bold uppercase mb-1" style={{ color: '#0f172a' }}>COMMENTS</p>
                            <p className="text-sm" style={{ color: '#0f172a' }}>{pdfData.comment}</p>
                        </div>
                    )}

                    {/* Table */}
                    <div className="mb-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2" style={{ borderColor: '#0f172a' }}>
                                    <th className="text-left font-bold py-3 uppercase text-xs" style={{ color: '#64748b' }}>Category</th>
                                    <th className="text-center font-bold py-3 uppercase text-xs" style={{ color: '#64748b' }}>Bags</th>
                                    <th className="text-right font-bold py-3 uppercase text-xs" style={{ color: '#64748b' }}>Rate per Bag</th>
                                    <th className="text-right font-bold py-3 uppercase text-xs" style={{ color: '#64748b' }}>Total Charge</th>
                                    <th className="text-left font-bold py-3 uppercase text-xs pl-4" style={{ color: '#64748b' }}>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pdfData.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                                        <td className="py-4 font-medium" style={{ color: '#1e293b' }}>{item.categoryName}</td>
                                        <td className="py-4 text-center" style={{ color: '#475569' }}>{item.bags}</td>
                                        <td className="py-4 text-right" style={{ color: '#475569' }}>₹{Math.abs(item.rate).toFixed(4)}</td>
                                        <td className="py-4 text-right font-bold" style={{ color: '#1e293b' }}>₹{item.total.toFixed(2)}</td>
                                        <td className="py-4 text-left pl-4 text-xs" style={{ color: '#475569' }}>{item.comment}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2" style={{ borderColor: '#1e293b' }}>
                                    <td colSpan={2}></td>
                                    <td className="py-4 text-right font-bold text-lg uppercase" style={{ color: '#0f172a' }}>Grand Total:</td>
                                    <td className="py-4 text-right font-bold text-lg" style={{ color: '#0f172a' }}>₹{pdfData.totalAmount.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
