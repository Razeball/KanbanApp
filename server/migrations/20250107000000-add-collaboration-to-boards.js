export default {
  async up(queryInterface, Sequelize) {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Boards", "isCollaborationEnabled");
    await queryInterface.removeColumn("Boards", "shareCode");
    await queryInterface.removeColumn("Boards", "collaborators");
  },
};
