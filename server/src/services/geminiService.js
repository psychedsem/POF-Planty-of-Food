import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

const recipeSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER },
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      ingredients: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      instructions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      characteristicPhrase: { type: Type.STRING },
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
`;

const tagTranslations = {
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

function hasError(error, code, label) {
  const message = error?.message || "";

  return (
    error?.status === code ||
    error?.code === code ||
    message.includes(String(code)) ||
    message.includes(label)
  );
}

async function generateRecipes(recipes, model) {
  const response = await ai.models.generateContent({
    model,
    contents: JSON.stringify(recipes),
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
      temperature: 0,
    },
  });

  return JSON.parse(response.text);
}

async function generateWithRetry(recipes) {
  for (const delay of [1000, 2000, 4000]) {
    try {
      return await generateRecipes(recipes, PRIMARY_MODEL);
    } catch (error) {
      if (hasError(error, 429, "RESOURCE_EXHAUSTED")) {
        console.warn(
          `Quota ${PRIMARY_MODEL} esaurita, uso ${FALLBACK_MODEL}...`
        );

        return generateRecipes(recipes, FALLBACK_MODEL);
      }

      if (!hasError(error, 503, "UNAVAILABLE")) {
        throw error;
      }

      console.warn(
        `Gemini non disponibile, nuovo tentativo tra ${delay / 1000}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.warn(
    `${PRIMARY_MODEL} ancora non disponibile, uso ${FALLBACK_MODEL}...`
  );

  return generateRecipes(recipes, FALLBACK_MODEL);
}

function translateTags(tags = []) {
  return [
    ...new Set(tags.map((tag) => tagTranslations[tag] || tag)),
  ];
}

function getNumbers(text) {
  return text.match(/\d+(?:[.,]\d+)?/g) || [];
}

function validateRecipes(originalRecipes, processedRecipes) {
  if (
    !Array.isArray(processedRecipes) ||
    processedRecipes.length !== originalRecipes.length
  ) {
    throw new Error("Numero di ricette elaborato non valido");
  }

  for (const original of originalRecipes) {
    const processed = processedRecipes.find(
      (recipe) => recipe.id === original.id
    );

    if (!processed) {
      throw new Error(`Ricetta ${original.id} mancante`);
    }

    if (processed.ingredients.length !== original.ingredients.length) {
      throw new Error(`Ingredienti alterati nella ricetta ${original.id}`);
    }

    if (processed.instructions.length !== original.instructions.length) {
      throw new Error(`Istruzioni alterate nella ricetta ${original.id}`);
    }

    original.ingredients.forEach((ingredient, index) => {
      const before = getNumbers(ingredient);
      const after = getNumbers(processed.ingredients[index]);

      if (JSON.stringify(before) !== JSON.stringify(after)) {
        throw new Error(
          `Quantità alterata nell'ingrediente ${index + 1} della ricetta ${original.id}`
        );
      }
    });
  }
}

export async function prepareRecipesForRag(recipes) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY non configurata");
  }

  const processedRecipes = await generateWithRetry(recipes);

  validateRecipes(recipes, processedRecipes);

  return processedRecipes.map((recipe) => {
    const original = recipes.find((item) => item.id === recipe.id);

    return {
      ...recipe,
      sourceUrl: original.sourceUrl,
      tags: translateTags(original.tags),
      readyInMinutes: original.readyInMinutes,
      servings: original.servings,
    };
  });
}