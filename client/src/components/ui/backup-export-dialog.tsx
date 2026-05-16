import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Database, FileJson, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export function BackupExportDialog() {
    const { toast } = useToast();

    const handleDatabaseBackup = () => {
        window.open("/api/backup/database", "_blank");
        toast({
            title: "Backup Started",
            description: "Your database backup is downloading...",
        });
    };

    const handleJsonExport = () => {
        window.open("/api/export/json", "_blank");
        toast({
            title: "Export Started",
            description: "Your data is being exported as JSON...",
        });
    };

    const handleInvoicesCsvExport = () => {
        window.open("/api/export/csv/invoices", "_blank");
        toast({
            title: "Export Started",
            description: "Invoices are being exported as CSV...",
        });
    };

    const handleChallansCsvExport = () => {
        window.open("/api/export/csv/challans", "_blank");
        toast({
            title: "Export Started",
            description: "Delivery challans are being exported as CSV...",
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Backup & Export
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Backup & Export Data</DialogTitle>
                    <DialogDescription>
                        Download your data for backup or migration purposes
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Database Backup */}
                    <Card className="border-2 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg h-fit">
                                        <Database className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm">Full Database Backup</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Complete SQLite database file with all data
                                        </p>
                                        <p className="text-xs text-slate-600 mt-2">
                                            ✓ Recommended for complete backup
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleDatabaseBackup}
                                    className="ml-2"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* JSON Export */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="bg-blue-100 p-2 rounded-lg h-fit">
                                        <FileJson className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm">JSON Export</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            All data in JSON format (invoices, challans, clients, etc.)
                                        </p>
                                        <p className="text-xs text-slate-600 mt-2">
                                            ✓ Good for data migration
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleJsonExport}
                                    className="ml-2"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CSV Exports */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm">CSV Exports</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Export data as spreadsheet files
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 pl-11">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleInvoicesCsvExport}
                                        className="flex-1"
                                    >
                                        Invoices CSV
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleChallansCsvExport}
                                        className="flex-1"
                                    >
                                        Challans CSV
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-slate-50 p-3 rounded-md">
                        <p className="text-xs text-slate-600">
                            <strong>💡 Tip:</strong> Regular backups protect your data. We recommend backing up weekly or after major changes.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
