import { Pinecone } from "@pinecone-database/pinecone";

const index = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
}).index({
  name: process.env.PINECONE_INDEX,
});

export async function upsertRecipe(recipe, embedding) {
  const { id, ...metadata } = recipe;

  await index.upsert({
    records: [
      {
        id: String(id),
        values: embedding,
        metadata: {
          ...metadata,
          recipeId: id,
        },
      },
    ],
  });

  return String(id);
}

export async function searchRecipes(embedding, topK = 3) {
  const result = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  return result.matches;
}