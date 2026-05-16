import app, { setupApp } from "../server/index";

export default async (req: any, res: any) => {
    try {
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
