import express from "express";
import {
  getProcessedRecipes,
  getRecipes,
  syncRecipes,
} from "../controllers/recipeController.js";

const router = express.Router();

router.get("/", getRecipes);
router.post("/sync", syncRecipes);
router.get("/processed", getProcessedRecipes);

export default router;