import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../context/user.context";
import Navbar from "../componenets/Navbar.tsx";

type Roadmap = {
    Topic_Name: string;
    subtopics: string[];
};

type Content = {
    heading: string;
    lesson: string;
};

type QuestionOption = {
    [key: string]: string;
};

type Question = {
    question: string;
    options: QuestionOption[];
    correctAnswer: string;
    explanation: string;
    subTopicLayer1: string;
    subTopicLayer2: string;
};

type VideoRecommendation = {
    title: string;
    link: string;
};

type VideoSummary = {
    videoId: string;
    summary: string;
};

const Course = () => {
    const userContext = useUser();
    const user = userContext?.user;
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const topic = queryParams.get("topic");

    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
    const [selectedContents, setSelectedContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [contentLoading, setContentLoading] = useState<boolean>(false);
    const [quizLoading, setQuizLoading] = useState<boolean>(false);

    const [showQuestions, setShowQuestions] = useState<boolean>(false);
    const [showFeedback, setShowFeedback] = useState<boolean>(false);
    const [selectedQuestion, setSelectedQuestion] = useState<number>(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState<boolean>(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedText, setSelectedText] = useState<string>("");
    const [subtopicStartTime, setSubtopicStartTime] = useState<number>(0);
    const [subtopicDuration, setSubtopicDuration] = useState<number>(0);
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [questionTimes, setQuestionTimes] = useState<number[]>([]);
    const [score, setScore] = useState<number>(0);

    // Video states
    const [videoRecommendations, setVideoRecommendations] = useState<VideoRecommendation[]>([]);
    const [videoSummaries, setVideoSummaries] = useState<VideoSummary[]>([]);
    const [videoLoading, setVideoLoading] = useState<boolean>(false);
    const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
    const [hasFetchedVideos, setHasFetchedVideos] = useState<boolean>(false);

    // Extract video ID from YouTube URL
    const getVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleConfirm = async (understood: boolean) => {
        if (understood) {
            await fetchQuestions();
            setShowQuestions(true);
            setShowFeedback(false);
        } else {
            setShowFeedback(true);
            setShowQuestions(false);
        }
    };

    const handleTextSelection = () => {
        const selected = window.getSelection()?.toString();
        setSelectedText(selected || "");
    };

    const submitFeedback = async () => {
        if (!selectedText.trim()) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/roadmap/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: selectedText }),
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to submit feedback");
            await response.json();
            setShowFeedback(false);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleAnswerSelect = (answer: string) => {
        if (!selectedAnswer) {
            setSelectedAnswer(answer);
            setShowExplanation(true);
            if (answer === questions[selectedQuestion].correctAnswer) {
                setScore((prev) => prev + 1);
            }
        }
    };

    const handleNextQuestion = async () => {
        try {
            const currentTime = Date.now();
            const timeTaken = currentTime - questionStartTime;
            setQuestionTimes((prev) => [...prev, timeTaken]);
    
            if (selectedQuestion < questions.length - 1) {
                setSelectedQuestion((prev) => prev + 1);
                setSelectedAnswer(null);
                setShowExplanation(false);
                setQuestionStartTime(Date.now());
            } else {
                const totalTime = [...questionTimes, timeTaken].reduce((acc, t) => acc + t, 0);
                const avgTime = totalTime / questions.length;
                const confidenceScore = (score / questions.length) * 100;
                const overallSubtopicDuration = Date.now() - subtopicStartTime;
                setSubtopicDuration(overallSubtopicDuration);
    
                const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/auth/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        total_time_questions: totalTime,
                        avg_time_questions: avgTime,
                        total_score: score,
                        confidence_score: confidenceScore,
                        total_duration_in_a_subtopic: overallSubtopicDuration,
                    }),
                    credentials: "include",
                });
    
                if (!response.ok) {
                    throw new Error("Failed to update quiz results");
                }
    
                const responseJson = await response.json();
                console.log("Server Response:", responseJson);
    
                console.log("Quiz Results:");
                console.log("Total Time (ms):", totalTime);
                console.log("Average Time per Question (ms):", avgTime);
                console.log("Total Score:", score);
                console.log("Confidence Score (%):", confidenceScore);
                console.log("Overall Subtopic Duration (ms):", overallSubtopicDuration);
    
                const currentRoadmap = roadmaps.find((r) => r.Topic_Name === selectedTopic);
                if (currentRoadmap) {
                    const currentIndex = currentRoadmap.subtopics.findIndex((s) => s === selectedSubtopic);
                    if (currentIndex !== -1 && currentIndex < currentRoadmap.subtopics.length - 1) {
                        setSelectedSubtopic(currentRoadmap.subtopics[currentIndex + 1]);
                    } else {
                        console.log("No more subtopics in this topic.");
                    }
                }
                setShowQuestions(false);
            }
        } catch (error) {
            console.error("Error handling next question:", error);
        }
    };

    useEffect(() => {
        const fetchRoadmaps = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/roadmap/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic: topic,
                        avg_quiz_score: user?.avg_quiz_score,
                        avg_confidence_score: user?.avg_confidence_score,
                        adaptability_score: user?.adaptability_score,
                        preferred_learning_style: user?.preferred_learning_style,
                        english_proficiency: user?.english_proficiency,
                        weak_topics: user?.weak_topics,
                    }),
                    credentials: "include",
                });
                if (!response.ok) throw new Error("Failed to fetch roadmaps");
                const data = await response.json();
                setRoadmaps(data.response);

                if (data.response.length > 0) {
                    setSelectedTopic(data.response[0].Topic_Name);
                    setSelectedSubtopic(data.response[0].subtopics[0]);
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoadmaps();
    }, []);

    // Reset states when subtopic changes
    useEffect(() => {
        setQuestions([]);
        setSelectedQuestion(0);
        setShowQuestions(false);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setQuestionTimes([]);
        setScore(0);
        setVideoRecommendations([]);
        setVideoSummaries([]);
        setHasFetchedVideos(false);
    }, [selectedSubtopic]);

    const fetchQuestions = async () => {
        try {
            setQuizLoading(true);
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/test/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: topic,
                    subtopic: selectedSubtopic,
                    userId: user?.id,
                }),
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch questions");

            const data = await response.json();
            setQuestions(data.response);
            setQuestionStartTime(Date.now());
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setQuizLoading(false);
        }
    };

    const fetchVideoRecommendations = async () => {
        try {
            setVideoLoading(true);
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/recommendation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    userId: user?.id,
                    topic: selectedSubtopic,
                }),
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch video recommendations");
            const data = await response.json();
            setVideoRecommendations(data);
            setHasFetchedVideos(true);
            
            // Fetch summary for the first video immediately
            if (data.length > 0) {
                fetchVideoSummary(data[0].link);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setVideoLoading(false);
        }
    };

    const fetchVideoSummary = async (videoUrl: string) => {
        try {
            setSummaryLoading(true);
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/summary/summarize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    url: videoUrl,
                }),
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch video summary");
            const data = await response.json();
            
            const videoId = getVideoId(videoUrl);
            if (videoId) {
                setVideoSummaries(prev => {
                    const existingIndex = prev.findIndex(v => v.videoId === videoId);
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = { videoId, summary: data.summary };
                        return updated;
                    }
                    return [...prev, { videoId, summary: data.summary }];
                });
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        const fetchContents = async () => {
            if (!selectedTopic || !selectedSubtopic) return;
            try {
                setContentLoading(true);
                const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/roadmap/content`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic: topic,
                        avg_quiz_score: user?.avg_quiz_score,
                        avg_confidence_score: user?.avg_confidence_score,
                        adaptability_score: user?.adaptability_score,
                        preferred_learning_style: user?.preferred_learning_style,
                        english_proficiency: user?.english_proficiency,
                        weak_topics: user?.weak_topics,
                    }),
                    credentials: "include",
                });
                if (!response.ok) throw new Error("Failed to fetch contents");
                const data = await response.json();
                setSelectedContents(data.response);
                setSubtopicStartTime(Date.now());
                
                // Fetch video recommendations after content is loaded
                await fetchVideoRecommendations();
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setContentLoading(false);
            }
        };
        fetchContents();
    }, [selectedSubtopic]);

    // ... (keep other functions like handleConfirm, handleTextSelection, submitFeedback, handleAnswerSelect, handleNextQuestion the same)

    const LoadingSpinner = () => (
        <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    const VideoWithSummary = ({ video }: { video: VideoRecommendation }) => {
        const videoId = getVideoId(video.link);
        const summary = videoId ? videoSummaries.find(v => v.videoId === videoId)?.summary : null;
        
        return (
            <div className="mb-8 bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="aspect-w-16 aspect-h-9">
                        {videoId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-64 rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                                <p>Video unavailable</p>
                            </div>
                        )}
                        <h3 className="mt-2 font-bold text-lg">{video.title}</h3>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border h-[300px] overflow-auto border-gray-200">
                        <h3 className="font-bold text-lg mb-2">Video Summary</h3>
                        {summary ? (
                            <div className="text-gray-700 whitespace-pre-line">{summary}</div>
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                {summaryLoading ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                ) : (
                                    <p>Summary not available</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar />
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">{topic || "Course Content"}</h1>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Panel - Roadmap */}
                        <div className="md:w-1/3 bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="p-4 bg-blue-600 text-white">
                                <h2 className="text-xl font-semibold">Learning Path</h2>
                            </div>
                            <div className="p-4 divide-y divide-gray-200">
                                {roadmaps.map((roadmap) => (
                                    <div key={roadmap.Topic_Name} className="py-3 first:pt-0 last:pb-0">
                                        <h3
                                            className={`cursor-pointer font-medium p-2 rounded transition-colors ${
                                                selectedTopic === roadmap.Topic_Name
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-800 hover:bg-gray-50"
                                            }`}
                                            onClick={() => setSelectedTopic(roadmap.Topic_Name)}
                                        >
                                            {roadmap.Topic_Name}
                                        </h3>
                                        {selectedTopic === roadmap.Topic_Name && (
                                            <ul className="mt-2 pl-4 space-y-1">
                                                {roadmap.subtopics.map((subtopic) => (
                                                    <li
                                                        key={subtopic}
                                                        className={`cursor-pointer p-2 rounded text-sm transition-colors ${
                                                            selectedSubtopic === subtopic
                                                                ? "bg-blue-100 text-blue-700 font-medium"
                                                                : "text-gray-700 hover:bg-gray-100"
                                                        }`}
                                                        onClick={() => setSelectedSubtopic(subtopic)}
                                                    >
                                                        {subtopic}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel - Content / Quiz / Videos */}
                        <div className="md:w-2/3 bg-white rounded-xl shadow-md overflow-hidden">
                            {contentLoading ? (
                                <LoadingSpinner />
                            ) : showQuestions ? (
                                quizLoading ? (
                                    <LoadingSpinner />
                                ) : (
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Quiz</h2>
                                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                                            <div className="mb-2 text-sm font-medium text-gray-500">
                                                Question {selectedQuestion + 1} of {questions.length}
                                            </div>
                                            <h3 className="text-xl font-medium mb-4">
                                                {questions[selectedQuestion].question}
                                            </h3>

                                            <div className="space-y-3 mb-6">
                                                {Object.entries(questions[selectedQuestion].options[0]).map(
                                                    ([key, value]) => (
                                                        <div
                                                            key={key}
                                                            onClick={() => handleAnswerSelect(key)}
                                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                                selectedAnswer === key
                                                                    ? selectedAnswer ===
                                                                        questions[selectedQuestion].correctAnswer
                                                                        ? "bg-green-100 border-green-500"
                                                                        : "bg-red-100 border-red-500"
                                                                    : "hover:bg-gray-50 border-gray-200"
                                                            }`}
                                                        >
                                                            <span className="font-medium mr-2">{key}:</span> {value}
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {showExplanation && (
                                                <div
                                                    className={`p-4 rounded-lg mb-4 ${
                                                        selectedAnswer === questions[selectedQuestion].correctAnswer
                                                            ? "bg-green-50 border border-green-200"
                                                            : "bg-red-50 border border-red-200"
                                                    }`}
                                                >
                                                    <h4 className="font-bold mb-2">Explanation:</h4>
                                                    <p>{questions[selectedQuestion].explanation}</p>
                                                </div>
                                            )}

                                            {selectedAnswer && (
                                                <button
                                                    onClick={handleNextQuestion}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
                                                >
                                                    {selectedQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            ) : showFeedback ? (
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Additional Help</h2>
                                    <div className="mb-8">
                                        {videoRecommendations.map((video, index) => (
                                            <VideoWithSummary key={index} video={video} />
                                        ))}
                                    </div>
                                    
                                    <div className="mt-8 p-5 bg-blue-50 rounded-lg border border-blue-100">
                                        <h3 className="text-lg font-medium mb-3 text-blue-800">Still Need Help?</h3>
                                        <p className="mb-4 text-blue-700">
                                            If these resources didn't help, please highlight the specific content you're struggling with below.
                                        </p>
                                        
                                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                                            <p className="text-gray-700">
                                                {selectedText ||
                                                    "No text selected. Please select text from the content that you need help understanding."}
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={submitFeedback}
                                                disabled={!selectedText.trim()}
                                                className={`px-4 py-2 rounded-lg ${
                                                    selectedText.trim()
                                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                } transition-colors`}
                                            >
                                                Submit Feedback
                                            </button>
                                            <button
                                                onClick={() => setShowFeedback(false)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Back to Content
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6" onMouseUp={handleTextSelection}>
                                    {/* Show first video with summary at the top if available */}
                                    {hasFetchedVideos && videoRecommendations.length > 0 && (
                                        <VideoWithSummary video={videoRecommendations[0]} />
                                    )}

                                    {/* Main content */}
                                    <div className="prose max-w-none">
                                        {selectedContents.map((content, index) => (
                                            <div key={index} className="mb-8">
                                                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                                                    {content.heading}
                                                </h2>
                                                <p className="text-gray-700 leading-relaxed">{content.lesson}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 p-5 bg-blue-50 rounded-lg border border-blue-100">
                                        <h3 className="text-lg font-medium mb-3 text-blue-800">Check Your Understanding</h3>
                                        <p className="mb-4 text-blue-700">
                                            Did you understand this topic and ready to proceed?
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleConfirm(true)}
                                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                {quizLoading ? "Loading the questions..." : "Yes, I understand"}
                                            </button>
                                            <button
                                                onClick={() => handleConfirm(false)}
                                                className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                                            >
                                                I need more help
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Course;