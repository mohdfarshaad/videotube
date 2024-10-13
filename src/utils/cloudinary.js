import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (uploadFilePath) => {
  try {
    if (!uploadFilePath) return "local file path is not found";
    //Uploading the file to cloudinary
    const response = await cloudinary.uploader.upload(uploadFilePath, {
      resource_type: "auto",
    });
    if (!response) {
      return null;
    }
    fs.unlinkSync(uploadFilePath);
    return response;
  } catch (error) {
    console.log("Cloudinary upload failed", error);
  }
};

export { uploadOnCloudinary };
