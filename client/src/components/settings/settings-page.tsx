import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings, useAuditLogs } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useBackups, useCreateBackup, useMigrateToCloud, useGoogleDriveStatus, useTestGoogleDrive } from "@/lib/api";
import { Download, Database, Cloud, HardDrive, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Key, FolderOpen, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

function GoogleDriveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="currentColor">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

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
          <TabsTrigger value="drive" className="gap-2"><GoogleDriveIcon className="w-4 h-4" /> Google Drive</TabsTrigger>
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

        {/* Google Drive Tab */}
        <TabsContent value="drive">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GoogleDriveIcon className="w-5 h-5" /> Google Drive Cloud Storage
              </CardTitle>
              <CardDescription>
                Automatically upload and organize your PDFs (Invoices, Hamali, Delivery Challans) into dedicated Google Drive folders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleDriveSettingsPanel />
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

function GoogleDriveSettingsPanel() {
  const { data: driveStatus, refetch: refetchStatus } = useGoogleDriveStatus();
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const testConnection = useTestGoogleDrive();
  const { toast } = useToast();

  const [form, setForm] = useState({
    authType: "service_account",
    serviceAccountJson: "",
    rootFolderId: "",
    invoicesFolderName: "Invoices",
    hamaliFolderName: "Hamali",
    challansFolderName: "Delivery Challans",
    makePublic: "true",
    autoUpload: "false",
    oauthClientId: "",
    oauthClientSecret: "",
    oauthRefreshToken: "",
  });

  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    email?: string;
    rootFolderName?: string;
  } | null>(null);

  useEffect(() => {
    if (settingsData) {
      setForm({
        authType: settingsData["googleDrive_authType"] || "service_account",
        serviceAccountJson: settingsData["googleDrive_serviceAccountJson"] || "",
        rootFolderId: settingsData["googleDrive_rootFolderId"] || "",
        invoicesFolderName: settingsData["googleDrive_invoicesFolderName"] || "Invoices",
        hamaliFolderName: settingsData["googleDrive_hamaliFolderName"] || "Hamali",
        challansFolderName: settingsData["googleDrive_challansFolderName"] || "Delivery Challans",
        makePublic: settingsData["googleDrive_makePublic"] !== "false" ? "true" : "false",
        autoUpload: settingsData["googleDrive_autoUpload"] === "true" ? "true" : "false",
        oauthClientId: settingsData["googleDrive_oauthClientId"] || "",
        oauthClientSecret: settingsData["googleDrive_oauthClientSecret"] || "",
        oauthRefreshToken: settingsData["googleDrive_oauthRefreshToken"] || "",
      });
    }
  }, [settingsData]);

  const handleSave = () => {
    updateSettings.mutate(
      {
        googleDrive_authType: form.authType,
        googleDrive_serviceAccountJson: form.serviceAccountJson,
        googleDrive_rootFolderId: form.rootFolderId,
        googleDrive_invoicesFolderName: form.invoicesFolderName,
        googleDrive_hamaliFolderName: form.hamaliFolderName,
        googleDrive_challansFolderName: form.challansFolderName,
        googleDrive_makePublic: form.makePublic,
        googleDrive_autoUpload: form.autoUpload,
        googleDrive_oauthClientId: form.oauthClientId,
        googleDrive_oauthClientSecret: form.oauthClientSecret,
        googleDrive_oauthRefreshToken: form.oauthRefreshToken,
        googleDrive_enabled: "true",
      },
      {
        onSuccess: () => {
          toast({
            title: "Settings Saved",
            description: "Google Drive configuration has been saved successfully.",
          });
          refetchStatus();
        },
        onError: (err: any) => {
          toast({
            title: "Save Failed",
            description: err?.message || "Could not save settings.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await testConnection.mutateAsync();
      setTestResult(res);
      toast({
        title: "Connection Successful!",
        description: res.message,
      });
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || "Failed to connect to Google Drive" });
      toast({
        title: "Connection Failed",
        description: err.message || "Please verify your credentials and permissions.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        driveStatus?.isConfigured
          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
          : "bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-sm">
            <GoogleDriveIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {driveStatus?.isConfigured ? "Google Drive Configured & Active" : "Google Drive Not Configured"}
            </h4>
            <p className="text-xs opacity-90 mt-0.5">
              {driveStatus?.isConfigured
                ? "PDF documents will upload directly to your Google Drive folders."
                : "Add your Service Account key or OAuth credentials below to enable cloud uploads."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={testConnection.isPending || (!form.serviceAccountJson && !form.oauthRefreshToken)}
            className="text-xs bg-white dark:bg-slate-900 border-slate-300 shadow-sm"
          >
            {testConnection.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            )}
            Test Connection
          </Button>
        </div>
      </div>

      {testResult && (
        <div className={`p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
          testResult.ok ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
          <div>
            <span className="font-semibold">{testResult.ok ? "Connected successfully" : "Connection error"}: </span>
            {testResult.message}
            {testResult.email && <span className="block mt-0.5 text-slate-600 dark:text-slate-400">Account: {testResult.email}</span>}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="space-y-5 bg-white p-5 rounded-xl border shadow-sm">
        <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" /> Credentials & Authentication
        </h3>

        {/* Auth Type Selector */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="radio"
              name="authType"
              value="service_account"
              checked={form.authType === "service_account"}
              onChange={() => setForm({ ...form, authType: "service_account" })}
              className="text-primary"
            />
            <span>Google Service Account (Recommended)</span>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="radio"
              name="authType"
              value="oauth"
              checked={form.authType === "oauth"}
              onChange={() => setForm({ ...form, authType: "oauth" })}
              className="text-primary"
            />
            <span>OAuth 2.0 Credentials</span>
          </label>
        </div>

        {form.authType === "service_account" ? (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Service Account Key (JSON)</Label>
            <Textarea
              placeholder='Paste full contents of your Google Service Account JSON key here: {"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}'
              rows={5}
              value={form.serviceAccountJson}
              onChange={(e) => setForm({ ...form, serviceAccountJson: e.target.value })}
              className="font-mono text-xs"
            />
            <p className="text-xs text-slate-500">
              Paste the entire JSON key file downloaded from Google Cloud Console. Your private key stays safely stored in your database.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">OAuth Client ID</Label>
              <Input
                placeholder="xxx.apps.googleusercontent.com"
                value={form.oauthClientId}
                onChange={(e) => setForm({ ...form, oauthClientId: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">OAuth Client Secret</Label>
              <Input
                type="password"
                placeholder="GOCSPX-..."
                value={form.oauthClientSecret}
                onChange={(e) => setForm({ ...form, oauthClientSecret: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">OAuth Refresh Token</Label>
              <Input
                type="password"
                placeholder="1//04..."
                value={form.oauthRefreshToken}
                onChange={(e) => setForm({ ...form, oauthRefreshToken: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
        )}

        <hr className="my-4 border-slate-100" />

        <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" /> Folder Organization
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold">Root Folder ID (Optional)</Label>
            <Input
              placeholder="e.g. 1A2B3C4D5E... (leave blank to auto-create 'LNB Invoicing Documents')"
              value={form.rootFolderId}
              onChange={(e) => setForm({ ...form, rootFolderId: e.target.value })}
              className="text-xs font-mono"
            />
            <p className="text-xs text-slate-500">
              If left blank, the app will automatically create and use a folder named <strong>LNB Invoicing Documents</strong>. If using a specific folder, make sure you share it with your Service Account email as Editor!
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Invoices Subfolder Name</Label>
            <Input
              value={form.invoicesFolderName}
              onChange={(e) => setForm({ ...form, invoicesFolderName: e.target.value })}
              placeholder="Invoices"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Hamali Subfolder Name</Label>
            <Input
              value={form.hamaliFolderName}
              onChange={(e) => setForm({ ...form, hamaliFolderName: e.target.value })}
              placeholder="Hamali"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Delivery Challans Subfolder Name</Label>
            <Input
              value={form.challansFolderName}
              onChange={(e) => setForm({ ...form, challansFolderName: e.target.value })}
              placeholder="Delivery Challans"
              className="text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="makePublic"
              checked={form.makePublic === "true"}
              onCheckedChange={(checked) => setForm({ ...form, makePublic: checked ? "true" : "false" })}
            />
            <Label htmlFor="makePublic" className="text-xs cursor-pointer font-medium">
              Make uploaded PDFs viewable by anyone with the link
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="bg-primary text-white shadow-sm"
          >
            {updateSettings.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            {updateSettings.isPending ? "Saving..." : "Save Google Drive Settings"}
          </Button>
        </div>
      </div>

      {/* Step by Step Guide Card */}
      <div className="bg-slate-100/70 p-5 rounded-xl border text-slate-700 space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-900">
          <Info className="w-4 h-4 text-blue-600" /> How to Set Up Google Drive Integration (in 3 Minutes)
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
          <li>
            Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium inline-flex items-center">Google Cloud Console <ExternalLink className="w-3 h-3 ml-0.5 inline" /></a> and create or select a project.
          </li>
          <li>
            Navigate to <strong>APIs &amp; Services &gt; Library</strong>, search for <strong>Google Drive API</strong>, and click <strong>Enable</strong>.
          </li>
          <li>
            Go to <strong>APIs &amp; Services &gt; Credentials</strong>, click <strong>Create Credentials &gt; Service Account</strong>.
          </li>
          <li>
            After creating the service account, click on it, go to the <strong>Keys</strong> tab, click <strong>Add Key &gt; Create new key (JSON)</strong>, and download the JSON file.
          </li>
          <li>
            Open Google Drive, create a folder named <strong>LNB Invoicing Documents</strong>, click <strong>Share</strong>, and add the Service Account email address with <strong>Editor</strong> access.
          </li>
          <li>
            Paste the contents of your downloaded JSON key into the box above and click <strong>Save Google Drive Settings</strong>!
          </li>
        </ol>
      </div>
    </div>
  );
}
