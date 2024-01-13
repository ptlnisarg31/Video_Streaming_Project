import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localpath) return null;
    // Upload file to cloudinary
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });
    //file has been uploaded
    console.log("File uploaded successfully on cloudinary", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localfilepath); // remove temporary file from as the upload failed
    console.log("file upload failed : ", error);
    return null;
  }
};

export { uploadOnCloudinary };
