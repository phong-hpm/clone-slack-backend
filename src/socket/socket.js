import { Server } from "socket.io";

export let io;

export const setupSocket = (httpServer) => {
  io = new Server(httpServer, {
    cookie: true,
    cors: { origin: "http://localhost:3000" },
  });
};
