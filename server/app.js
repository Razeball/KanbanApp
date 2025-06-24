import express from "express";
import cors from "cors";
import passport from "passport";

import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(express.json());
app.use(passport.initialize());
import "./config/passportConfig.js";

app.use("/auth", authRoutes);

export default app;
