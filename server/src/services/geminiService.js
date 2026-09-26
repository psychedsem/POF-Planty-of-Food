import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

const recipeSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "integer" },
      title: { type: "string" },
      summary: { type: "string" },
      ingredients: {
        type: "array",
        items: { type: "string" },
      },
      instructions: {
        type: "array",
        items: { type: "string" },
      },
      characteristicPhrase: { type: "string" },
    },
    required: [
      "id",
      "title",
      "summary",
      "ingredients",
      "instructions",
      "characteristicPhrase",
    ],
  },
};

const systemInstruction = `
Trasforma le ricette ricevute in dati in italiano pronti per un assistente di ricette plant-based.

Regole:
- Mantieni esattamente lo stesso numero di ricette e gli stessi id.
- Traduci il titolo in italiano senza cambiarne il significato.
- Il titolo deve suonare naturale in italiano: evita traduzioni letterali innaturali.
- Se il titolo contiene un sottotitolo promozionale dopo i due punti, puoi ometterlo e mantenere soltanto il nome naturale del piatto.
- Riscrivi il summary in italiano naturale in massimo 2 frasi.
- Il summary deve descrivere soltanto il tipo di piatto, gli ingredienti principali, lo stile della ricetta e, se utile, il tempo di preparazione.
- Non includere prezzi, calorie, percentuali nutrizionali, popolarità, punteggi Spoonacular, nome del sito sorgente o frasi promozionali.
- Non inserire nel summary informazioni dietetiche o nutrizionali come vegano, vegetariano, senza glutine, senza latticini, calorie, proteine o grassi.
- Le caratteristiche dietetiche sono gestite separatamente dai tag e non devono essere ripetute nel summary.
- Traduci ogni ingrediente uno a uno, mantenendo lo stesso ordine e lo stesso numero di elementi.
- Non aggiungere o eliminare ingredienti.
- Mantieni quantità e unità presenti nell'ingrediente originale.
- Mantieni esattamente tutte le cifre, frazioni e intervalli numerici presenti in ogni ingrediente.
- Non convertire le quantità e non cambiare l'unità di misura: traducila soltanto.
- Per esempio, "1 1/2 teaspoons" deve mantenere "1 1/2" e diventare "1 1/2 cucchiaini", mai cucchiai.
- Traduci ogni istruzione uno a uno, mantenendo lo stesso ordine e lo stesso numero di passaggi.
- Non aggiungere, eliminare, dividere o unire passaggi.
- Se in un'istruzione compare un ingrediente opzionale di origine animale, sostituiscilo sempre con un equivalente esplicitamente vegetale.
- Non lasciare mai termini come yogurt greco, panna acida, crème fraîche o altri ingredienti animali senza specificare chiaramente che l'alternativa è vegetale.
- characteristicPhrase deve essere una breve frase in italiano utile alla ricerca semantica.
- La characteristicPhrase deve basarsi esclusivamente sui dati della ricetta ricevuta.
- Non inventare ingredienti, quantità, proprietà o informazioni assenti dai dati sorgente.
`.trim();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUnavailable(error) {
  const message = String(error?.message || error);

  return (
    error?.status === 503 ||
    error?.code === 503 ||
    message.includes('"code":503') ||
    message.includes("UNAVAILABLE")
  );
}

async function generateRecipes(recipes, model) {
  return ai.models.generateContent({
    model,
    contents: JSON.stringify(recipes),
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
      temperature: 0,
    },
  });
}

async function generateWithRetry(recipes) {
  const delays = [1000, 2000, 4000];
  let lastError;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await generateRecipes(recipes, PRIMARY_MODEL);
    } catch (error) {
      lastError = error;

      if (!isUnavailable(error) || attempt === delays.length) {
        break;
      }

      console.log(
        `Gemini non disponibile, nuovo tentativo tra ${
          delays[attempt] / 1000
        }s...`
      );

      await wait(delays[attempt]);
    }
  }

  if (!isUnavailable(lastError)) {
    throw lastError;
  }

  console.log(`Provo il modello alternativo ${FALLBACK_MODEL}...`);

  return generateRecipes(recipes, FALLBACK_MODEL);
}

function translateTags(tags) {
  const translations = {
    "dairy free": "senza latticini",
    "gluten free": "senza glutine",
    paleolithic: "paleo",
    "lacto ovo vegetarian": "latto-ovo vegetariano",
    primal: "primal",
    vegan: "vegano",
    antipasti: "antipasti",
    soup: "zuppa",
    starter: "antipasto",
    snack: "snack",
    appetizer: "antipasto",
    antipasto: "antipasto",
    "hor d'oeuvre": "antipasto",
    "side dish": "contorno",
    "whole 30": "whole30",
    lunch: "pranzo",
    "main course": "piatto principale",
    "main dish": "piatto principale",
    dinner: "cena",
    Cajun: "cajun",
    Creole: "creolo",
  };

  return [...new Set(tags.map((tag) => translations[tag] || tag))];
}

function getNumbers(text) {
  return text.match(/\d+(?:[.,]\d+)?/g) || [];
}

function validateRecipes(originalRecipes, processedRecipes) {
  if (processedRecipes.length !== originalRecipes.length) {
    throw new Error("Gemini ha modificato il numero delle ricette");
  }

  for (const original of originalRecipes) {
    const processed = processedRecipes.find(
      (recipe) => recipe.id === original.id
    );

    if (!processed) {
      throw new Error(`Ricetta ${original.id} mancante`);
    }

    if (processed.ingredients.length !== original.ingredients.length) {
      throw new Error(`Ingredienti modificati nella ricetta ${original.id}`);
    }

    for (let i = 0; i < original.ingredients.length; i++) {
      const originalNumbers = getNumbers(original.ingredients[i]);
      const processedNumbers = getNumbers(processed.ingredients[i]);

      if (
        JSON.stringify(originalNumbers) !== JSON.stringify(processedNumbers)
      ) {
        throw new Error(
          `Quantità modificata nella ricetta ${original.id}, ingrediente ${
            i + 1
          }`
        );
      }
    }

    if (processed.instructions.length !== original.instructions.length) {
      throw new Error(`Istruzioni modificate nella ricetta ${original.id}`);
    }
  }
}

export async function prepareRecipesForRag(recipes) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY non configurata");
  }

  const response = await generateWithRetry(recipes);
  const processedRecipes = JSON.parse(response.text);

  validateRecipes(recipes, processedRecipes);

  return processedRecipes.map((recipe) => {
    const originalRecipe = recipes.find(
      (original) => original.id === recipe.id
    );

    return {
      id: recipe.id,
      title: recipe.title,
      sourceUrl: originalRecipe.sourceUrl,
      summary: recipe.summary,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: translateTags(originalRecipe.tags),
      characteristicPhrase: recipe.characteristicPhrase,
      readyInMinutes: originalRecipe.readyInMinutes,
      servings: originalRecipe.servings,
    };
  });
}