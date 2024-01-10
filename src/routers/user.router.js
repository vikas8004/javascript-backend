import express from "express";
import { registerUser } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
const userRouter = express.Router();
userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 }, // Max count of files in
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
export default userRouter;
