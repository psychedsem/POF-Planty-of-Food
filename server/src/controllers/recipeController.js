import { getPlantBasedRecipes } from "../services/spoonacularService.js";
import { prepareRecipesForRag } from "../services/geminiService.js";
import {
  getRecipesFromCache,
  saveRecipesToCache,
} from "../services/recipeCacheService.js";

function sendError(res, error, logMessage, userMessage) {
  console.error(`${logMessage}:`, error.message);

  return res.status(500).json({
    status: "error",
    message: userMessage,
  });
}

export async function getRecipes(req, res) {
  try {
    const recipes = await getPlantBasedRecipes();
    res.json({ status: "ok", recipes });
  } catch (error) {
    return sendError(
      res,
      error,
      "Errore Spoonacular",
      "Impossibile recuperare le ricette"
    );
  }
}

export async function syncRecipes(req, res) {
  try {
    const recipes = await getPlantBasedRecipes();
    const processedRecipes = await prepareRecipesForRag(recipes);

    await saveRecipesToCache(processedRecipes);

    res.json({
      status: "ok",
      message: "Ricette sincronizzate",
      count: processedRecipes.length,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Errore sincronizzazione ricette",
      "Impossibile sincronizzare le ricette"
    );
  }
}

export async function getProcessedRecipes(req, res) {
  try {
    const recipes = await getRecipesFromCache();

    if (!recipes.length) {
      return res.status(404).json({
        status: "error",
        message: "Cache ricette vuota",
      });
    }

    res.json({ status: "ok", recipes });
  } catch (error) {
    return sendError(
      res,
      error,
      "Errore lettura cache",
      "Impossibile leggere le ricette"
    );
  }
}