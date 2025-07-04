import dotenv from "dotenv";
import Sequelize from "sequelize";
import configFile from "../config/config.js";
import User from "./user.js";
import Board from "./board.js";
import List from "./list.js";
import Card from "./card.js";
import Document from "./document.js";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const config = configFile[env];

const db = {};

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    ...config,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      },
    },
  });
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    ...config,
    logging: false,
    dialectOptions: {
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              require: true,
              rejectUnauthorized: false,
              checkServerIdentity: () => undefined,
            }
          : false,
    },
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: false,
    dialectOptions: {
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              require: true,
              rejectUnauthorized: false,
              checkServerIdentity: () => undefined,
            }
          : false,
    },
  });
}

db.User = User.init(sequelize, Sequelize.DataTypes);
db.Board = Board.init(sequelize, Sequelize.DataTypes);
db.List = List.init(sequelize, Sequelize.DataTypes);
db.Card = Card.init(sequelize, Sequelize.DataTypes);
db.Document = Document.init(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

export default db;
