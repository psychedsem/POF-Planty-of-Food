import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIMENSION = 768;

async function createEmbedding(content) {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: content,
    config: {
      outputDimensionality: EMBEDDING_DIMENSION,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error("Embedding non valido");
  }

  return embedding;
}

// Prepara la ricetta per la ricerca semantica
function buildRecipeDocument(recipe) {
  const content = [
    `Descrizione: ${recipe.summary}`,
    `Caratteristica: ${recipe.characteristicPhrase}`,
    `Ingredienti: ${recipe.ingredients.join(", ")}`,
    `Istruzioni: ${recipe.instructions.join(" ")}`,
    `Tag: ${recipe.tags.join(", ")}`,
    `Tempo: ${recipe.readyInMinutes} minuti`,
    `Porzioni: ${recipe.servings}`,
  ].join(" | ");

  return `title: ${recipe.title} | text: ${content}`;
}

export function createRecipeEmbedding(recipe) {
  return createEmbedding(buildRecipeDocument(recipe));
}

export function createQueryEmbedding(query) {
  return createEmbedding(`task: search result | query: ${query}`);
}