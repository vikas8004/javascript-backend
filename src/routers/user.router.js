import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const userRouter = express.Router();
userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 }, // Max count of files in
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
userRouter.route("/login").post(loginUser);

//protected routes
userRouter.route("/logout").post(verifyJwt, logoutUser);

export default userRouter;
