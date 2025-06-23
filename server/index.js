import dotenv from "dotenv";
import app from "./app.js";
import db from "./models/database.js";
dotenv.config();

const main = async () => {
  try {
    app.listen(process.env.PORT || 3000, () => {
      console.log("Server listening on port", process.env.PORT);
    });
  } catch (error) {
    console.error(error);
  }
};

main();
