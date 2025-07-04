import db from "../models/database.js";
import {
  checkBoardAccess,
  checkBoardAccessByListId,
} from "../utils/boardAccess.js";
const { Board, List, Card } = db;

export const createList = async (req, res) => {
  const { boardId } = req.params;
  const { title } = req.body;
  try {
    const accessCheck = await checkBoardAccess(boardId, req.user?.id);

    if (!accessCheck.hasAccess) {
      const statusCode = accessCheck.error === "Board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

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
    const accessCheck = await checkBoardAccessByListId(listId, req.user?.id);

    if (!accessCheck.hasAccess) {
      const statusCode =
        accessCheck.error === "List or board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

    const list = await List.findOne({
      where: { id: listId },
    });

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
    const accessCheck = await checkBoardAccessByListId(listId, req.user?.id);

    if (!accessCheck.hasAccess) {
      const statusCode =
        accessCheck.error === "List or board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

    const list = await List.findOne({
      where: { id: listId },
    });

    await list.destroy();
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to delete the list",
      deatils: error.message,
    });
  }
};
