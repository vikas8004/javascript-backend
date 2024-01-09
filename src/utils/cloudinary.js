import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLODINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (filepath) {
  try {
    const res = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
    });
    console.log(res);
    return res;
  } catch (error) {
    fs.unlinkSync(filepath); //this is used to clean the temporary file stored on the server if there is a case when the file uploading has been failed but stored on the sever during this process .
    return null;
  }
};

export default uploadOnCloudinary