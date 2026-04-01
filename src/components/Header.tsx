import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Home, Search, Heart, User } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Лого */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            <h1 className="text-white font-bold text-2xl tracking-wide font-sans">
              YJSgram
            </h1>
          </div>

          {/* Меню с иконками */}
          <nav className="hidden md:flex items-center space-x-6">
            <button className="flex items-center text-white hover:text-gray-200 transition-colors duration-200">
              <Home className="w-5 h-5 mr-1" />
              Home
            </button>
            <button className="flex items-center text-white hover:text-gray-200 transition-colors duration-200">
              <Search className="w-5 h-5 mr-1" />
              Explore
            </button>
            <button className="flex items-center text-white hover:text-gray-200 transition-colors duration-200">
              <Heart className="w-5 h-5 mr-1" />
              Likes
            </button>
            <button className="flex items-center text-white hover:text-gray-200 transition-colors duration-200">
              <User className="w-5 h-5 mr-1" />
              Profile
            </button>
          </nav>

          {/* Кнопка подключения кошелька */}
          <div className="ml-4">
            <ConnectButton showBalance={false} chainStatus="none" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;