import { getPlantBasedRecipes } from "../services/spoonacularService.js";
import { prepareRecipesForRag } from "../services/geminiService.js";
import { createRecipeEmbedding } from "../services/embeddingService.js";
import { upsertRecipe } from "../services/pineconeService.js";
import {
  getRecipesFromCache,
  saveRecipesToCache,
} from "../services/recipeCacheService.js";

function sendError(res, error, action) {
  console.error(`Errore nel ${action}:`, error.message);

  return res.status(500).json({
    status: "error",
    message: `Impossibile ${action}`,
  });
}

// Recupera le ricette da Spoonacular
export async function getRecipes(req, res) {
  try {
    const recipes = await getPlantBasedRecipes();
    return res.json({ status: "ok", recipes });
  } catch (error) {
    return sendError(res, error, "recuperare le ricette");
  }
}

// Sincronizza le ricette con cache e Pinecone
export async function syncRecipes(req, res) {
  try {
    const recipes = await getPlantBasedRecipes();
    const processedRecipes = await prepareRecipesForRag(recipes);

    await saveRecipesToCache(processedRecipes);

    for (const recipe of processedRecipes) {
      const embedding = await createRecipeEmbedding(recipe);
      await upsertRecipe(recipe, embedding);
    }

    return res.json({
      status: "ok",
      message: "Ricette sincronizzate e indicizzate",
      count: processedRecipes.length,
    });
  } catch (error) {
    return sendError(res, error, "sincronizzare le ricette");
  }
}

// Recupera le ricette elaborate dalla cache
export async function getProcessedRecipes(req, res) {
  try {
    const recipes = await getRecipesFromCache();

    if (!recipes.length) {
      return res.status(404).json({
        status: "error",
        message: "Cache ricette vuota",
      });
    }

    return res.json({ status: "ok", recipes });
  } catch (error) {
    return sendError(res, error, "leggere le ricette");
  }
}