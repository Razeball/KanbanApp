import express from "express";
import cors from "cors";
import passport from "passport";

import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";

const app = express();

app.use(express.json());
app.use(passport.initialize());
import "./config/passportConfig.js";

app.use("/auth", authRoutes);
app.use("/board", boardRoutes);
app.use("/list", listRoutes);

export default app;
