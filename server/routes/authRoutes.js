import { Router } from "express";
import {
  getProfile,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import passport from "passport";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  getProfile
);
router.get("/logout", logout);

export default router;
