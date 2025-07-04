import { DataTypes } from "sequelize";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Boards", "isCollaborationEnabled", {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  await queryInterface.addColumn("Boards", "shareCode", {
    type: Sequelize.STRING,
    unique: true,
    allowNull: true,
  });

  await queryInterface.addColumn("Boards", "collaborators", {
    type: Sequelize.JSON,
    defaultValue: [],
    allowNull: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Boards", "isCollaborationEnabled");
  await queryInterface.removeColumn("Boards", "shareCode");
  await queryInterface.removeColumn("Boards", "collaborators");
}
