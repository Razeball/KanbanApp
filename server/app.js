import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  console.log(req);
});

export default app;
