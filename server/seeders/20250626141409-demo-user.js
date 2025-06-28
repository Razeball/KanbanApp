"use strict";
import bcrypt from "bcrypt";

/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface, Sequelize) => {
  const hashedPassword = await bcrypt.hash("test123", 10);

  await queryInterface.bulkInsert(
    "Users",
    [
      {
        email: "test@test.com",
        username: "test",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    {}
  );
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.bulkDelete(
    "Users",
    {
      email: "test@test.com",
    },
    {}
  );
};
