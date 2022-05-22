import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import routes from "./routes/index.js";

import { setupSocket } from "./socket/socket.js";

// for development
global.delay = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

// express server
const app = express();
const httpServer = createServer(app);

// socket
setupSocket(httpServer);

// parse application/json
app.use(bodyParser.json());
app.use(fileUpload());
app.use((req, res, next) => {
  global.domain = `${req.protocol}://${req.get("host")}`;
  next();
});

// CORS
// app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cors({ credentials: true, origin: "*" }));

// cookies
app.use(cookieParser({ httpOnly: true }));

// delay for testing
app.use((req, res, next) => {
  setTimeout(() => next(), Math.random() * process.env.DELAY_API);
});

// routers
app.use(routes);

httpServer.listen(8000);
