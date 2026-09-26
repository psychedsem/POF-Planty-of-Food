import { tool } from "langchain";
import { z } from "zod";
import { createQueryEmbedding } from "../services/embeddingService.js";
import { searchRecipes } from "../services/pineconeService.js";

export const recipeSearchTool = tool(
  async ({ query }) => {
    const embedding = await createQueryEmbedding(query);
    const matches = await searchRecipes(embedding);

    return JSON.stringify(
      matches.map(({ id, score, metadata }) => ({
        id,
        score,
        ...metadata,
      }))
    );
  },
  {
    name: "search_recipes",
    description:
      "Cerca nel database le ricette plant-based più pertinenti. Usalo quando la richiesta contiene informazioni sufficienti per cercare una ricetta.",
    schema: z.object({
      query: z
        .string()
        .describe("La richiesta dell'utente da usare per la ricerca semantica"),
    }),
  }
);