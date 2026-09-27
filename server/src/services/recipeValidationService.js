function getNumbers(text) {
  return text.match(/\d+(?:[.,]\d+)?/g) || [];
}

export function validateRecipes(originalRecipes, processedRecipes) {
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