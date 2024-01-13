import express from "express";
import {
  changeCurrentPaasword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAcessToken,
  registerUser,
  updateAcoountDetails,
  updateUserAvatar,
  updateUserCoverImage,
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
userRouter.route("/refresh-token").post(refreshAcessToken);
userRouter.route("/change-password").post(verifyJwt, changeCurrentPaasword);
userRouter.route("/current-user").get(verifyJwt, getCurrentUser);
userRouter.route("/update-account").post(verifyJwt, updateAcoountDetails);
userRouter
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
userRouter
  .route("/update-cover-image")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);
userRouter.route("/channel/:username").get(verifyJwt, getUserChannelProfile);
userRouter.route("/watch-history").get(verifyJwt, getWatchHistory);
export default userRouter;
