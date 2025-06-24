import { Router } from "express";
import passport from "passport";
import {
  createList,
  deleteList,
  updateList,
} from "../controllers/listController.js";
const router = Router();

router.post(
  "/create/:boardId",
  passport.authenticate("jwt", { session: false }),
  createList
);
router.put(
  "/update/:listId",
  passport.authenticate("jwt", { session: false }),
  updateList
);
router.delete(
  "/delete/:listId",
  passport.authenticate("jwt", { session: false }),
  deleteList
);
export default router;
