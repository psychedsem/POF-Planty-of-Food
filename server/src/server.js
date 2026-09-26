import "dotenv/config";
import express from "express";
import cors from "cors";
import recipeRoutes from "./routes/recipeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Controllo dello stato dell'API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API POF attiva",
  });
});

// Route delle ricette
app.use("/api/recipes", recipeRoutes);

// Chat con memoria persistente
app.use("/api/chat", chatRoutes);

// Avvio del server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`POF server running on http://localhost:${PORT}`);
});