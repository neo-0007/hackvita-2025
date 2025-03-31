import React, { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";

// Enhanced Card component with more visual appeal
const Card: React.FC<{ title: string; children: ReactNode; icon?: ReactNode }> = ({ 
  title, 
  children, 
  icon 
}) => {
  return (
    <div className="border border-gray-200 rounded-xl shadow-md p-6 bg-white hover:shadow-xl transition duration-300 overflow-hidden relative">
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-blue-500 text-xl">{icon}</div>}
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      <div className="relative z-10">{children}</div>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-20"></div>
    </div>
  );
};

// Enhanced Button with better styling
const Button: React.FC<{ 
  children: ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary"; 
  className?: string;
}> = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 font-medium px-6 py-2 rounded-lg transition duration-200 ${
        variant === "primary" 
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700" 
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      } ${className}`}
    >
      {children}
    </button>
  );
};

// Icons component for simplicity (normally you'd use a library like react-icons or lucide-react)
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Trending: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  Test: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  YouTube: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
    </svg>
  ),
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  )
};

const CourseTag: React.FC<{ text: string }> = ({ text }) => (
  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
    {text}
  </span>
);

const Dashboard: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (topic.trim()) {
      navigate(`/course?topic=${encodeURIComponent(topic)}`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Learning Dashboard</h1>
          <p className="text-gray-600 mt-2">Discover courses and expand your knowledge</p>
        </header>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Search for Courses */}
          <Card title="Find Your Next Course" icon={<Icons.Search />}>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="What do you want to learn today?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <Button onClick={handleSearch} className="w-full">
                <Icons.Search /> Search Courses
              </Button>
            </div>
          </Card>


          {/* Capability Test */}
          <Card title="Skill Assessment" icon={<Icons.Test />}>
            <p className="text-gray-600 mb-4">Take a quick assessment to discover personalized course recommendations based on your current skill level.</p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="text-sm font-medium text-blue-800 mb-1">Benefits:</div>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Personalized learning path</li>
                <li>• Identify skill gaps</li>
                <li>• Track your progress</li>
              </ul>
            </div>
            <Button className="w-full">Start Assessment</Button>
          </Card>

          {/* Get Summary Using YouTube Link */}
          <Card title="YouTube Video Summary" icon={<Icons.YouTube />}>
            <p className="text-gray-600 mb-4">Transform any educational YouTube video into concise notes and key takeaways.</p>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Paste YouTube video URL..."
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <Button className="w-full">Generate Summary</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;