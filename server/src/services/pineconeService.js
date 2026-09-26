import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index({
  name: process.env.PINECONE_INDEX,
});

// Inserisce una ricetta nel vector database
export async function upsertRecipe(recipe, embedding) {
  await index.upsert({
    records: [
      {
        id: String(recipe.id),
        values: embedding,
        metadata: {
          recipeId: recipe.id,
          title: recipe.title,
          sourceUrl: recipe.sourceUrl,
          summary: recipe.summary,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          tags: recipe.tags,
          characteristicPhrase: recipe.characteristicPhrase,
          readyInMinutes: recipe.readyInMinutes,
          servings: recipe.servings,
        },
      },
    ],
  });

  return String(recipe.id);
}

// Cerca le ricette semanticamente più simili
export async function searchRecipes(embedding, topK = 3) {
  const result = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  return result.matches;
}