import "dotenv/config";
import express from "express";
import cors from "cors";
import { getPlantBasedRecipes } from "./services/spoonacularService.js";
import { prepareRecipesForRag } from "./services/geminiService.js";

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

// Recupero delle ricette plant-based
app.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await getPlantBasedRecipes();

    res.json({
      status: "ok",
      recipes,
    });
  } catch (error) {
    console.error("Errore Spoonacular:", error.message);

    res.status(500).json({
      status: "error",
      message: "Impossibile recuperare le ricette",
    });
  }
});

// Preparazione delle ricette per il RAG
app.get("/api/recipes/processed", async (req, res) => {
  try {
    const recipes = await getPlantBasedRecipes();
    const processedRecipes = await prepareRecipesForRag(recipes);

    res.json({
      status: "ok",
      recipes: processedRecipes,
    });
  } catch (error) {
    console.error("Errore elaborazione ricette:", error.message);

    res.status(500).json({
      status: "error",
      message: "Impossibile elaborare le ricette",
    });
  }
});

// Avvio del server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`POF server running on http://localhost:${PORT}`);
});