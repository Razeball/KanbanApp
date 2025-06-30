import db from "../models/database.js";
const { Board, List, Card } = db;

export const createList = async (req, res) => {
  const { boardId } = req.params;
  const { title } = req.body;
  try {
    const board = await Board.findOne({
      where: { id: boardId, userId: req.user.id },
    });
    if (!board)
      return res
        .status(403)
        .json({ message: "You are unauthorized to get this list" });
    const listOrder = await List.findAll({ where: { boardId } });
    const newList = await List.create({
      title,
      boardId,
      order: listOrder.length,
    });
    return res.status(201).json(newList);
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to create the list",
      deatils: error.message,
    });
  }
};

export const updateList = async (req, res) => {
  const { listId } = req.params;
  const { title } = req.body;
  try {
    const list = await List.findOne({
      where: { id: listId },
      include: [{ model: Board, where: { userId: req.user.id } }],
    });
    if (list.Board.userId !== req.user.id)
      return res
        .status(403)
        .json({ message: "You are unauthorized to update this list" });
    list.set({
      title,
    });
    await list.save();
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to update the list",
      deatils: error.message,
    });
  }
};

export const deleteList = async (req, res) => {
  const { listId } = req.params;
  try {
    const list = await List.findOne({
      where: { id: listId },
      include: [{ model: Board, where: { userId: req.user.id } }],
    });
    if (list.Board.userId !== req.user.id)
      return res
        .status(403)
        .json({ message: "You are unauthorized to update this list" });
    await list.destroy();
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to delete the list",
      deatils: error.message,
    });
  }
};
