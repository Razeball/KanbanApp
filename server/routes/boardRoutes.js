import { Router } from "express";
import passport from "passport";
import {
  createBoard,
  deleteBoard,
  getBoardById,
  getBoards,
  updateBoard,
} from "../controllers/boardController.js";

const router = Router();

router.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  createBoard
);
router.get("/all", passport.authenticate("jwt", { session: false }), getBoards);
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  getBoardById
);

router.put(
  "/update/:id",
  passport.authenticate("jwt", { session: false }),
  updateBoard
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteBoard
);
export default router;
