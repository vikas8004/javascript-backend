import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
// function for generating accesstoken and refreshtoken
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken =  user.generateRefreshToken();
    console.log(accessToken,refreshToken);
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
  console.log(req.body);
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
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
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
export { registerUser, loginUser, logoutUser };
