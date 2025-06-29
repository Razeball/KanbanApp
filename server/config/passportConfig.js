import { Strategy as localStrategy } from "passport-local";
import { ExtractJwt, Strategy as jwtStrategy } from "passport-jwt";
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
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.token;
  }
  return token;
};

const opt = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new jwtStrategy(opt, async (jwt_payload, done) => {
    try {
      const foundUser = await User.findOne({
        where: { id: jwt_payload.id },
      });
      if (foundUser) {
        return done(null, {
          id: foundUser.id,
          email: foundUser.email,
          username: foundUser.username,
        });
      } else {
        return done(null, false);
      }
    } catch (error) {
      done(error);
    }
  })
);

export default passport;
