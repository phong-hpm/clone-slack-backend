// global types
import "src/type.global";

//
import dotEnv from "dotenv";
import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import routes from "@routes/index";
import { setupSocket } from "@socket/socket";
import { setupEmailTransporter } from "@utils/email";

// for development
(global as any).delay = (time: number) =>
  new Promise((resolve) => setTimeout(() => resolve({}), time));

// config env
dotEnv.config();

// setup nodemailer
setupEmailTransporter();

// express server
const app = express();
const httpServer = createServer(app);

// socket
setupSocket(httpServer);

// parse application/json
app.use(bodyParser.json());
app.use(fileUpload());
app.use((req, res, next) => {
  (global as any).domain = `${req.protocol}://${req.get("host")}`;
  next();
});

// CORS
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
    allowedHeaders: ["content-type", "x-access-token"],
  })
);

// cookies
app.use(cookieParser("cookie_secret", {}));

// delay for testing
app.use((req, res, next) => {
  setTimeout(() => next(), Math.random() * Number(process.env.DELAY_API));
});

// routers
app.use(routes);

httpServer.listen(8080);
