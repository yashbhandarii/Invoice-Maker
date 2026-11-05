import crypto from "node:crypto";
import { storage } from "./storage";

interface ServiceAccountCredentials {
  client_email?: string;
  private_key?: string;
  project_id?: string;
}

interface GoogleDriveConfig {
  enabled: boolean;
  authType: "service_account" | "oauth";
  serviceAccountJson?: string;
  rootFolderId?: string;
  invoicesFolderName?: string;
  hamaliFolderName?: string;
  challansFolderName?: string;
  makePublic?: boolean;
  autoUpload?: boolean;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthRefreshToken?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedAccessToken: CachedToken | null = null;
const folderCache = new Map<string, string>();

/**
 * Retrieve Google Drive configuration from DB settings or process.env
 */
export async function getGoogleDriveConfig(): Promise<GoogleDriveConfig> {
  const allSettings = await storage.getSettings();
  const settingsMap = allSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const envServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const envFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const authType = (settingsMap["googleDrive_authType"] || "service_account") as "service_account" | "oauth";
  const serviceAccountJson = settingsMap["googleDrive_serviceAccountJson"] || envServiceAccount || "";
  const rootFolderId = settingsMap["googleDrive_rootFolderId"] || envFolderId || "";
  const enabled = settingsMap["googleDrive_enabled"] === "true" || !!(serviceAccountJson || settingsMap["googleDrive_oauthRefreshToken"]);

  return {
    enabled,
    authType,
    serviceAccountJson,
    rootFolderId,
    invoicesFolderName: settingsMap["googleDrive_invoicesFolderName"] || "Invoices",
    hamaliFolderName: settingsMap["googleDrive_hamaliFolderName"] || "Hamali",
    challansFolderName: settingsMap["googleDrive_challansFolderName"] || "Delivery Challans",
    makePublic: settingsMap["googleDrive_makePublic"] !== "false", // default true
    autoUpload: settingsMap["googleDrive_autoUpload"] === "true",
    oauthClientId: settingsMap["googleDrive_oauthClientId"] || process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    oauthClientSecret: settingsMap["googleDrive_oauthClientSecret"] || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    oauthRefreshToken: settingsMap["googleDrive_oauthRefreshToken"] || process.env.GOOGLE_OAUTH_REFRESH_TOKEN || "",
  };
}

/**
 * Obtain an OAuth2 access token for Google Drive API
 */
export async function getAccessToken(override?: Partial<GoogleDriveConfig>): Promise<string> {
  const hasOverride = override && Object.keys(override).some(k => (override as any)[k]);
  
  // Check in-memory cache with 60s buffer (only if using saved config)
  if (!hasOverride && cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
    return cachedAccessToken.token;
  }

  const baseConfig = await getGoogleDriveConfig();
  const config: GoogleDriveConfig = { ...baseConfig, ...(override || {}) };

  if (config.authType === "service_account") {
    if (!config.serviceAccountJson || !config.serviceAccountJson.trim()) {
      throw new Error("No Service Account JSON key found. Please paste your downloaded Google Cloud Service Account JSON key into the box above.");
    }

    let sa: ServiceAccountCredentials;
    try {
      sa = typeof config.serviceAccountJson === "string" ? JSON.parse(config.serviceAccountJson) : config.serviceAccountJson;
    } catch (e: any) {
      throw new Error(`Invalid Service Account JSON format: ${e.message}. Please paste the entire unedited JSON file.`);
    }

    if (!sa.client_email || !sa.private_key) {
      throw new Error("The Service Account JSON is missing 'client_email' or 'private_key'. Please ensure you created a Service Account Key in Google Cloud Console.");
    }

    // Sign JWT using native Node crypto RS256
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const claimSet = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      }),
    ).toString("base64url");

    const sign = crypto.createSign("RSA-SHA256");
    sign.update(`${header}.${claimSet}`);
    const signature = sign.sign(sa.private_key, "base64url");
    const assertion = `${header}.${claimSet}.${signature}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Authentication failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    const token = data.access_token;
    if (!hasOverride) {
      cachedAccessToken = {
        token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };
    }
    return token;
  } else {
    // OAuth 2.0 with Refresh Token
    if (!config.oauthClientId || !config.oauthClientSecret || !config.oauthRefreshToken) {
      throw new Error("Google Drive OAuth credentials incomplete. Please configure Client ID, Client Secret, and Refresh Token in Settings.");
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.oauthClientId,
        client_secret: config.oauthClientSecret,
        refresh_token: config.oauthRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OAuth token refresh failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    const token = data.access_token;
    if (!hasOverride) {
      cachedAccessToken = {
        token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };
    }
    return token;
  }
}

/**
 * Find or create a folder in Google Drive
 */
export async function getOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentId?: string,
): Promise<string> {
  const cacheKey = `${parentId || "root"}:${folderName}`;
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!;
  }

  // Escape single quotes in folder name
  const safeName = folderName.replace(/'/g, "\\'");
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeName}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      const folderId = data.files[0].id;
      folderCache.set(cacheKey, folderId);
      return folderId;
    }
  }

  // Create folder
  const createPayload: Record<string, any> = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    createPayload.parents = [parentId];
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Drive folder '${folderName}' (${createRes.status}): ${err}`);
  }

  const created = await createRes.json();
  folderCache.set(cacheKey, created.id);
  return created.id;
}

