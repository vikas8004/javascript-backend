import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "vikas8004",
  api_key: "498528855722373",
  api_secret: "QQoK7k3Kx770yohArO6fkRD4iTQ",
});
const uploadOnCloudinary = async function (filepath) {
  try {
    const res = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
    });
    console.log(res.url);
    fs.unlinkSync(filepath);
    return res;
  } catch (error) {
    fs.unlinkSync(filepath); //this is used to clean the temporary file stored on the server if there is a case when the file uploading has been failed but stored on the sever during this process .
    return null;
  }
};

export default uploadOnCloudinary;
