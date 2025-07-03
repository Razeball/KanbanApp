import { Model, DataTypes, INTEGER, UUID, UUIDV1 } from "sequelize";

export default class Card extends Model {
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
        description: DataTypes.STRING,
        order: DataTypes.INTEGER,
        listId: DataTypes.STRING,
      },
      {
        sequelize,
        modelName: "Card",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.List, { foreignKey: "listId" });
  }
}
