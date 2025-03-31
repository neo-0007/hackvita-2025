const { GoogleGenAI, Type } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEN_AI_API_KEY });

async function getRecommendationResponse(req, res, next) {

const { topic, adaptability_score, avg_confidence_score, avg_time_spent, english_proficiency, grade, preferred_learning_style } =  req.body

var userCapabilitiesforRoadmap = {}

if (adaptability_score == 0 || avg_confidence_score == 0 || avg_time_spent == 0 || english_proficiency == 0 || grade == 0 || preferred_learning_style == 0) {
     userCapabilitiesforRoadmap = {
        english_proficiency: 'begginner',
        currently_studying: grade,
        preferred_learning_style: 'mixed: videos, reading, and hands-on practice'
    }
    
} else {
    userCapabilitiesforRoadmap = {
    adaptability_score: adaptability_score,
    avg_confidence_score: avg_confidence_score,
    avg_time_spent: avg_time_spent,
    english_proficiency: english_proficiency,
    currently_studying: grade,
    preferred_learning_style: preferred_learning_style
}
}

const resSchema = {
    type:Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            'Topic_Name': {
                type: Type.STRING,
                description: "The name of the topic.",
                nullable: false
            },
            'subtopics': {
                type: Type.ARRAY,
                items:{
                    type:Type.STRING,
                    description:'A list of subtopics with explanations.',
                    nullable:false
                }
            }
        },
        required: ["Topic_Name", "subtopics"],
        propertyOrdering:["Topic_Name", "subtopics"]
    }
};

const prompt = `create a roadmap for studying complete ${topic} with all topics and subtopics, where user capabalities are : ${JSON.stringify(userCapabilitiesforRoadmap)}    
`;


    
const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
        responseMimeType: 'application/json',
        responseSchema: resSchema,
    },
});

let rawText = response.text.trim();

// Remove markdown code block (```json ... ```)
if (rawText.startsWith("```json")) {
    rawText = rawText.slice(7, -3).trim();
} else if (rawText.startsWith("```")) {
    rawText = rawText.slice(3, -3).trim();
}

const structuredResponse = JSON.parse(rawText)


// console.debug(JSON.parse(response.text));
return res.status(200).json({success:true, response: structuredResponse});
}

async function generateContent(req, res, next) {

    const { topic, adaptability_score, avg_confidence_score, avg_time_spent, english_proficiency, grade, preferred_learning_style } =  req.body

    var userCapabilitiesforContent = {}

if (adaptability_score == 0 || avg_confidence_score == 0 || avg_time_spent == 0 || english_proficiency == 0 || grade == 0 || preferred_learning_style == 0) {
    userCapabilitiesforContent = {
        english_proficiency: 'begginner',
        currently_studying: grade,
        preferred_learning_style: preferred_learning_style
    }
    
} else {
    userCapabilitiesforContent = {
    adaptability_score: adaptability_score,
    avg_confidence_score: avg_confidence_score,
    avg_time_spent: avg_time_spent,
    english_proficiency: english_proficiency,
    currently_studying: grade,
    preferred_learning_style: preferred_learning_style
}
}
    const resSchema = {
        type:Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                'heading': {
                    type: Type.STRING,
                    description: "heading of the subtopic",
                    nullable: false
                },
                'lesson': {
                    type: Type.STRING,
                        description:'complete, detailed text lesson on the subtopic. add a fun fact at the end related to the subtopic',
                        nullable:false
                }
            },
            required: ["heading", "lesson"],
            propertyOrdering:["heading", "lesson"]
        }
    };
    
    const prompt = `generate complete, detailed text lesson on the topic "${topic}". generate as many subtopics as needed, where user capabalities are : ${JSON.stringify(userCapabilitiesforContent)}`;
    
    
        
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: resSchema,
        },
    });
    
    let rawText = response.text.trim();
    
    // Remove markdown code block (```json ... ```)
    if (rawText.startsWith("```json")) {
        rawText = rawText.slice(7, -3).trim();
    } else if (rawText.startsWith("```")) {
        rawText = rawText.slice(3, -3).trim();
    }
    
    const structuredResponse = JSON.parse(rawText)
    
    
    // console.debug(structuredResponse);
    return res.status(200).json({success:true, response: structuredResponse});
    }


module.exports = {getRecommendationResponse, generateContent};
    
    