require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/user.model");

const API_KEY = process.env.GOOGLE_API_TOKEN;

if (!API_KEY) {
    console.error("❌ Missing Gemini API key. Please check your .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function getRecommendationResponse(userId, topic) {
    try {
        // const user = await User.findOne({ _id: userId }); // Fetch user details
        const user = userId;
        if (!user) {
            throw new Error("User not found");
        }

        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro-002" });

        const chat = model.startChat({
            history: [],
            generationConfig: { maxOutputTokens: 300 },
        });

        const inputData = `
        You are a video recommendation system. Give YouTube video links for the topic '${topic}' based on the user's capability, weak topics (MOST IMPORTANT), and other analytics data provided below.
        Suggest the best YouTube videos in a structured learning order (from easy to advanced).
        
        User Info:
        ${JSON.stringify(user)}
        
        STRICT JSON FORMAT INSTRUCTIONS:
        - Respond **ONLY** with a valid JSON array.
        - Do **not** include explanations or extra text.
        - Limit recommendations to **3-4 videos max**.
        - Each video should only have 'title' and 'link' fields.

        Example response format:
        [
            {"title": "Video 1", "link": "https://..."},
            {"title": "Video 2", "link": "https://..."}
        ]
        `;

        const result = await chat.sendMessage(inputData);

        if (result && result.response) {
            const responseText = result.response.text();
            console.log("Raw Response:", responseText); // Debugging

            const cleanedResponse = responseText.replace(/```json|```/g, "").trim(); // Remove markdown artifacts

            return JSON.parse(cleanedResponse);
        } else {
            throw new Error("Invalid response from Gemini API");
        }
    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        return "Sorry, I am having trouble generating recommendations right now. Please try again later.";
    }
}

module.exports = { getRecommendationResponse };
