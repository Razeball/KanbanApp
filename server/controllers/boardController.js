import db from "../models/database.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { checkBoardAccess } from "../utils/boardAccess.js";
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
  const userId = req.user?.id;
  const boardId = req.params.id;

  try {
    const accessCheck = await checkBoardAccess(boardId, userId);

    if (!accessCheck.hasAccess) {
      const statusCode = accessCheck.error === "Board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

    const board = await Board.findOne({
      where: { id: boardId },
      include: [
        {
          model: List,
          order: [["order", "ASC"]],
          include: [{ model: Card, order: [["order", "ASC"]] }],
        },
      ],
    });

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
    const accessCheck = await checkBoardAccess(boardId, userId);

    if (!accessCheck.hasAccess) {
      const statusCode = accessCheck.error === "Board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

    const board = accessCheck.board;
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
    const accessCheck = await checkBoardAccess(boardId, userId);

    if (!accessCheck.hasAccess) {
      const statusCode = accessCheck.error === "Board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

    if (!accessCheck.isOwner) {
      return res
        .status(403)
        .json({ message: "Only the board owner can delete the board" });
    }

    const board = accessCheck.board;
    await board.destroy();
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({
      message: "An error has occured trying to delete the board",
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

export const enableCollaboration = async (req, res) => {
  const userId = req.user.id;
  const boardId = req.params.id;

  try {
    const board = await Board.findOne({
      where: { id: boardId, userId },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const shareCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    board.isCollaborationEnabled = true;
    board.shareCode = shareCode;
    board.collaborators = [];
    await board.save();

    return res.status(200).json({
      message: "Collaboration enabled",
      shareCode: shareCode,
      board: board,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error enabling collaboration",
      details: error.message,
    });
  }
};

export const disableCollaboration = async (req, res) => {
  const userId = req.user.id;
  const boardId = req.params.id;

  try {
    const board = await Board.findOne({
      where: { id: boardId, userId },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    board.isCollaborationEnabled = false;
    board.shareCode = null;
    board.collaborators = [];
    await board.save();

    return res.status(200).json({
      message: "Collaboration disabled",
      board: board,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error disabling collaboration",
      details: error.message,
    });
  }
};

export const generateNewShareCode = async (req, res) => {
  const userId = req.user.id;
  const boardId = req.params.id;

  try {
    const board = await Board.findOne({
      where: { id: boardId, userId },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    if (!board.isCollaborationEnabled) {
      return res
        .status(400)
        .json({ message: "Collaboration is not enabled for this board" });
    }

    const shareCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    board.shareCode = shareCode;
    await board.save();

    return res.status(200).json({
      message: "New share code generated",
      shareCode: shareCode,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error generating new share code",
      details: error.message,
    });
  }
};

export const getBoardByShareCode = async (req, res) => {
  const { shareCode } = req.params;

  try {
    const board = await Board.findOne({
      where: { shareCode: shareCode, isCollaborationEnabled: true },
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
        .json({ message: "Board not found or collaboration not enabled" });
    }

    return res.status(200).json(board);
  } catch (error) {
    return res.status(500).json({
      message: "Error getting board by share code",
      details: error.message,
    });
  }
};

export const joinBoard = async (req, res) => {
  const { shareCode } = req.body;
  const user = req.user;

  try {
    const board = await Board.findOne({
      where: { shareCode: shareCode, isCollaborationEnabled: true },
    });

    if (!board) {
      return res
        .status(404)
        .json({ message: "Invalid share code or collaboration not enabled" });
    }

    const collaborators = board.collaborators || [];

    if (collaborators.length >= 3) {
      return res
        .status(400)
        .json({ message: "Board is full (max 3 collaborators)" });
    }

    const userInfo = {
      id: user?.id || crypto.randomUUID(),
      username: user?.username || "Anonymous",
      isAuthenticated: !!user?.username,
      joinedAt: new Date().toISOString(),
    };

    const existingIndex = collaborators.findIndex((c) => c.id === userInfo.id);
    if (existingIndex === -1) {
      collaborators.push(userInfo);
      board.collaborators = collaborators;
      await board.save();
    }

    return res.status(200).json({
      message: "Successfully joined board",
      board: board,
      collaborators: collaborators,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error joining board",
      details: error.message,
    });
  }
};
