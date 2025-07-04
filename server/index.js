import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import db from "./models/database.js";
dotenv.config();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const boardRooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-board", ({ boardId, shareCode, user }) => {
    const room = boardRooms.get(boardId) || {
      users: new Map(),
      shareCode: shareCode,
      maxUsers: 3,
    };

    if (room.users.size >= room.maxUsers) {
      socket.emit("join-error", {
        message: "Board is full (max 3 collaborators)",
      });
      return;
    }

    if (room.shareCode && room.shareCode !== shareCode) {
      socket.emit("join-error", { message: "Invalid share code" });
      return;
    }

    const userData = {
      id: user?.id || socket.id,
      username: user?.username || "Anonymous",
      isAuthenticated: !!user?.username,
    };

    room.users.set(socket.id, userData);

    boardRooms.set(boardId, room);
    socket.join(boardId);
    socket.boardId = boardId;

    socket.emit("join-success", {
      boardId,
      collaborators: Array.from(room.users.values()),
    });

    socket.to(boardId).emit("user-joined", {
      user: room.users.get(socket.id),
      collaborators: Array.from(room.users.values()),
    });

    console.log(
      `User ${user?.username || "Anonymous"} joined board ${boardId}`
    );
  });

  socket.on("leave-board", ({ boardId }) => {
    const room = boardRooms.get(boardId);
    if (room && room.users.has(socket.id)) {
      const user = room.users.get(socket.id);
      room.users.delete(socket.id);

      if (room.users.size === 0) {
        boardRooms.delete(boardId);
      } else {
        socket.to(boardId).emit("user-left", {
          user: user,
          collaborators: Array.from(room.users.values()),
        });
      }

      socket.leave(boardId);
      socket.boardId = null;
      console.log(`User ${user.username} left board ${boardId}`);
    }
  });

  socket.on("board-updated", ({ boardId, board }) => {
    socket.to(boardId).emit("board-updated", { board });
  });

  socket.on("list-created", ({ boardId, list }) => {
    socket.to(boardId).emit("list-created", { list });
  });

  socket.on("list-updated", ({ boardId, list }) => {
    socket.to(boardId).emit("list-updated", { list });
  });

  socket.on("list-deleted", ({ boardId, listId }) => {
    socket.to(boardId).emit("list-deleted", { listId });
  });

  socket.on("card-created", ({ boardId, card }) => {
    socket.to(boardId).emit("card-created", { card });
  });

  socket.on("card-updated", ({ boardId, card }) => {
    socket.to(boardId).emit("card-updated", { card });
  });

  socket.on("card-deleted", ({ boardId, cardId }) => {
    socket.to(boardId).emit("card-deleted", { cardId });
  });

  socket.on(
    "card-moved",
    ({ boardId, cardId, fromListId, toListId, newOrder }) => {
      socket
        .to(boardId)
        .emit("card-moved", { cardId, fromListId, toListId, newOrder });
    }
  );

  socket.on("collaboration-message", ({ boardId, message }) => {
    socket.to(boardId).emit("collaboration-message", { message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.boardId) {
      const room = boardRooms.get(socket.boardId);
      if (room && room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        room.users.delete(socket.id);

        if (room.users.size === 0) {
          boardRooms.delete(socket.boardId);
        } else {
          socket.to(socket.boardId).emit("user-left", {
            user: user,
            collaborators: Array.from(room.users.values()),
          });
        }

        console.log(
          `User ${user.username} disconnected from board ${socket.boardId}`
        );
      }
    }
  });
});

const main = async () => {
  try {
    httpServer.listen(process.env.PORT || 2000, () => {
      console.log("Server listening on port", process.env.PORT || 2000);
    });
  } catch (error) {
    console.error(error);
  }
};

main();
