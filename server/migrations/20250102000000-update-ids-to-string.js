"use strict";

import { DataTypes } from "sequelize";

export const up = async (queryInterface, Sequelize) => {
  try {
    try {
      await queryInterface.removeConstraint(
        "Documents",
        "Documents_userId_fkey"
      );
    } catch (e) {}
    try {
      await queryInterface.removeConstraint("Boards", "Boards_userId_fkey");
    } catch (e) {}
    try {
      await queryInterface.removeConstraint("Lists", "Lists_boardId_fkey");
    } catch (e) {}
    try {
      await queryInterface.removeConstraint("Cards", "Cards_listId_fkey");
    } catch (e) {}

    await queryInterface.changeColumn("Users", "id", {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    });

    await queryInterface.changeColumn("Documents", "id", {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    });

    await queryInterface.changeColumn("Documents", "userId", {
      type: DataTypes.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn("Boards", "id", {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    });

    await queryInterface.changeColumn("Boards", "userId", {
      type: DataTypes.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn("Lists", "id", {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    });

    await queryInterface.changeColumn("Lists", "boardId", {
      type: DataTypes.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn("Cards", "id", {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    });

    await queryInterface.changeColumn("Cards", "listId", {
      type: DataTypes.STRING,
      allowNull: false,
    });
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  console.log("Rollback not implemented for this migration");
};
