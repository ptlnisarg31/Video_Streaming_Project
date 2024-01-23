import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Check if the local file exists before attempting to unlink it
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Delete the local file
    }

    return response;
  } catch (error) {
    // Log the error details for debugging
    console.error("Error uploading to Cloudinary:", error);

    // Remove the locally saved temporary file if the upload operation fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export { uploadOnCloudinary };

// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;

//     // Upload the file on Cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//     });

//     // Check if the local file exists before attempting to unlink it
//     if (fs.existsSync(localFilePath)) {
//       fs.unlinkSync(localFilePath); // Delete the local file
//     }

//     return response;
//   } catch (error) {
//     // Remove the locally saved temporary file if the upload operation fails
//     if (fs.existsSync(localFilePath)) {
//       fs.unlinkSync(localFilePath);
//     }

//     return null;
//   }
// };

// export { uploadOnCloudinary };
