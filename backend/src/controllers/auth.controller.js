const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const User = require("../models/user.model");
const { generateTokens, storeRefreshToken } = require("../utils/jwtToken");
const db = require("../config/pgpool");
dotenv.config();

const register = async (req, res, next) => {
    try {
        let registerData = req.body;
        
        // Validate required fields
        if (!registerData.name || !registerData.email || !registerData.password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required." });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: registerData.email });
        if (userExists) {
            return res.status(400).json({ success: false, message: `User with the email "${registerData.email}" already exists.` });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(registerData.password, salt);

        // Create new user
        const newUser = new User({
            name: registerData.name,  // Ensure this is correctly referenced
            email: registerData.email,
            phone: registerData.phone,
            grade: registerData.grade,
            password: hashedPassword,
        });

        // Save user
        const insertedUser = await newUser.save();
        if (!insertedUser) {
            throw new Error("Failed to register user.");
        }

        const { password: _, ...insertedUserWithoutPassword } = insertedUser;

        const { accessToken, refreshToken } = await generateTokens(insertedUserWithoutPassword);
        storeRefreshToken(insertedUser, refreshToken)

        res
        .cookie("accessToken", accessToken, {
            httpOnly: true, // prevent XSS attacks
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", // prevents CSRF attack
            maxAge: 15 * 60 * 1000, // 15 minutes
        })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true, // prevent XSS attacks
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", // prevents CSRF attack
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .status(200).json({ success: true, message: "User registered successfully.", user: insertedUserWithoutPassword });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const login = async (req, res, next) => {
    try {
        const registerData = req.body;
        const email = registerData.email;
        const password = registerData.password;
        // Create an empty User instance to use its find method
        const userInstance = new User({});
        const users = await userInstance.find({ email });
 
        // Check if user exists
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: `User not found.` });
        }
        
        const user = users[0];
        
        // Verify password with bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: `Invalid password.` });
        }
        
        // Password is valid, send success response
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        const { accessToken, refreshToken } = await generateTokens(userWithoutPassword);
        storeRefreshToken(userWithoutPassword, refreshToken)
        
        res
        .cookie("accessToken", accessToken, {
            httpOnly: true, // prevent XSS attacks
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", // prevents CSRF attack
            maxAge: 15 * 60 * 1000, // 15 minutes
        })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true, // prevent XSS attacks
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", // prevents CSRF attack
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .status(200).json({ 
            success: true, 
            message: "User logged in successfully.", 
            user: userWithoutPassword 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateUserCapabilities = async (req, res, next) => {
    try {
      const {
        total_time_questions,
        avg_time_questions,
        total_score,
        confidence_score,
        total_duration_in_a_subtopic,
      } = req.body;
  
      const userId = req.user.id;
  
      const newAvgTimeSpent = avg_time_questions;
      const newAvgQuizScore = total_score;
      const newAvgConfidenceScore = confidence_score;
      const newAdaptabilityScore =
        total_time_questions > 0 ? total_duration_in_a_subtopic / total_time_questions : 0;
      const newEnglishProficiency = confidence_score >= 80 ? 9 : 6; 
  
      const query = `
        UPDATE users
        SET avg_time_spent = $1,
            avg_quiz_score = $2,
            avg_confidence_score = $3,
            adaptability_score = $4,
            english_proficiency = $5
        WHERE id = $6
        RETURNING *;
      `;
  
      const values = [
        newAvgTimeSpent,
        newAvgQuizScore,
        newAvgConfidenceScore,
        newAdaptabilityScore,
        newEnglishProficiency,
        userId,
      ];
  
      // Execute the update query
      const result = await db.query(query, values);
  
      return res.status(200).json({
        success: true,
        user: result.rows[0],
        message: "User capabilities updated successfully",
      });
    } catch (error) {
      console.error("Error updating user capabilities:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating user capabilities",
        error: error.message,
      });
    }
  };
  
  

const profile = async (req, res, next) => {
    try {
        const { user } = req;
        const existingUser = await new User({}).findById(user.id);
        if (existingUser.length == 0) {
            return res.status(400).json({ success: false, message: "User not found." });
        }
        const { password: _, ...userWithoutPassword } = existingUser
        return res.status(200).json({ success: true, user: userWithoutPassword });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

const getUserDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const doesUserExist = await new User({}).findById(id)

        if (doesUserExist.length === 0) {
            return res.status(400).json({ success: false, message: `User not found.` });
        }
        
        const user = doesUserExist[0];
        const { password, ...userWithoutPassword } = user;

        res.status(200).json({ success: true, userWithoutPassword });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

const logout = async (req, res, next) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(200).json({ success: true, message: "User logged out successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = { register, login, getUserDetails, updateUserCapabilities, profile, logout };
