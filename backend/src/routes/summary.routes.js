const express = require("express");
const { getSummary, getFeedbackResult } = require("../controllers/summary.controller");

const router = express.Router();

router.post("/summarize", getSummary);
router.get("/feedback", getFeedbackResult);


module.exports = router;
