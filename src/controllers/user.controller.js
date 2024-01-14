//chatgpt code added validation and errors printing
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;

    if (
      [fullName, email, username, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;

    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      throw new ApiError(400, "Error uploading avatar to Cloudinary");
    }

    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Error fetching created user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  } catch (error) {
    console.error("Error registering user:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!username && !email) {
      throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    console.error("Error logging in user:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

// ... (other functions with similar error handling)
// ... (other functions with similar error handling)

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    console.error("Error changing current password:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User fetched successfully"));
  } catch (error) {
    console.error("Error getting current user:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
      throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email: email,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
  } catch (error) {
    console.error("Error updating account details:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

// Continue with other functions...

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"));
  } catch (error) {
    console.error("Error logging out user:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
      throw new ApiError(400, "Error while uploading avatar");
    }

    // Delete the old avatar from Cloudinary if it exists
    if (req.user.avatar) {
      const public_id = req.user.avatar.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(public_id);
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar image updated successfully"));
  } catch (error) {
    console.error("Error in updateUserAvatar:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading cover image");
    }

    // Delete the old cover image from Cloudinary if it exists
    if (req.user.coverImage) {
      const public_id = req.user.coverImage.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(public_id);
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover image updated successfully"));
  } catch (error) {
    console.error("Error in updateUserCoverImage:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;

    if (!username?.trim()) {
      throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(404, "Channel does not exist");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
      );
  } catch (error) {
    console.error("Error in getUserChannelProfile:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

const getWatchHistory = asyncHandler(async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",
                },
              },
            },
          ],
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error in getWatchHistory:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

// ... (continue with other functions)

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
