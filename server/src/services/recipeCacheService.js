import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, "../../data");
const cacheFile = path.join(dataDir, "recipes.json");

// Salva le ricette elaborate nella cache locale
export async function saveRecipesToCache(recipes) {
  await mkdir(dataDir, { recursive: true });

  await writeFile(
    cacheFile,
    JSON.stringify(recipes, null, 2),
    "utf8"
  );
}

// Recupera le ricette dalla cache locale
export async function getRecipesFromCache() {
  try {
    const data = await readFile(cacheFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}