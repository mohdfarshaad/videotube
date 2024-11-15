import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js"; // Assuming ApiError is defined here

// Generate Access and Refresh Tokens
const generateAccessAndRefreshTokenService = async (userId) => {
  try {
    const user = await User.findById(userId);

    // Ensure user is found before generating tokens
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // Save the refresh token on the user model
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(
      "Something went wrong while generating access and refresh token: ",
      error
    );
    throw new ApiError(500, "Internal server error");
  }
};

// Refresh Access Token using the refresh token
const refreshAccessTokenService = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // Verify the incoming refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userId = decodedToken?._id;

    // Fetch the user without the password field
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new ApiError(401, "No user found");
    }

    // Check if the refresh token matches
    if (incomingRefreshToken.trim() !== user.refreshToken.trim()) {
      throw new ApiError(401, "Refresh Token Expired or Used");
    }

    // Generate new tokens
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokenService(user._id);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh token");
  }
};

export { generateAccessAndRefreshTokenService, refreshAccessTokenService };
