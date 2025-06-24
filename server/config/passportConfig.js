import { Strategy as localStrategy } from "passport-local";
import passport from "passport";
import User from "../models/user.js";
import bcrypt from "bcrypt";

passport.use(
  new localStrategy(
    { usernameField: "login" },
    async (login, password, done) => {
      try {
        let user;
        if (login.includes("@")) {
          user = await User.findOne({ where: { email: login } });
        } else {
          user = await User.findOne({ where: { username: login } });
        }

        if (!user) {
          return done(null, false, {
            message: `Incorrect email or username ${user}`,
          });
        }
        if (await bcrypt.compare(password, user.password)) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Incorrect password" });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);
export default passport;
