import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

import routes from "./routes/index.js";

import { setupSocket } from "./socket/socket.js";

// express server
const app = express();
const httpServer = createServer(app);

// socket
setupSocket(httpServer);

// parse application/json
app.use(bodyParser.json());

// CORS
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

// cookies
app.use(cookieParser({ httpOnly: true }));

// delay for testing
app.use((req, res, next) => {
  setTimeout(() => next(), Math.random() * process.env.DELAY_API);
});

// routers
app.use(routes);

httpServer.listen(8000);
