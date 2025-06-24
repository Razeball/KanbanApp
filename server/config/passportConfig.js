import { Strategy as localStrategy } from "passport-local";
import passport from "passport";
import User from "../models/user.js";
import bcrypt from "bcrypt";

passport.use(
  new localStrategy(async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return done(null, false, { message: "Incorrect email" });
      }
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Incorrect password" });
      }
    } catch (error) {}
  })
);
export default passport;
