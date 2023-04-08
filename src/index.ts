// global types
import "src/type.global";

//
import dotEnv from "dotenv";
import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import helmet, { HelmetOptions } from "helmet";
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

// HELMET
if (process.env.NODE_ENV === "production") {
  const helmetOptions: HelmetOptions = {
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
  };

  app.use(helmet(helmetOptions));
}

// CORS
const whiteList = JSON.parse(process.env.FRONDEND_DOMAIN);
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (whiteList.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    allowedHeaders: ["content-type", "x-access-token"],
  })
);

// cookies
app.use(cookieParser("cookie_secret", {}));

// delay for testing
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    setTimeout(() => next(), Math.random() * Number(process.env.DELAY_API));
  });
}

app.use("/ping", (req, res) => res.send("pong"));

// routers
app.use(routes);

httpServer.listen(8081);
