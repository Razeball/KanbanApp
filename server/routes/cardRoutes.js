import { Router } from "express";
import passport from "passport";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {
  createCard,
  deleteCard,
  moveCard,
  updateCard,
} from "../controllers/cardController.js";
const router = Router();

router.post("/create/:listId", optionalAuth, createCard);
router.put("/update/:cardId", optionalAuth, updateCard);
router.delete("/delete/:cardId", optionalAuth, deleteCard);
router.put("/move/:cardId", optionalAuth, moveCard);

export default router;
