export const cookieOptions = {
  maxAge: process.env.ACCESS_TOKEN_LIFE,
  httpOnly: true,
};

export const SocketEventDefault = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
};

export const SocketEvent = {
  // emit
  EMIT_LOAD_CHANNELS: "EMIT_LOAD_CHANNELS",
  EMIT_ADD_CHANNEL: "EMIT_ADD_CHANNEL",

  EMIT_LOAD_MESSAGES: "EMIT_LOAD_MESSAGES",
  EMIT_ADD_MESSAGE: "EMIT_ADD_MESSAGE",
  // on
  ON_CHANNELS: "ON_CHANNELS",
  ON_MESSAGES: "ON_MESSAGES",
  ON_NEW_MESSAGE: "ON_NEW_MESSAGE",
  ON_AUTHENTICATED: "ON_AUTHENTICATED",
  ON_ATOKEN_EXPIRED: "ON_ATOKEN_EXPIRED",
};
