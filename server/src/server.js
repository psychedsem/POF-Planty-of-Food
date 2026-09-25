import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint di controllo
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "POF API is running",
  });
});

// Avvio del server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`POF server running on http://localhost:${PORT}`);
});