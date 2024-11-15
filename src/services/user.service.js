import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";

const changeUserPasswordService = async (passwordData, userId) => {
  try {
    const { oldPassword, newPassword } = passwordData;

    const user = await User.findById(userId).select("-refreshToken");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(401, "Incorrect old password");
    }

    user.password = newPassword;

    await user.save(); // Let `pre('save')` handle password hashing
    return true; // Indicate success
  } catch (error) {
    console.error("Error changing password:", error.message);
    throw error;
  }
};

export { changeUserPasswordService };
