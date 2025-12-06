import app, { setupApp } from "../server/index";

export default async (req: any, res: any) => {
    await setupApp();
    app(req, res);
};
