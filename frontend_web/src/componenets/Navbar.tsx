import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUserCircle, FaBars } from "react-icons/fa";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <nav className="bg-white shadow-md dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/course" className="text-2xl font-bold text-blue-600 dark:text-white">
             turing.ai 
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            

            {/* Profile Dropdown (Placeholder) */}
            <div className="relative">
            <button 
                onClick={async () => {
                  try {
                    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/auth/logout`, {
                      method: "POST",
                      credentials: "include",
                    });
                    if (!response.ok) {
                      throw new Error("Failed to fetch user");
                    }
                    if (response.ok) {
                      await navigate('/'); 
                      window.location.reload();
                    }
                  } catch (error) {
                    alert("Failed to logout");
                  }
                }} 
                className="flex items-center space-x-2 text-red-600 dark:text-white hover:text-red-400">
                <FaSignOutAlt className="text-lg" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
