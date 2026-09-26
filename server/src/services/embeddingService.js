import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const DIMENSION = 768;

async function createEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
    config: {
      outputDimensionality: DIMENSION,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (values?.length !== DIMENSION) {
    throw new Error("Embedding non valido");
  }

  return values;
}

export function createRecipeEmbedding(recipe) {
  const text = [
    `Descrizione: ${recipe.summary}`,
    `Caratteristica: ${recipe.characteristicPhrase}`,
    `Ingredienti: ${recipe.ingredients.join(", ")}`,
    `Istruzioni: ${recipe.instructions.join(" ")}`,
    `Tag: ${recipe.tags.join(", ")}`,
    `Tempo: ${recipe.readyInMinutes} minuti`,
    `Porzioni: ${recipe.servings}`,
  ].join(" | ");

  return createEmbedding(`title: ${recipe.title} | text: ${text}`);
}

export function createQueryEmbedding(query) {
  return createEmbedding(`task: search result | query: ${query}`);
}