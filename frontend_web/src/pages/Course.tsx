import { useEffect, useState, useRef } from "react";
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
  const [loadingRoadmap, setLoadingRoadmap] = useState<boolean>(true);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  
  // Refs for independent scrolling
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Step 1: Load roadmaps first
  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoadingRoadmap(true);
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
        setLoadingRoadmap(false);
      }
    };
    fetchRoadmaps();
  }, [topic, user]);

  // Step 2: Only fetch content after roadmap is loaded and selection is made
  useEffect(() => {
    // Only fetch content when roadmap is loaded and a subtopic is selected
    if (!selectedTopic || !selectedSubtopic || loadingRoadmap) return;
    
    const fetchContents = async () => {
      try {
        setLoadingContent(true);
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/roadmap/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic,
            subtopic: selectedSubtopic, // Add subtopic to the request
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
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoadingContent(false);
      }
    };
    fetchContents();
  }, [selectedSubtopic, loadingRoadmap]);

  // Handle topic selection without triggering content reload
  const handleTopicSelect = (topicName: string) => {
    setSelectedTopic(topicName);
    // Don't change the selected subtopic yet to avoid triggering content reload
  };

  // Handle subtopic selection - this will trigger content reload
  const handleSubtopicSelect = (subtopicName: string) => {
    if (subtopicName === selectedSubtopic) return; // Avoid reload if same subtopic
    setSelectedSubtopic(subtopicName);
  };

  const handleNext = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = (understood: boolean) => {
    setShowConfirmModal(false);
    if (understood) {
      setShowQuestionsModal(true);
    } else {
      setShowFeedbackModal(true);
    }
  };

  const handleTextSelection = () => {
    const selected = window.getSelection()?.toString();
    if (selected) {
      setSelectedText(selected);
    }
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
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Modal backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowConfirmModal(false);
      setShowQuestionsModal(false);
      setShowFeedbackModal(false);
    }
  };
  
  // Close modal with ESC key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowConfirmModal(false);
        setShowQuestionsModal(false);
        setShowFeedbackModal(false);
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, []);

  // Generic Modal component
  const Modal = ({ show, onClose, children }: { show: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!show) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-120px)]">
          {/* Left Panel - Roadmap with independent scrolling */}
          <div 
            ref={leftPanelRef}
            className="w-full md:w-1/3 p-4 bg-gray-100 rounded-lg overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          >
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-gray-100 py-2">Learning Path</h2>
            {loadingRoadmap ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              roadmaps.map((roadmap) => (
                <div key={roadmap.Topic_Name} className="mb-4">
                  <h3
                    className={`cursor-pointer p-2 font-bold rounded transition-colors ${
                      selectedTopic === roadmap.Topic_Name 
                        ? "bg-blue-100 text-blue-600" 
                        : "text-gray-800 hover:bg-gray-200"
                    }`}
                    onClick={() => handleTopicSelect(roadmap.Topic_Name)}
                  >
                    {roadmap.Topic_Name}
                  </h3>
                  {selectedTopic === roadmap.Topic_Name && (
                    <ul className="pl-4 mt-2 space-y-1">
                      {roadmap.subtopics.map((subtopic) => (
                        <li
                          key={subtopic}
                          className={`cursor-pointer p-2 rounded transition-colors ${
                            selectedSubtopic === subtopic 
                              ? "bg-blue-50 text-blue-500 font-semibold" 
                              : "text-gray-700 hover:bg-gray-200"
                          }`}
                          onClick={() => handleSubtopicSelect(subtopic)}
                        >
                          {subtopic}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right Panel - Content with independent scrolling */}
          <div 
            ref={rightPanelRef}
            className="w-full md:w-2/3 p-6 bg-white rounded-lg shadow overflow-y-auto" 
            style={{ maxHeight: 'calc(100vh - 140px)' }}
            onMouseUp={handleTextSelection}
          >
            {loadingContent ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : selectedContents.length > 0 ? (
              <div className="prose max-w-none">
                {selectedContents.map((content, index) => (
                  <div key={index} className="mb-6">
                    <h3 className="text-2xl font-bold mb-4 text-blue-800">{content.heading}</h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {content.lesson}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <p>Select a topic to view content</p>
              </div>
            )}
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end mt-6">
          <button 
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:opacity-50" 
            onClick={handleNext}
            disabled={loadingContent || selectedContents.length === 0}
          >
            Next
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Understanding Check</h3>
          <p className="text-gray-600 mb-6">Did you understand this topic well enough to move forward?</p>
          <div className="flex space-x-4 justify-center">
            <button 
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
              onClick={() => handleConfirm(true)}
            >
              Yes, I understood
            </button>
            <button 
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={() => handleConfirm(false)}
            >
              No, I need help
            </button>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal show={showFeedbackModal} onClose={() => setShowFeedbackModal(false)}>
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">What didn't you understand?</h3>
          {feedbackSubmitted ? (
            <div className="text-center py-4">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-lg font-medium text-green-600">Feedback submitted successfully!</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">Select text from the content to indicate what you didn't understand, then click submit.</p>
              
              <div className="mb-4 p-3 bg-gray-100 rounded-lg max-h-40 overflow-y-auto break-words">
                {selectedText ? (
                  <p className="text-gray-800">{selectedText}</p>
                ) : (
                  <p className="text-gray-500 italic">No text selected. Go back and select text from the content.</p>
                )}
              </div>
              
              <div className="flex space-x-4 justify-end">
                <button 
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  onClick={submitFeedback}
                  disabled={!selectedText.trim()}
                >
                  Submit Feedback
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Questions Modal */}
      <Modal show={showQuestionsModal} onClose={() => setShowQuestionsModal(false)}>
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Test Your Knowledge</h3>
          <p className="text-gray-600 mb-6">Here are some questions to check your understanding of this topic:</p>
          
          {/* Placeholder for questions - you'll need to fetch these from your API */}
          <div className="space-y-4 mb-6">
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="font-medium">Sample Question 1</p>
              <p className="text-gray-600 text-sm mt-1">This is where your question would appear</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="font-medium">Sample Question 2</p>
              <p className="text-gray-600 text-sm mt-1">This is where your question would appear</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              onClick={() => setShowQuestionsModal(false)}
            >
              Start Quiz
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Course;