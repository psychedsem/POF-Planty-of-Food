const SPOONACULAR_URL =
  "https://api.spoonacular.com/recipes/complexSearch";

export async function getPlantBasedRecipes(limit = 3) {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    throw new Error("SPOONACULAR_API_KEY non configurata");
  }

  const params = new URLSearchParams({
    diet: "vegan",
    number: String(limit),
    addRecipeInformation: "true",
  });

  const response = await fetch(`${SPOONACULAR_URL}?${params}`, {
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Errore Spoonacular: ${response.status}`);
  }

  const data = await response.json();
  return data.results;
}