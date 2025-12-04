import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, CreditCard, Calendar, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import reportImage from "@assets/generated_images/professional_invoice_dashboard_report_with_charts_and_table.png";

export function InvoiceDashboard() {
  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Overview of your invoicing status</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">Export Report</Button>
           <Button className="bg-primary text-white">New Invoice</Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">₹ 12,45,000</h3>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> +12% from last month
                </p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Outstanding</p>
                <h3 className="text-2xl font-bold mt-1">₹ 3,20,450</h3>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" /> 5 invoices pending
                </p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Paid Invoices</p>
                <h3 className="text-2xl font-bold mt-1">142</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Last 30 days
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Image Placeholder */}
        <Card className="shadow-sm">
          <CardHeader>
             <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="aspect-video w-full bg-slate-100 rounded-md overflow-hidden border relative group">
                <img 
                  src={reportImage} 
                  alt="Revenue Report Chart" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors pointer-events-none" />
             </div>
          </CardContent>
        </Card>

        {/* Recent Invoices List */}
        <Card className="shadow-sm">
          <CardHeader>
             <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {[
                { id: "INV-2024-001", client: "Acme Corp", amount: "₹ 45,000", date: "04 Dec 2024", status: "Paid" },
                { id: "INV-2024-002", client: "Globex Inc", amount: "₹ 12,500", date: "03 Dec 2024", status: "Pending" },
                { id: "INV-2024-003", client: "Soylent Corp", amount: "₹ 8,200", date: "01 Dec 2024", status: "Overdue" },
                { id: "INV-2024-004", client: "Umbrella Corp", amount: "₹ 1,20,000", date: "28 Nov 2024", status: "Paid" },
                { id: "INV-2024-005", client: "Stark Ind", amount: "₹ 65,400", date: "25 Nov 2024", status: "Pending" },
              ].map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded text-primary">
                         <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{inv.client}</p>
                        <p className="text-xs text-slate-500">{inv.id} • {inv.date}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-sm">{inv.amount}</p>
                      <Badge variant={inv.status === "Paid" ? "default" : inv.status === "Pending" ? "secondary" : "destructive"} className={`text-[10px] h-5 px-2 ${inv.status === "Paid" ? "bg-green-500 hover:bg-green-600" : inv.status === "Pending" ? "bg-orange-400 hover:bg-orange-500 text-white" : ""}`}>
                        {inv.status}
                      </Badge>
                   </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
