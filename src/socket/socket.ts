import { Server } from "socket.io";
import { Server as HttpServer } from "http";

import teamSocketHandler from "@socket/spaces/team.space";
import messagesSocketHandler from "@socket/spaces/messages.space";

import authMethod from "@methods/auth.method";

import { SocketEvent, SocketEventDefault } from "@utils/constant";

import { SocketType } from "@socket/types";

const authMiddleware = async (socket: SocketType, next: (err?: Error) => void) => {
  const { userId, name, email, accessToken } = socket.handshake.auth;

  const { error, payload } = await authMethod.verifyToken(accessToken);
  if (error) return next(new Error(error));

  socket.userId = userId;
  socket.name = name;
  socket.email = email;
  socket.accessToken = accessToken;

  // notify authenticated to client
  socket.emit(SocketEvent.ON_AUTHENTICATED, { authenticated: true });

  socket.timeoutTokenId = setTimeout(() => {
    // notify token is expired to client
    socket.emit(SocketEvent.ON_ATOKEN_EXPIRED);
    socket.disconnect();
  }, payload.exp * 1000 - Date.now());

  // clear timeout after disconnect
  socket.on(SocketEventDefault.DISCONNECT, () => {
    socket.broadcast.emit(SocketEvent.ON_USER_OFFLINE, socket.userId);
    if (socket.timeoutTokenId) clearTimeout(socket.timeoutTokenId);
  });
  next();
};

const logger = (socket: SocketType, next: () => void) => {
  if (process.env.NODE_ENV === "development") {
    socket.use(([event, ...args], next) => {
      console.group("\x1b[33m%s\x1b[0m", event);
      console.log(...args);
      console.groupEnd();

      next();
    });
  }

  next();
};

export const setupSocket = (httpServer: HttpServer) => {
  (global as any).io = new Server(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production" ? "https://slack-clone.cf" : "http://localhost:3000",
      credentials: true,
    },
  });

  (global as any).io.teams = {};

  teamSocketHandler().use(authMiddleware).use(logger);
  messagesSocketHandler().use(authMiddleware).use(logger);
};
