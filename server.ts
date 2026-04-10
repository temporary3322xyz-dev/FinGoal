import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "FinGoal AI Server is running" });
  });

  // Financial Logic Helper (Mocked for now, logic will be on frontend but API can serve as proxy if needed)
  app.post("/api/calculate-savings", (req, res) => {
    const { income, expenses } = req.body;
    const savings = income - expenses;
    const ratio = income > 0 ? (savings / income) * 100 : 0;
    
    let risk = "Low";
    if (ratio < 10) risk = "High";
    else if (ratio < 25) risk = "Medium";

    res.json({ savings, ratio, risk });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
