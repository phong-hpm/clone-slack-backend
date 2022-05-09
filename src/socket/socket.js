import { Server } from "socket.io";

import teamSocketHandler from "./spaces/team.space.js";

import messagesSocketHandler from "./spaces/messages.space.js";

import * as authMethods from "../methods/auth.method.js";
import { SocketEvent, SocketEventDefault } from "../utils/constant.js";

const authMiddleware = async (socket, next) => {
  const { userId, name, email, accessToken } = socket.handshake.auth;

  const { error, payload } = await authMethods.verifyToken(accessToken);
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
    if (socket.timeoutTokenId) clearTimeout(socket.timeoutTokenId);
    socket.emit(SocketEvent.ON_USER_OFFLINE, socket.userId);
  });
  next();
};

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "http://localhost:3000", credentials: true },
  });

  teamSocketHandler(io).use(authMiddleware);
  messagesSocketHandler(io).use(authMiddleware);
};
