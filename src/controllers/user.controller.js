import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
// function for generating accesstoken and refreshtoken
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    //used to save something in database
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating the access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, password, fullName } = req.body;
  if (
    [userName, email, password, fullName].some((data) => data?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }
  //   check if the user already exists in the database
  const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
  if (existingUser) {
    throw new ApiError(409, "user with username or email already exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar not uploaded try again");
  }

  const user = await User.create({
    userName,
    password,
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "something went wrong user could not be registered"
    );
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req.body->data
  //username or email
  //find the user
  //password check
  // access and refresh token
  // send cookie
  //send response

  const { userName, email, password } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "either email or username is required");
  }
  const foundUser = await User.findOne({ $or: [{ userName }, { email }] });
  if (!foundUser) {
    throw new ApiError(404, "Invalid credentials or user does not exist");
  }

  const isValidPassword = await foundUser.isCorrectPassword(password);
  if (!isValidPassword) {
    throw new ApiError(
      401,
      "password is not valid please enter a valid passowrd"
    );
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    foundUser._id
  );

  const loggedInUser = await User.findById(foundUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    //setting this will allow to modify the cookies form the server only not by the frontend end.
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        message: "Logged in successfully",
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});
//user logout
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } },
    { new: true } //this will send the updated data if false the previous data
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAcessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unatuhorized token");
    }
    const deocodedUserFromToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    let foundUser = await User.findById(deocodedUserFromToken?._id);
    if (!foundUser) {
      throw new ApiError(404, "user not found");
    }
    if (foundUser.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "refresh token is expired or already used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { refreshToken: newRefreshToken, accessToken: newAccessToken } =
      await generateAccessAndRefreshToken(foundUser._id);
    res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { newAccessToken, newRefreshToken },
          "token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPaasword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const userId = req.user._id;
  const user = await User.findById(userId);
  //check old password correct or not
  const isPasswordCorrect = await user.isCorrectPassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid old password");
  }
  //set new password and save the user in database
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if(!req.user){
    throw new ApiError(404,"No user found")
  }
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched successfully"));
});

const updateAcoountDetails = asyncHandler(async (req, res) => {
  try {
    const { fullName, email } = req.body;
    if (!fullName && !email) {
      throw new ApiError(400, "enter the required details");
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true }
    ).select("-password -refreshToken");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedUser,
          "account details updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "internal server error");
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localPath = req.file.path;
  if (!localPath) {
    throw new ApiError(400, "please select an image to upload");
  }
  const uploadedImage = await uploadOnCloudinary(localPath);
  if (!uploadedImage) {
    throw new ApiError(400, "image could not be uploaded");
  }
  const updatedAvatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: uploadedImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, updatedAvatar, "avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "please select an image to upload");
  }
  const uploadedImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!uploadedImage) {
    throw new ApiError(400, "image could not be uploaded");
  }
  const updatedCoverImage = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: uploadedImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(
      new ApiResponse(200, updatedCoverImage, "coverImage updated successfully")
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
  changeCurrentPaasword,
  getCurrentUser,
  updateAcoountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
