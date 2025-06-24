import User from "../models/user.js";
import bcrypt from "bcrypt";
import passport from "passport";
import passportCheck from "../config/passportConfig.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const userEmail = await User.findOne({ where: { email } });
    const user = await User.findOne({ where: { username } });
    if (userEmail) {
      return res.status(409).json({ message: "That email already exist" });
    } else if (user) {
      return res.status(409).json({ message: "That user already exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      username,
    });
    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "There was an error", details: error.message });
  }
};
export const login = (req, res) => {
  const { email, password } = req.body;
  try {
    passport.authenticate("local");
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error has occured", details: error.message });
  }
};
