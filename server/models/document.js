import { Model, DataTypes } from "sequelize";

export default class Document extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          allowNull: false,
          type: DataTypes.STRING,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: "",
        },
        tags: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        userId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: "Users",
            key: "id",
          },
        },
      },
      {
        sequelize,
        modelName: "Document",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: "userId" });
  }
}
