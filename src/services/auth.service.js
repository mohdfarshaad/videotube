import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

const registerUser = async (userData, files) => {
  const { fullName, username, email, password } = userData;

  // Validate required fields
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Handle avatar upload
  const avatarLocalPath = files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Handle cover image upload (optional)
  let coverImageLocalPath = null;
  if (files?.coverImage?.[0]?.path) {
    coverImageLocalPath = files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  // Create user in database
  const createdUser = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  // Fetch user without sensitive fields
  const userCreated = await User.findById(createdUser._id).select(
    "-password -refreshToken"
  );

  return userCreated;
};

const loginUser = async (userData) => {
  const { username, email, password } = userData;

  if (!username && !email) {
    throw new ApiError(400, "All fields are required");
  }

  // find the user

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "Unauthorized request");
  }

  // Password check

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  // Generating access and refresh Token

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return loggedInUser;
};

export { registerUser, loginUser };
