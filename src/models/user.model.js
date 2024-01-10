import { Schema, model } from "mongoose";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
const userSchema = new Schema(
  {
    userName: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  //here we are not using arrow function because it do not have access to this by default
  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt(10);
  const hashPass = await bcryptjs.hash(this.password, salt);
  this.password = hashPass;
});
//custom methods
userSchema.methods.isCorrectPassword = async function (pass) {
  return await bcryptjs.compare(pass, this.password);
};
userSchema.methods.generateAccessToken = function () {
  const token = jsonwebtoken.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  // console.log(token);
  return token;
};

userSchema.methods.generateRefreshToken = function () {
  // refresh token's expiry is more than the access token and we send less data with refresh toekn.
  const token = jsonwebtoken.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
  // console.log(token);
  return token;
};

const User = model("User", userSchema);
export default User;

//jwt is a bearer token here bearer means the person or user who is having this token can access the stuffs which he is trying to.
//jwt just acts as a key to open a lock.
