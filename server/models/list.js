import { Model, DataTypes, INTEGER, UUID, UUIDV1 } from "sequelize";

export default class List extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.STRING,
          defaultValue: DataTypes.UUIDV1,
          primaryKey: true,
          allowNull: false,
        },
        title: DataTypes.STRING,
        order: DataTypes.INTEGER,
        boardId: DataTypes.STRING,
      },
      {
        sequelize,
        modelName: "List",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Board, { foreignKey: "boardId" });
    this.hasMany(models.Card, { foreignKey: "listId" });
  }
}
