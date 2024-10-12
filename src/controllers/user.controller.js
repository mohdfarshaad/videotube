import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
  // Take user data from frontend
  // validation - Not Empty ...
  // check if the user already exists - usernae , email
  // check for images Avatar , cover Images
  // upload avater to cloudinary -> add check on that
  // user creation response or error

  const { fullName, username, email, password } = req.body;

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username: username }, { email: email }]
  })

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists")
  }

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);



  const createdUser = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  })



  const userCreated = await User.findById(createdUser._id).select("-password -refreshToken")


  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering user")
  }

  return res.status(201).json(new ApiResponse(200, userCreated, "User registered Successfully"));

});

export { registerUser };
