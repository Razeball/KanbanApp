import db from "../models/database.js";
import {
  checkBoardAccessByListId,
  checkBoardAccessByCardId,
} from "../utils/boardAccess.js";
const { Board, List, Card, sequelize } = db;

export const createCard = async (req, res) => {
  const { listId } = req.params;
  const { title, description } = req.body;
  const userId = req.user?.id;
  try {
    const accessCheck = await checkBoardAccessByListId(listId, userId);

    if (!accessCheck.hasAccess) {
      const statusCode =
        accessCheck.error === "List or board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

    const cardOrder = await Card.findAll({ where: { listId } });
    const card = await Card.create({
      title,
      description,
      listId,
      order: cardOrder.length,
    });
    return res.status(201).json(card);
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to create the card",
      details: error.message,
    });
  }
};
export const updateCard = async (req, res) => {
  const { cardId } = req.params;
  const { title, description } = req.body;
  try {
    const accessCheck = await checkBoardAccessByCardId(cardId, req.user?.id);

    if (!accessCheck.hasAccess) {
      const statusCode =
        accessCheck.error === "Card, list, or board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

    const card = await Card.findByPk(cardId);
    card.set({
      title,
      description,
    });
    await card.save();
    return res.status(200).json(card);
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to update the card",
      details: error.message,
    });
  }
};

export const deleteCard = async (req, res) => {
  const { cardId } = req.params;
  try {
    const accessCheck = await checkBoardAccessByCardId(cardId, req.user?.id);

    if (!accessCheck.hasAccess) {
      const statusCode =
        accessCheck.error === "Card, list, or board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: accessCheck.error });
    }

    const card = await Card.findByPk(cardId);
    await card.destroy();
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to update the card",
      details: error.message,
    });
  }
};

export const moveCard = async (req, res) => {
  const { cardId } = req.params;
  const { newListId, newOrder } = req.body;
  try {
    const cardAccessCheck = await checkBoardAccessByCardId(
      cardId,
      req.user?.id
    );
    const listAccessCheck = await checkBoardAccessByListId(
      newListId,
      req.user?.id
    );

    if (!cardAccessCheck.hasAccess) {
      const statusCode =
        cardAccessCheck.error === "Card, list, or board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: cardAccessCheck.error });
    }

    if (!listAccessCheck.hasAccess) {
      const statusCode =
        listAccessCheck.error === "List or board not found" ? 404 : 403;
      return res.status(statusCode).json({ message: listAccessCheck.error });
    }

    await sequelize.transaction(async (t) => {
      const oldCard = await Card.findByPk(cardId, {
        transaction: t,
        include: [
          {
            model: List,
            required: true,
            attributes: ["id"],
          },
        ],
      });

      const newList = await List.findOne({
        transaction: t,
        where: { id: newListId },
        include: [{ model: Card, required: false }],
      });

      const oldList = await List.findOne({
        transaction: t,
        where: { id: oldCard.List.id },
        include: [{ model: Card, required: true }],
      });

      oldList.Cards.forEach(async (element) => {
        if (element.order > oldCard.order) {
          element.set({
            order: element.order - 1,
          });
          await element.save({ transaction: t });
        }
      });
      newList.Cards.forEach(async (element) => {
        if (element.order >= newOrder) {
          element.set({
            order: element.order + 1,
          });
          await element.save({ transaction: t });
        }
      });

      oldCard.set({
        order: newOrder,
        listId: newListId,
      });
      await oldCard.save({ transaction: t });
      return res
        .status(200)
        .json({ id: oldCard.id, listId: oldCard.listId, order: oldCard.order });
    });
  } catch (error) {
    return res.status(500).json({
      message: "There was an error trying to move the card",
      details: error.message,
    });
  }
};
