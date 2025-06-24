import { Model, DataTypes, INTEGER } from "sequelize";

export default class Board extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          allowNull: false,
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        title: DataTypes.STRING,
        userId: DataTypes.UUID,
      },
      {
        sequelize,
        modelName: "Board",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: "userId" });
    this.hasMany(models.List, { foreignKey: "boardId" });
  }
}
