import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routers/user.router.js";
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

app.use(cookieParser());

// routers
app.use("/api/v1/users",userRouter)
export { app };
