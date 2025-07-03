import { Model, DataTypes } from "sequelize";

export default class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          allowNull: false,
          type: DataTypes.STRING,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: DataTypes.STRING,
        username: DataTypes.STRING,
        password: DataTypes.STRING,
      },
      {
        sequelize,
        modelName: "User",
      }
    );
  }

  static associate(models) {
    this.hasMany(models.Board, { foreignKey: "userId" });
    this.hasMany(models.Document, { foreignKey: "userId" });
  }
}
