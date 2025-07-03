import { Router } from "express";
import passport from "passport";
import {
  createDocument,
  overwriteDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";

const router = Router();

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createDocument
);

router.put(
  "/overwrite/:id",
  passport.authenticate("jwt", { session: false }),
  overwriteDocument
);

router.get("/", passport.authenticate("jwt", { session: false }), getDocuments);

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  getDocument
);

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  updateDocument
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteDocument
);

export default router;
