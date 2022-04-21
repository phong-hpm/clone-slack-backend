import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import { Server } from "socket.io";

import { db } from "./database/index.js";
import routes from "./routes/index.js";
import { chanelIdRegExp, teamIdRegExp } from "./utils/generateId.js";
import { verifyToken } from "./middlewares/auth.middleware.js";

import * as teamsServices from "./services/teams.service.js";
import * as chanelsServices from "./services/chanels.service.js";
import * as messagesServices from "./services/messages.service.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cookie: true,
  cors: { origin: "http://localhost:3000" },
});

// parse application/json
app.use(bodyParser.json());

// deplay for testing
app.use((req, res, next) => {
  setTimeout(() => next(), Math.random() * process.env.DELAY_API);
});

// CORS
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

// cookies
app.use(cookieParser({ httpOnly: true }));

// routers
app.use(routes);

// socket
io.engine.on("headers", async (headers, request) => {
  const { accessToken } = cookie.parse(request.headers.cookie || "") || {};
  if (!accessToken) return;

  const { error } = await verifyToken(accessToken);
  if (error) return;
});

io.of("/direct-messages")
  .use((socket, next) => {
    const name = socket.handshake.auth.name;
    const email = socket.handshake.auth.email;
    if (!name) return next(new Error("invalid name"));
    if (!email) return next(new Error("invalid email"));
    socket.name = name;
    socket.email = email;
    next();
  })
  .on("connection", (socket) => {
    // fetch existing users
    const users = [];
    for (let [id, socket] of io.of("/messages").sockets) {
      users.push({
        sId: id,
        name: socket.name,
        email: socket.email,
      });
    }
    socket.emit("users", users);

    // notify existing users
    socket.broadcast.emit("user connected", {
      sId: socket.id,
      username: socket.username,
    });

    // forward the private message to the right recipient
    socket.on("private message", ({ content, to }) => {
      console.log("private message", content);
      socket.to(to).emit("private message", {
        content,
        from: socket.id,
      });
    });

    // notify users upon disconnection
    socket.on("disconnect", () => {
      socket.broadcast.emit("user disconnected", socket.id);
    });
  });

io.of(teamIdRegExp)
  .use((socket, next) => {
    const name = socket.handshake.auth.name;
    const email = socket.handshake.auth.email;
    if (!name) return next(new Error("invalid name"));
    if (!email) return next(new Error("invalid email"));
    socket.name = name;
    socket.email = email;
    next();
  })
  .on("connection", (socket) => {
    const namespace = socket.nsp;
    const teamId = namespace.name.replace("/", "");

    const options = {
      isDeep: true,
      chanels: {
        isDeep: true,
        messages: {
          isDeep: false,
          isRemove: true,
        },
        users: {
          isDeep: false,
        },
      },
      users: {
        isDeep: true,
        teams: {
          isRemove: true,
        },
      },
    };

    teamsServices.getTeamView(teamId, options).then((res) => {
      socket.emit("chanel-data", res);
    });
  });

io.of(chanelIdRegExp)
  .use((socket, next) => {
    const name = socket.handshake.auth.name;
    const email = socket.handshake.auth.email;
    if (!name) return next(new Error("invalid name"));
    if (!email) return next(new Error("invalid email"));
    socket.name = name;
    socket.email = email;
    next();
  })
  .on("connection", (socket) => {
    const namespace = socket.nsp;
    const chanelId = namespace.name.replace("/", "");

    socket.on("load-messages", (data) => {
      const { limit = 2, latest } = data;

      const options = {
        isDeep: true,
        messages: {
          isDeep: true,
          limit,
        },
        users: {
          isDeep: true,
        },
      };

      chanelsServices.getChanelView(chanelId, options).then((res) => {
        const { messages = [] } = res || {};
        socket.emit("messages-data", messages);
      });
    });
  });

httpServer.listen(8000, () => {
  db.read();
});
