import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


export default function Dash2() {
    const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  
  const handleSearch = async () => {
    if (!topic) return;
    navigate(`/course?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-white p-6">
      <div className="w-full max-w-md text-left">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">turing.ai</h1>
        <p className="text-lg font-semibold mb-1">Discover any topic, one concept at a time.</p>
        <p className="text-sm text-gray-500 mb-8">Enter a topic or concept you want to learn about and we'll create a personalized module for you!</p>
        
        <div className="flex items-center  gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Type a topic or concept..." 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-3/4 p-2 border rounded-md focus:ring-2 bg-gray-200 border-0 outline-none"
          />
          <button 
            onClick={handleSearch} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Go
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-2">Popular topics</p>
        <div className="flex flex-wrap gap-2">
          {["Machine Learning", "Flutter", "Light", "Calculus", "Electrodynamics"].map((item) => (
            <button 
              key={item} 
              onClick={() => setTopic(item)}
              className="px-3 py-1 border rounded-full text-sm hover:bg-gray-200 transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
