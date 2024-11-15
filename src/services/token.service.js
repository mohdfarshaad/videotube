import { User } from "../models/user.models";

const generateAccessAndRefreshTokenService = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(
      "Something went wrong while generating access and refresh token : ",
      error
    );
  }
};

const refreshAccessTokenService = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userId = decodedToken?._id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new ApiError(401, "No user found");
    }

    if (incomingRefreshToken.trim() !== user.refreshToken.trim()) {
      throw new ApiError(401, "Refresh Token Expired or Used");
    }

    const { accessToken, newRefreshToken } =
      generateAccessAndRefreshTokenService(user._id);

    return { accessToken, newRefreshToken };
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh token");
  }
};

export { generateAccessAndRefreshTokenService, refreshAccessTokenService };
