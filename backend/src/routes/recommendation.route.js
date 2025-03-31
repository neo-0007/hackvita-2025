const express = require('express');
const router = express.Router();
const { getRecommendationResponse } = require('../controllers/recommendation.controller.js');

router.post('/', async (req, res) => {
    try {
        const { userId, topic } = req.body; // Use req.body for POST, but req.query for GET

        if (!userId || !topic) {
            return res.status(400).json({ error: "Missing userId or topic" });
        }

        const recommendedVideos = await getRecommendationResponse(userId, topic);

        res.status(200).json(recommendedVideos);
    } catch (error) {
        console.error("❌ Error in /recommend route:", error);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
});

module.exports = router;
