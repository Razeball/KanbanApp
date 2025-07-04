import express from "express";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:4200";
const allowedOrigins = corsOrigin.split(",").map((origin) => origin.trim());

console.log("CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes("*")
      ) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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

// Add debugging for API routes
app.use((req, res, next) => {
  if (
    req.path.startsWith("/auth") ||
    req.path.startsWith("/board") ||
    req.path.startsWith("/list") ||
    req.path.startsWith("/card") ||
    req.path.startsWith("/document")
  ) {
    console.log(
      `API Request: ${req.method} ${req.path} - Origin: ${
        req.headers.origin
      } - User: ${req.user ? req.user.id : "anonymous"}`
    );
  }
  next();
});

app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(
    __dirname,
    "../client/kanban/dist/kanban/browser"
  );
  const indexPath = path.join(
    __dirname,
    "../client/kanban/dist/kanban/browser/index.html"
  );

  // Check if build files exist
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));

    app.get("*", (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error("Angular build files not found. Serving API only.");
        res.status(404).json({
          error: "Frontend not built",
          message:
            "Angular application build files are missing. Please check the build process.",
        });
      }
    });
  } else {
    console.error("Angular build directory not found:", staticPath);
    app.get("*", (req, res) => {
      res.status(404).json({
        error: "Frontend not built",
        message:
          "Angular application build files are missing. Please check the build process.",
      });
    });
  }
}

export default app;
