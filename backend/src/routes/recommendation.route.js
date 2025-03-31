const express = require('express');

const router = express.Router();

const { getRecommendationResponse } = require('../controllers/recommendation.controller.js');

router.get(`/:userId`, async (req, res)=>{
  let userId = req.params.userId;

  let recommendedVideo = await getRecommendationResponse(userId);

  res.sendStatus(200).json(recommendedVideo);

})

router.get('/', getRecommendationResponse)

module.exports = router;
