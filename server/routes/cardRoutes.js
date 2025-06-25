import { Router } from "express";
import passport from "passport";
import {
  createCard,
  deleteCard,
  moveCard,
  updateCard,
} from "../controllers/cardController.js";
const router = Router();

router.post(
  "/create/:listId",
  passport.authenticate("jwt", { session: false }),
  createCard
);
router.put(
  "/update/:cardId",
  passport.authenticate("jwt", { session: false }),
  updateCard
);

router.delete(
  "/delete/:cardId",
  passport.authenticate("jwt", { session: false }),
  deleteCard
);

router.put(
  "/move/:cardId",
  passport.authenticate("jwt", { session: false }),
  moveCard
);

export default router;
