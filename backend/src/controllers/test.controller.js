const { GoogleGenAI, Type } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEN_AI_API_KEY });

// let questionsSets = []

const users = [
    { id: 'abc123', name: "Alice", interests: ["technology", "AI", "coding"], watchHistory: ["Intro to AI", "Building Chatbots"], weakTopics: ["DSA", "Linear Algebra"], avg_time:2.5, avg_quiz_score:5, avg_confidence_score:8, total_quiz_played:1},
    { id: 'xyz123', name: "Bob", interests: ["gaming", "streaming", "VR"], watchHistory: ["Top 10 VR Games", "Best Streaming Setups"], weakTopics: ["Game Engine", "Mathematics"], avg_time:1.5, avg_quiz_score:3, avg_confidence_score:5, total_quiz_played:1},
];

const get_10_questions = async (req, res) => {
    const {topic, userId} = req.body;
    console.log(req.body)
    const user = users.find((u) => u.id === userId);
    if (!user) {
        console.log( "User not found." );
        return res.status(404).json({success:false, response: "User not found"})
    }

    const resSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            'question':{
                type:Type.STRING,
                description: 'A multiple choice question related to the given topic. Do not include the options or answer. just the question text.',
                nullable:false
            },

            'options':{
                type:Type.ARRAY,
                items:{
                    type:Type.OBJECT,   
                    properties:{
                        'A':{
                            type:Type.STRING,
                            description:'first option',
                            nullable:false
                        },
                        'B':{
                            type:Type.STRING,
                            description:'second option',
                            nullable:false
                        },
                        'C':{
                            type:Type.STRING,
                            description:'third option',
                            nullable:false
                        },
                        'D':{
                            type:Type.STRING,
                            description:'fourth option',
                            nullable:false
                        },
                    },
                    required:['A', 'B', 'C', 'D']
                }
            },

            'correctAnswer':{
                type:Type.STRING,
                description:'The correct answer to the question.',
                nullable:false
            },

            'explanation':{
                type:Type.STRING,
                description:'Explain why the answer is correct. Length of explanation should depend on the complexity of the question.',
                nullable:false
            },

            'subTopicLayer1': {
                type:Type.STRING,
                description: 'The subtopic of the main topic provided to which the question belongs.',
                nullable: false
            },

            'subTopicLayer2': {
                type:Type.STRING,
                description: 'The subtopic of the subTopicLayer1 to which the question belongs.',
                nullable: false
            },
        },
        required: ['question', 'options', 'correctAnswer', 'explanation', 'subTopicLayer1', 'subTopicLayer2'],
        propertyOrdering: ['question', 'options', 'correctAnswer', 'explanation', 'subTopicLayer1', 'subTopicLayer2'],
    },
    minItems:10,
    maxItems:10
}
try{
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are a multiple choice question generator that generates 10 questions related to a given topic. You first generate 5 questions based on the main topic and then generate remaining 5 questions slightly related to the weak topics of the player but without deviating from the main topic provided. Now generate 10 multiple choice questions on the main topic "${topic}" for a player with weak topics ${user.weakTopics.join(", ")}.`,
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

    // questionsSets.push(structuredResponse);
    // console.debug(response.text);
    return res.status(200).json({success:true, response: structuredResponse});
}
catch(err)
{
    console.log("generating questions gemini api calling error :\n", err.message)
    res.send(500).json({success:false, message:err.message})
}
}


const update_user_topics = async (req,res, next)=>{
    try{
    const {userId, weak_topics, strong_topics} = req.body;
    // const userId = 'abc123'
    // const weak_topics=['Calculus', 'Linear Algebra']
    // const strong_topics=['DSA']

    const user = users.find((u) => u.id === userId);
    if (!user) {
        console.log( "User not found." );
        return res.status(404).json({success:false, response: "User not found"})
    }

    // user.weakTopics = user.weakTopics.map(topic => topic.toLowerCase())

    weak_topics.forEach(weak_topic => {
        // weak_topic = weak_topic.toLowerCase();
        if(!user.weakTopics.includes(weak_topic))
            user.weakTopics.push(weak_topic)
    });

    strong_topics.forEach(strong_topic => {
        // strong_topic = strong_topic.toLowerCase()
        user.weakTopics = user.weakTopics.filter(topic => topic !== strong_topic)
    })

    console.log(user.weakTopics)

    //code to be written to update user in database
    /*




    */
    res.send(200).json({success:true, message: "Weak topics updated"})
    }
    catch(err)
    {
        console.log("update user topics error : \n", err.message)
        res.send(500).json({success:false, message:err.message})
    }
}

const update_user_capabilities = async (req, res)=> {
    try{
    const {userId, total_time, avg_time, total_score, confidence_score} = req.body

    const user = users.find((u) => u.id === userId);
    if (!user) {
        console.log( "User not found." );
        return res.status(404).json({success:false, response: "User not found"})
    }

    if(total_time===undefined || avg_time===undefined || total_score===undefined || confidence_score===undefined) {
        return res.status(400).json({success:false, message: "body does not contain all required fields"})
    }

    // console.log(user)

    // console.log({total_time, avg_time, total_score, confidence_score})

    user.avg_quiz_score = (user.total_quiz_played*user.avg_quiz_score+total_score)/(user.total_quiz_played+1);
    
    user.avg_time = (user.total_quiz_played*user.avg_time+avg_time)/((user.total_quiz_played+1));

    user.avg_confidence_score = (user.total_quiz_played*user.avg_confidence_score+confidence_score)/(user.total_quiz_played+1);

    

    user.total_quiz_played = user.total_quiz_played+1;


    // console.log(user)
    /*code needed to update user in database






    */
    return res.status(200).json({success:true, message: "updated user capabilities successfully"})
}
catch(err)
{
    console.log("erro in updating user capabilities :\n", err.message)
    return res.status(500).json({success:false, message:err.message})
}
}

module.exports = {get_10_questions, update_user_topics, update_user_capabilities};