/**
 * Resolve target folder ID for a specific document category
 */
export async function resolveTargetFolder(
  accessToken: string,
  folderType: "invoices" | "hamali" | "challans",
): Promise<{ folderId: string; folderName: string }> {
  const config = await getGoogleDriveConfig();

  // Root folder: use configured rootFolderId if valid, otherwise create or find "LNB Invoicing Documents"
  let rootId = config.rootFolderId?.trim();
  if (!rootId) {
    rootId = await getOrCreateFolder(accessToken, "LNB Invoicing Documents");
  }

  let subfolderName = "Invoices";
  if (folderType === "hamali") {
    subfolderName = config.hamaliFolderName || "Hamali";
  } else if (folderType === "challans") {
    subfolderName = config.challansFolderName || "Delivery Challans";
  } else {
    subfolderName = config.invoicesFolderName || "Invoices";
  }

  const targetFolderId = await getOrCreateFolder(accessToken, subfolderName, rootId);
  return { folderId: targetFolderId, folderName: subfolderName };
}

/**
 * Upload a PDF to Google Drive with automatic folder organization
 */
export async function uploadPdfToDrive(params: {
  pdfBase64: string;
  filename: string;
  folderType?: "invoices" | "hamali" | "challans";
}): Promise<{
  fileId: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  folderName: string;
}> {
  const accessToken = await getAccessToken();
  const folderType = params.folderType || "invoices";
  const { folderId, folderName } = await resolveTargetFolder(accessToken, folderType);

  const cleanFilename = params.filename
    ? params.filename.replace(/[^\w\s.\-()]/g, "_")
    : `${folderType}_${Date.now()}.pdf`;

  const pdfBuffer = Buffer.from(params.pdfBase64, "base64");
  const boundary = `-------GoogleDriveBoundary${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: cleanFilename,
    parents: [folderId],
    mimeType: "application/pdf",
  };

  const multipartBody = Buffer.concat([
    Buffer.from(
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/pdf\r\nContent-Transfer-Encoding: base64\r\n\r\n`,
    ),
    Buffer.from(params.pdfBase64, "utf-8"),
    Buffer.from(closeDelimiter),
  ]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(multipartBody.length),
      },
      body: multipartBody,
    },
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive upload failed (${uploadRes.status}): ${errText}`);
  }

  const uploadData = await uploadRes.json();

  // Optionally set anyone-with-link read permission
  const config = await getGoogleDriveConfig();
  if (config.makePublic && uploadData.id) {
    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "reader",
            type: "anyone",
          }),
        },
      );
    } catch (permErr) {
      console.warn("Could not set public permission on Drive file:", permErr);
    }
  }

  return {
    fileId: uploadData.id,
    name: uploadData.name || cleanFilename,
    webViewLink: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`,
    webContentLink: uploadData.webContentLink,
    folderName,
  };
}

/**
 * Test Google Drive connection and check permissions
 */
export async function testGoogleDriveConnection(override?: Partial<GoogleDriveConfig>): Promise<{
  ok: boolean;
  message: string;
  email?: string;
  rootFolderId?: string;
  rootFolderName?: string;
}> {
  try {
    const token = await getAccessToken(override);
    const baseConfig = await getGoogleDriveConfig();
    const config = { ...baseConfig, ...(override || {}) };

    // Query about information
    const aboutRes = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    let email = "";
    if (config.authType === "service_account" && config.serviceAccountJson) {
      try {
        const sa = typeof config.serviceAccountJson === "string" ? JSON.parse(config.serviceAccountJson) : config.serviceAccountJson;
        email = sa.client_email || "";
      } catch (_) {}
    }
    if (!email && aboutRes.ok) {
      const about = await aboutRes.json();
      email = about.user?.emailAddress || "";
    }

    // Verify root folder or create default
    let rootFolderId = config.rootFolderId?.trim();
    if (rootFolderId) {
      const folderRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${rootFolderId}?fields=id,name`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!folderRes.ok) {
        throw new Error(`Cannot access configured Root Folder ID '${rootFolderId}'. Please make sure you clicked 'Share' on this folder in Google Drive and added the Service Account email (${email || "your service account"}) as Editor.`);
      }
      const folderData = await folderRes.json();
      return {
        ok: true,
        message: "Successfully connected to Google Drive!",
        email,
        rootFolderId,
        rootFolderName: folderData.name,
      };
    } else {
      const defaultRoot = await getOrCreateFolder(token, "LNB Invoicing Documents");
      return {
        ok: true,
        message: "Connected to Google Drive! Default 'LNB Invoicing Documents' folder is active.",
        email,
        rootFolderId: defaultRoot,
        rootFolderName: "LNB Invoicing Documents",
      };
    }
  } catch (error: any) {
    return {
      ok: false,
      message: error?.message || "Failed to connect to Google Drive",
    };
  }
}
