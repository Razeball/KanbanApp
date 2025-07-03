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

router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    try {
      res.json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
