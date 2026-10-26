import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";

import routes from "./routes/index.js";

const app = express();

app.disable("x-powered-by");

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(compression());

app.use(cookieParser());

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "R.O.A API is healthy",
  });
});

app.use("/api", routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;
