const { fetchTranscript, summarizeText } = require("../models/summary.model");

exports.getSummary = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "YouTube URL is required" });

  const videoId = url.split("v=")[1]?.split("&")[0];
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

  const transcript = await fetchTranscript(videoId);
  if (!transcript) return res.status(400).json({ error: "Could not fetch transcript" });

  const summary = await summarizeText(transcript);
  if (!summary) return res.status(500).json({ error: "Failed to summarize" });

  res.json({ summary });
};


exports.getFeedbackResult = async (req, res) => {
  const { feedback, topic, subtopic } = req.body;
  
  // Construct the prompt to send to GenAI
  const prompt = `I have a doubt on ${feedback} in topic: ${topic} in subtopic: ${subtopic}`;
  
  try {
    // Replace with your actual GenAI endpoint and configuration
    const response = await fetch(process.env.GENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GENAI_API_KEY}`
      },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch result from GenAI");
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      result: data.result, // adjust based on the actual structure of GenAI response
      message: "Feedback generated successfully using GenAI"
    });
  } catch (error) {
    console.error("Error fetching result from GenAI:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching result from GenAI",
      error: error.message
    });
  }
};
