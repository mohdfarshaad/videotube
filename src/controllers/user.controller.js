import dotenv from "dotenv";
dotenv.config();

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { loginUser, registerUser } from "../services/auth.service.js";
import { refreshAccessTokenService } from "../services/token.service.js";
import { changeUserPasswordService } from "../services/user.service.js";

const register = asyncHandler(async (req, res) => {
  const userData = req.body;
  const files = req.files;

  const userCreated = await registerUser(userData, files);

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, userCreated, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const userData = req.body;

  const { loggedInUser, refreshToken, accessToken } = await loginUser(userData);

  if (!loggedInUser) {
    if (!loggedInUser) {
      throw new ApiError(500, "Something went wrong");
    }
  }

  // Cookie Options to make only modifiable in the server
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Return Reponse and Cookie
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  // find user
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: undefined },
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
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  const { accessToken, refreshToken } =
    await refreshAccessTokenService(incomingRefreshToken);

  if (!(accessToken && refreshToken)) {
    throw new ApiError(500, "Something went wrong");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const passwordData = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(404, "Unauthorized request");
  }

  try {
    const passwordChanged = await changeUserPasswordService(
      passwordData,
      userId
    );

    if (!passwordChanged) {
      throw new ApiError(
        500,
        "Something went wrong while changing the password"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    console.error("Error in change password route:", error.message);
    throw new ApiError(500, error.message);
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched Successfully"));
});

const updateCurrentUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "Fullname or email is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarFile = req.files["avatar"] ? req.files["avatar"][0] : null;

  if (!avatarFile) {
    throw new ApiError(400, "Avatar is missing");
  }

  const avatarLocalPath = avatarFile.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "Error Uploadig file on cloudinary");
  }

  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      avatar: avatar.url,
    },
  }).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImage = req.files["coverImage"]
    ? req.files["coverImage"][0]
    : null;

  if (!coverImage) {
    throw new ApiError(400, "Avatar is missing");
  }

  const coverImageLocalPath = coverImage.path;

  const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImageUpload.url) {
    throw new ApiError(500, "Error Uploadig file on cloudinary");
  }

  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      coverImage: coverImage.url,
    },
  }).select("-password -refrehToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export {
  register,
  login,
  logout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateCurrentUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
