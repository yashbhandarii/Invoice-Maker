import * as bundledServer from "../dist/index.cjs";

type RequestHandler = (req: any, res: any) => void;

function resolveServerExports() {
    const moduleDefault =
        bundledServer.default &&
        typeof bundledServer.default === "object"
            ? (bundledServer.default as Record<string, unknown>)
            : null;

    const app =
        typeof moduleDefault?.default === "function"
            ? (moduleDefault.default as RequestHandler)
            : typeof bundledServer.default === "function"
              ? (bundledServer.default as unknown as RequestHandler)
              : null;

    const setupApp =
        typeof bundledServer.setupApp === "function"
            ? bundledServer.setupApp
            : typeof moduleDefault?.setupApp === "function"
              ? (moduleDefault.setupApp as () => Promise<void>)
              : null;

    if (!app || !setupApp) {
        throw new TypeError("Invalid bundled server exports");
    }

    return { app, setupApp };
}

export default async (req: any, res: any) => {
    try {
        const { app, setupApp } = resolveServerExports();
        await setupApp();
        app(req, res);
    } catch (error: any) {
        console.error("Vercel function error:", error);
        res.status(500).json({ 
            error: "Server initialization failed", 
            message: error?.message || "Unknown error",
            stack: error?.stack
        });
    }
};
