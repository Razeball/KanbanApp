import { DataTypes } from "sequelize";

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
  );
  await queryInterface.createTable("Users", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("uuid_generate_v4()"),
      allowNull: false,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  });

  await queryInterface.addIndex("Users", ["email"]);
  await queryInterface.addIndex("Users", ["username"]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("Users");
}
