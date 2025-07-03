import db from "../models/database.js";
import jwt from "jsonwebtoken";
const { Board, List, Card } = db;
export const createBoard = async (req, res) => {
  const { id } = req.user;
  const { title } = req.body;
  try {
    const newBoard = await Board.create({
      title,
      userId: id,
    });
    return res.status(201).json({ newBoard });
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to create the board",
      details: error.message,
    });
  }
};

export const createCompleteBoard = async (req, res) => {
  const { id } = req.user;
  const { id: boardId, title, Lists = [] } = req.body;

  try {
    const boardData = {
      title,
      userId: id,
    };

    if (boardId) {
      const existingBoard = await Board.findOne({
        where: { id: boardId, userId: id },
        include: [
          {
            model: List,
            order: [["order", "ASC"]],
            include: [{ model: Card, order: [["order", "ASC"]] }],
          },
        ],
      });

      if (existingBoard) {
        console.log(
          `Board with ID ${boardId} already exists, returning existing board`
        );
        return res.status(200).json(existingBoard);
      }

      boardData.id = boardId;
    }

    const newBoard = await Board.create(boardData);

    for (const listData of Lists) {
      const listCreateData = {
        title: listData.title || listData.name,
        order: listData.order || 0,
        boardId: newBoard.id,
      };

      if (listData.id) {
        listCreateData.id = listData.id;
      }

      const newList = await List.create(listCreateData);

      if (listData.Cards && listData.Cards.length > 0) {
        for (const cardData of listData.Cards) {
          const cardCreateData = {
            title: cardData.title,
            description: cardData.description || "",
            order: cardData.order || 0,
            listId: newList.id,
          };

          if (cardData.id) {
            cardCreateData.id = cardData.id;
          }

          await Card.create(cardCreateData);
        }
      }
    }

    const completeBoard = await Board.findOne({
      where: { id: newBoard.id },
      include: [
        {
          model: List,
          order: [["order", "ASC"]],
          include: [{ model: Card, order: [["order", "ASC"]] }],
        },
      ],
    });

    return res.status(201).json(completeBoard);
  } catch (error) {
    console.error("Error creating complete board:", error);
    console.error("Error details:", error.message);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ error: "Board with this ID already exists" });
    }

    return res.status(500).json({
      message: "There was an error trying to create the complete board",
      details: error.message,
    });
  }
};

export const getBoards = async (req, res) => {
  const user = req.user;
  try {
    const boards = await Board.findAll({ where: { userId: user.id } });
    if (!boards) {
      return res
        .status(404)
        .json({ message: "You don't have any board yet, create one" });
    }
    return res.status(200).json(boards);
  } catch (error) {
    return res.status(500).json({
      message: "An error has occured trying to get the boards",
      details: error.message,
    });
  }
};

export const getBoardById = async (req, res) => {
  const userId = req.user.id;
  const boardId = req.params.id;

  try {
    const board = await Board.findOne({
      where: { id: boardId, userId },
      include: [
        {
          model: List,
          order: [["order", "ASC"]],
          include: [{ model: Card, order: [["order", "ASC"]] }],
        },
      ],
    });
    if (!board) {
      return res
        .status(404)
        .json({ message: "You don't have any board yet, create one" });
    }
    return res.status(200).json(board);
  } catch (error) {
    return res.status(500).json({
      message: "An error has occured trying to get the board",
      details: error.message,
    });
  }
};

export const updateBoard = async (req, res) => {
  const userId = req.user.id;
  const boardId = req.params.id;
  const { title } = req.body;

  try {
    const board = await Board.findOne({
      where: { id: boardId, userId },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    board.title = title;
    await board.save();

    return res.status(200).json(board);
  } catch (error) {
    return res.status(500).json({
      message: "An error has occurred trying to update the board",
      details: error.message,
    });
  }
};

export const deleteBoard = async (req, res) => {
  const userId = req.user.id;
  const boardId = req.params.id;
  try {
    const board = await Board.findOne({
      where: { id: boardId, userId },
    });
    if (!board) {
      return res.status(404).json({ message: "The board don't exist" });
    }
    await board.destroy();
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({
      message: "An error has occured trying to get the board",
      details: error.message,
    });
  }
};

export const overwriteBoard = async (req, res) => {
  const { id } = req.user;
  const { id: boardId } = req.params;
  const { title, Lists = [] } = req.body;

  try {
    const existingBoard = await Board.findOne({
      where: { id: boardId, userId: id },
    });

    if (!existingBoard) {
      return res.status(404).json({
        message: "Board not found or you don't have permission to access it",
      });
    }

    const existingLists = await List.findAll({
      where: { boardId: boardId },
      include: [{ model: Card }],
    });

    for (const list of existingLists) {
      if (list.Cards && list.Cards.length > 0) {
        await Card.destroy({
          where: { listId: list.id },
        });
      }
      await List.destroy({
        where: { id: list.id },
      });
    }

    existingBoard.title = title;
    await existingBoard.save();

    for (const listData of Lists) {
      const listCreateData = {
        title: listData.title || listData.name,
        order: listData.order || 0,
        boardId: boardId,
      };

      if (listData.id) {
        listCreateData.id = listData.id;
      }

      const newList = await List.create(listCreateData);

      if (listData.Cards && listData.Cards.length > 0) {
        for (const cardData of listData.Cards) {
          const cardCreateData = {
            title: cardData.title,
            description: cardData.description || "",
            order: cardData.order || 0,
            listId: newList.id,
          };

          if (cardData.id) {
            cardCreateData.id = cardData.id;
          }

          await Card.create(cardCreateData);
        }
      }
    }

    const completeBoard = await Board.findOne({
      where: { id: boardId },
      include: [
        {
          model: List,
          order: [["order", "ASC"]],
          include: [{ model: Card, order: [["order", "ASC"]] }],
        },
      ],
    });

    return res.status(200).json(completeBoard);
  } catch (error) {
    console.error("Error overwriting board:", error);
    console.error("Error details:", error.message);

    return res.status(500).json({
      message: "There was an error trying to overwrite the board",
      details: error.message,
    });
  }
};
