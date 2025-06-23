import dotenv from "dotenv";
dotenv.config();
import express from "express";
import database from "./models/database.js";

const app = express();

const main = async () => {
  try {
    database.sequelize.authenticate();
    app.listen(process.env.PORT || 3000, () => {
      console.log("Server listening on port", process.env.PORT);
    });
  } catch (error) {
    console.error(error);
  }
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

main();
