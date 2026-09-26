const SPOONACULAR_URL = "https://api.spoonacular.com";

function cleanText(text = "") {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/([.!?])(?=[A-Z])/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSummary(summary = "") {
  return cleanText(summary)
    .replace(/\s*Try .*? for similar recipes\.\s*$/i, "")
    .replace(/\s*Users who liked this recipe also liked .*?\.\s*$/i, "")
    .trim();
}

function normalizeRecipe(recipe) {
  const tags = [
    ...(recipe.diets || []),
    ...(recipe.dishTypes || []),
    ...(recipe.cuisines || []),
  ];

  return {
    id: recipe.id,
    title: recipe.title,
    sourceUrl: recipe.sourceUrl,
    summary: cleanSummary(recipe.summary),
    ingredients:
      recipe.extendedIngredients?.map((ingredient) =>
        cleanText(ingredient.original)
      ) || [],
    instructions:
      recipe.analyzedInstructions?.flatMap((section) =>
        section.steps.map((step) => cleanText(step.step))
      ) || [],
    tags: [...new Set(tags)],
    readyInMinutes: recipe.readyInMinutes,
    servings: recipe.servings,
  };
}

export async function getPlantBasedRecipes(limit = 3) {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    throw new Error("SPOONACULAR_API_KEY non configurata");
  }

  // Cerca ricette vegane che abbiano istruzioni disponibili
  const searchParams = new URLSearchParams({
    diet: "vegan",
    number: String(limit),
    instructionsRequired: "true",
  });

  const searchResponse = await fetch(
    `${SPOONACULAR_URL}/recipes/complexSearch?${searchParams}`,
    {
      headers: {
        "x-api-key": apiKey,
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error(`Errore Spoonacular: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const recipeIds = searchData.results.map((recipe) => recipe.id);

  if (recipeIds.length === 0) {
    return [];
  }

  // Recupera i dati completi delle ricette trovate
  const detailsParams = new URLSearchParams({
    ids: recipeIds.join(","),
    includeNutrition: "false",
  });

  const detailsResponse = await fetch(
    `${SPOONACULAR_URL}/recipes/informationBulk?${detailsParams}`,
    {
      headers: {
        "x-api-key": apiKey,
      },
    }
  );

  if (!detailsResponse.ok) {
    throw new Error(`Errore Spoonacular: ${detailsResponse.status}`);
  }

  const recipes = await detailsResponse.json();

  return recipes.map(normalizeRecipe);
}