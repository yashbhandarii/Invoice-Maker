import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings, useUpdateSettings, useAuditLogs, useUsers } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export function SettingsPage() {
  const { user } = useAuth();
  const { data: settingsData, isLoading: loadingSettings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [companySettings, setCompanySettings] = useState({
    companyName: "",
    address: "",
    gstin: "",
    pan: "",
    bankName: "",
    accountNo: "",
    ifsc: "",
    branch: "",
    invoicePrefix: "",
  });

  useEffect(() => {
    if (settingsData) {
      setCompanySettings({
        companyName: settingsData.companyName || "",
        address: settingsData.address || "",
        gstin: settingsData.gstin || "",
        pan: settingsData.pan || "",
        bankName: settingsData.bankName || "",
        accountNo: settingsData.accountNo || "",
        ifsc: settingsData.ifsc || "",
        branch: settingsData.branch || "",
        invoicePrefix: settingsData.invoicePrefix || "",
      });
    }
  }, [settingsData]);

  const handleSaveSettings = () => {
    updateSettings.mutate(companySettings, {
      onSuccess: () => {
        toast({ title: "Settings Saved", description: "Company profile updated successfully." });
      }
    });
  };

  if (loadingSettings) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Administration</h2>
        <p className="text-sm text-slate-500">Manage company settings, users, and view audit logs.</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          {user?.role === "admin" && <TabsTrigger value="users">User Management</TabsTrigger>}
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>These details will appear on your invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    value={companySettings.companyName} 
                    onChange={e => setCompanySettings({...companySettings, companyName: e.target.value})} 
                    disabled={user?.role !== "admin"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input 
                    value={companySettings.invoicePrefix} 
                    onChange={e => setCompanySettings({...companySettings, invoicePrefix: e.target.value})} 
                    placeholder="e.g. LNB-"
                    disabled={user?.role !== "admin"}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input 
                    value={companySettings.address} 
                    onChange={e => setCompanySettings({...companySettings, address: e.target.value})} 
                    disabled={user?.role !== "admin"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input 
                    value={companySettings.gstin} 
                    onChange={e => setCompanySettings({...companySettings, gstin: e.target.value})} 
                    disabled={user?.role !== "admin"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN</Label>
                  <Input 
                    value={companySettings.pan} 
                    onChange={e => setCompanySettings({...companySettings, pan: e.target.value})} 
                    disabled={user?.role !== "admin"}
                  />
                </div>
              </div>

              <div className="mt-8 border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input 
                      value={companySettings.bankName} 
                      onChange={e => setCompanySettings({...companySettings, bankName: e.target.value})} 
                      disabled={user?.role !== "admin"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account No.</Label>
                    <Input 
                      value={companySettings.accountNo} 
                      onChange={e => setCompanySettings({...companySettings, accountNo: e.target.value})} 
                      disabled={user?.role !== "admin"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input 
                      value={companySettings.ifsc} 
                      onChange={e => setCompanySettings({...companySettings, ifsc: e.target.value})} 
                      disabled={user?.role !== "admin"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input 
                      value={companySettings.branch} 
                      onChange={e => setCompanySettings({...companySettings, branch: e.target.value})} 
                      disabled={user?.role !== "admin"}
                    />
                  </div>
                </div>
              </div>

              {user?.role === "admin" && (
                <Button 
                  className="mt-6" 
                  onClick={handleSaveSettings}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? "Saving..." : "Save Settings"}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        {user?.role === "admin" && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage employees who have access to this system.</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersList />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>History of critical actions performed by users.</CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersList() {
  const { data: users, isLoading } = useUsers();

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground border-b">
            <tr>
              <th className="p-3 font-medium">Username</th>
              <th className="p-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users?.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-3">{u.username}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground italic">
        Note: To register a new employee, ask them to use the registration page while the server is running.
      </p>
    </div>
  );
}

function AuditLogsList() {
  const { data: logs, isLoading } = useAuditLogs();

  if (isLoading) return <div>Loading audit logs...</div>;
  if (!logs || logs.length === 0) return <div className="text-muted-foreground">No audit logs found.</div>;

  return (
    <div className="rounded-md border max-h-[500px] overflow-y-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground border-b sticky top-0">
          <tr>
            <th className="p-3 font-medium">Timestamp</th>
            <th className="p-3 font-medium">User</th>
            <th className="p-3 font-medium">Action</th>
            <th className="p-3 font-medium">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="p-3 whitespace-nowrap">{format(new Date(log.createdAt), "dd MMM, HH:mm")}</td>
              <td className="p-3 font-medium">{log.username}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                  log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {log.action}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
