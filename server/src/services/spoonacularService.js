const SPOONACULAR_URL = "https://api.spoonacular.com";

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

  return detailsResponse.json();
}