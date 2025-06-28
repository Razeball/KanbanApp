import User from "../models/user.js";
import bcrypt from "bcrypt";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

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
export const login = (req, res, next) => {
  try {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err) {
        return res.status(500).json({
          message: "An error ocurred with the authentication",
          details: err.message,
        });
      }
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", details: info });
      }

      const payload = {
        email: user.email,
        username: user.username,
        id: user.id,
      };
      const secret = process.env.JWT_SECRET;
      const token = jwt.sign(payload, secret, {
        expiresIn: "1d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({ success: true });
    })(req, res, next);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error has occured", details: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ success: true });
};

export const getProfile = (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ authenticated: true, user: payload });
  } catch (error) {
    return res.status(401).json({ authenticated: false });
  }
};
