import passport from "passport";

export const optionalAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    req.user = user || null;
    next();
  })(req, res, next);
};
