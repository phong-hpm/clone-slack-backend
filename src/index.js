import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import { db, initDatabase } from "./database/index.js";

import routes from "./routes/index.js";

const app = express();
const httpServer = createServer(app);

// const io = new Server(httpServer, {
//   cookie: true,
//   cors: { origin: "http://localhost:3000" },
// });

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

httpServer.listen(8000, async () => {
  await db.read();
  if (!db.data) initDatabase();
});
