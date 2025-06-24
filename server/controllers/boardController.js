import db from "../models/database.js";
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

export const getBoards = async (req, res) => {
  const { id } = req.user;
  try {
    const boards = await Board.findAll({ where: { userId: id } });
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
      include: [{ model: List, include: [{ model: Card }] }],
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
