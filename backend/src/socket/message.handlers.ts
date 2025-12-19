import { Server, Socket } from "socket.io";

export function registerMessageHandlers(io: Server, socket: Socket) {
  socket.on("chat:join", (chatId: string) => {
    socket.join(`chat:${chatId}`);
    console.log(`User ${socket.data.userId} joined chat ${chatId}`);
  });

  socket.on("chat:leave", (chatId: string) => {
    socket.leave(`chat:${chatId}`);
  });

  socket.on("typing:start", (chatId: string) => {
    socket.to(`chat:${chatId}`).emit("typing:start", {
      userId: socket.data.userId,
    });
  });

  socket.on("typing:stop", (chatId: string) => {
    socket.to(`chat:${chatId}`).emit("typing:stop", {
      userId: socket.data.userId,
    });
  });
}
