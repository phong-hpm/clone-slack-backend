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
  EMIT_LOAD_CHANELS: "EMIT_LOAD_CHANELS",
  EMIT_ADD_CHANEL: "EMIT_ADD_CHANEL",

  EMIT_LOAD_MESSAGES: "EMIT_LOAD_MESSAGES",
  EMIT_ADD_MESSAGE: "EMIT_ADD_MESSAGE",
  // on
  ON_CHANELS: "ON_CHANELS",
  ON_MESSAGES: "ON_MESSAGES",
  ON_NEW_MESSAGE: "ON_NEW_MESSAGE",
  ON_AUTHENTICATED: "ON_AUTHENTICATED",
  ON_ATOKEN_EXPIRED: "ON_ATOKEN_EXPIRED",
};
