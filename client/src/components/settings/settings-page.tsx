import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings, useAuditLogs } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useBackups, useCreateBackup, useMigrateToCloud } from "@/lib/api";
import { Download, Database, Cloud, HardDrive, RefreshCw } from "lucide-react";

export function SettingsPage() {
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
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="backups" className="gap-2"><HardDrive className="w-4 h-4" /> Data & Backups</TabsTrigger>
          <TabsTrigger value="cloud" className="gap-2"><Cloud className="w-4 h-4" /> Cloud Migration</TabsTrigger>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input 
                    value={companySettings.invoicePrefix} 
                    onChange={e => setCompanySettings({...companySettings, invoicePrefix: e.target.value})} 
                    placeholder="e.g. LNB-"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input 
                    value={companySettings.address} 
                    onChange={e => setCompanySettings({...companySettings, address: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input 
                    value={companySettings.gstin} 
                    onChange={e => setCompanySettings({...companySettings, gstin: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN</Label>
                  <Input 
                    value={companySettings.pan} 
                    onChange={e => setCompanySettings({...companySettings, pan: e.target.value})} 
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account No.</Label>
                    <Input 
                      value={companySettings.accountNo} 
                      onChange={e => setCompanySettings({...companySettings, accountNo: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input 
                      value={companySettings.ifsc} 
                      onChange={e => setCompanySettings({...companySettings, ifsc: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input 
                      value={companySettings.branch} 
                      onChange={e => setCompanySettings({...companySettings, branch: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

                <Button 
                  className="mt-6" 
                  onClick={handleSaveSettings}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? "Saving..." : "Save Settings"}
                </Button>
            </CardContent>
          </Card>
        </TabsContent>



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

        {/* Backups Tab */}
        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <CardTitle>Data & Backups</CardTitle>
              <CardDescription>Manage your local database backups to prevent data loss.</CardDescription>
            </CardHeader>
            <CardContent>
              <BackupsManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cloud Migration Tab */}
        <TabsContent value="cloud">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Migration</CardTitle>
              <CardDescription>Securely migrate your local database to Supabase (PostgreSQL).</CardDescription>
            </CardHeader>
            <CardContent>
              <CloudMigrationPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

function BackupsManager() {
  const { data: backups, isLoading } = useBackups();
  const createBackup = useCreateBackup();
  const { toast } = useToast();

  const handleCreateBackup = () => {
    createBackup.mutate(undefined, {
      onSuccess: (res) => {
        toast({ title: "Backup Created", description: `Successfully created ${res.filename}` });
      },
      onError: () => {
        toast({ title: "Backup Failed", description: "Could not create backup.", variant: "destructive" });
      }
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Local Database</h3>
          <p className="text-sm text-slate-500">The system automatically backs up data every 6 hours.</p>
        </div>
        <Button onClick={handleCreateBackup} disabled={createBackup.isPending} className="gap-2">
          {createBackup.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
          Backup Now
        </Button>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Available Backups</h4>
        {isLoading ? (
          <div className="text-sm text-slate-500">Loading backups...</div>
        ) : !backups || backups.length === 0 ? (
          <div className="text-sm text-slate-500 border border-dashed rounded p-6 text-center">No backups found.</div>
        ) : (
          <div className="rounded-md border max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b sticky top-0">
                <tr>
                  <th className="p-3 font-medium">Filename</th>
                  <th className="p-3 font-medium">Date Created</th>
                  <th className="p-3 font-medium">Size</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(backup => (
                  <tr key={backup.name} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{backup.name}</td>
                    <td className="p-3 text-slate-500">{format(new Date(backup.time), "dd MMM yyyy, hh:mm a")}</td>
                    <td className="p-3 text-slate-500">{formatBytes(backup.size)}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-800">
                        <a href={`/api/backups/download/${backup.name}`} download>
                          <Download className="w-4 h-4 mr-1" /> Download
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CloudMigrationPanel() {
  const [databaseUrl, setDatabaseUrl] = useState("");
  const migrateMutation = useMigrateToCloud();
  const { toast } = useToast();

  const handleMigrate = () => {
    if (!databaseUrl) {
      toast({ title: "Required", description: "Please enter your Supabase connection string.", variant: "destructive" });
      return;
    }
    
    migrateMutation.mutate(databaseUrl, {
      onSuccess: (res) => {
        toast({ title: "Migration Started", description: res.message });
        setDatabaseUrl("");
      },
      onError: (err: any) => {
        toast({ title: "Migration Failed", description: err.message || "Failed to migrate data.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 text-sm">
        <p className="font-semibold mb-1 flex items-center gap-2"><Cloud className="w-4 h-4" /> Why migrate to the cloud?</p>
        <p>Your data is currently stored locally on this computer. By migrating to Supabase (PostgreSQL), your business data will be safely backed up in the cloud, protected from hard drive failures, and accessible from any device.</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <Label>Supabase Database URL</Label>
          <Input 
            type="password"
            placeholder="postgresql://postgres:password@db.supabase.co:6543/postgres" 
            value={databaseUrl}
            onChange={(e) => setDatabaseUrl(e.target.value)}
          />
          <p className="text-xs text-slate-500">Create a free project at supabase.com and paste your connection string here.</p>
        </div>

        <Button 
          onClick={handleMigrate} 
          disabled={!databaseUrl || migrateMutation.isPending} 
          className="w-full sm:w-auto bg-primary text-white gap-2"
        >
          {migrateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
          {migrateMutation.isPending ? "Migrating Data..." : "Start Migration"}
        </Button>
      </div>
    </div>
  );
}
