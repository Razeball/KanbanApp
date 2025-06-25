import dotenv from "dotenv";
import Sequelize from "sequelize";
import configFile from "../config/config.js";
import User from "./user.js";
import Board from "./board.js";
import List from "./list.js";
import Card from "./card.js";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const config = configFile[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    ...config,
    logging: false,
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: false,
  });
}

db.User = User.init(sequelize, Sequelize.DataTypes);
db.Board = Board.init(sequelize, Sequelize.DataTypes);
db.List = List.init(sequelize, Sequelize.DataTypes);
db.Card = Card.init(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
