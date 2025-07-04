import { Router } from "express";
import passport from "passport";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {
  createList,
  deleteList,
  updateList,
} from "../controllers/listController.js";
const router = Router();

router.post("/create/:boardId", optionalAuth, createList);
router.put("/update/:listId", optionalAuth, updateList);
router.delete("/delete/:listId", optionalAuth, deleteList);
export default router;
