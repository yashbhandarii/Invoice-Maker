import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InventoryManagement() {
    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-slate-50 min-h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
                    <p className="text-slate-500">Track your inventory stock</p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Coming soon...</p>
                </CardContent>
            </Card>
        </div>
    );
}
