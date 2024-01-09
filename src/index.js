import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDb from "./db/conn.js";
import { app } from "./app.js";
import cookieParser from "cookie-parser";
import cors from "cors";

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
connectDb()
  .then((res) => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(
        `ur applicaton is running on the port number ${process.env.PORT}`
      );
    });
  })
  .catch((err) => {
    console.log("mongo db connection failed ", err.message);
  });
