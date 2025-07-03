import express from "express";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(passport.initialize());
import "./config/passportConfig.js";

app.use("/auth", authRoutes);
app.use("/board", boardRoutes);
app.use("/list", listRoutes);
app.use("/card", cardRoutes);
app.use("/document", documentRoutes);

export default app;
