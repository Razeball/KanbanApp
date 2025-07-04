import db from "../models/database.js";
const { Board } = db;

export const checkBoardAccess = async (boardId, userId) => {
  try {
    const board = await Board.findOne({
      where: { id: boardId },
    });

    if (!board) {
      return { hasAccess: false, board: null, error: "Board not found" };
    }

    if (!userId) {
      const hasAccess = board.isCollaborationEnabled;
      return {
        hasAccess,
        board,
        isOwner: false,
        isCollaborator: hasAccess,
        error: hasAccess
          ? null
          : "You don't have permission to access this board",
      };
    }

    const isOwner = board.userId === userId;
    const isCollaborator =
      board.collaborators &&
      board.collaborators.some((collaborator) => collaborator.id === userId);
    const hasCollaborationAccess =
      board.isCollaborationEnabled && (isOwner || isCollaborator);

    const hasAccess =
      isOwner || hasCollaborationAccess || board.isCollaborationEnabled;

    return {
      hasAccess,
      board,
      isOwner,
      isCollaborator:
        !isOwner && (isCollaborator || board.isCollaborationEnabled),
      error: hasAccess
        ? null
        : "You don't have permission to access this board",
    };
  } catch (error) {
    return { hasAccess: false, board: null, error: error.message };
  }
};

export const checkBoardAccessByListId = async (listId, userId) => {
  try {
    const List = db.List;
    const list = await List.findOne({
      where: { id: listId },
      include: [{ model: Board }],
    });

    if (!list || !list.Board) {
      return {
        hasAccess: false,
        board: null,
        error: "List or board not found",
      };
    }

    return await checkBoardAccess(list.Board.id, userId);
  } catch (error) {
    return { hasAccess: false, board: null, error: error.message };
  }
};

export const checkBoardAccessByCardId = async (cardId, userId) => {
  try {
    const Card = db.Card;
    const List = db.List;

    const card = await Card.findOne({
      where: { id: cardId },
      include: [
        {
          model: List,
          include: [{ model: Board }],
        },
      ],
    });

    if (!card || !card.List || !card.List.Board) {
      return {
        hasAccess: false,
        board: null,
        error: "Card, list, or board not found",
      };
    }

    return await checkBoardAccess(card.List.Board.id, userId);
  } catch (error) {
    return { hasAccess: false, board: null, error: error.message };
  }
};
