import { Router } from "express";
import passport from "passport";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {
  createBoard,
  createCompleteBoard,
  overwriteBoard,
  deleteBoard,
  getBoardById,
  getBoards,
  updateBoard,
  enableCollaboration,
  disableCollaboration,
  generateNewShareCode,
  getBoardByShareCode,
  joinBoard,
} from "../controllers/boardController.js";

const router = Router();

router.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  createBoard
);

router.post(
  "/create-complete",
  passport.authenticate("jwt", { session: false }),
  createCompleteBoard
);

router.put(
  "/overwrite/:id",
  passport.authenticate("jwt", { session: false }),
  overwriteBoard
);

router.get("/all", passport.authenticate("jwt", { session: false }), getBoards);
router.get("/share/:shareCode", getBoardByShareCode);

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

router.post(
  "/enable-collaboration/:id",
  passport.authenticate("jwt", { session: false }),
  enableCollaboration
);

router.post(
  "/disable-collaboration/:id",
  passport.authenticate("jwt", { session: false }),
  disableCollaboration
);

router.post(
  "/generate-code/:id",
  passport.authenticate("jwt", { session: false }),
  generateNewShareCode
);

router.post("/join", optionalAuth, joinBoard);

router.get("/:id", optionalAuth, getBoardById);

export default router;
