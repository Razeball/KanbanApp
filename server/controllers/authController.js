import User from "../models/user.js";
import bcrypt from "bcrypt";

export const register = async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const userEmail = await User.findOne({ where: { email } });
    const user = await User.findOne({ where: { username } });
    if (userEmail) {
      return res.status(400).json({ message: "That email already exist" });
    } else if (user) {
      return res.status(400).json({ message: "That user already exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      username,
    });
    return res
      .status(201)
      .json({ email: newUser.email, username: newUser.username });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "There was an error", details: error.message });
  }
};
