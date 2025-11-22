import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface FloatingActionButtonProps {
  icon?: React.ReactNode;
}

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

export function FloatingActionButton({
  icon = (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
}: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItem[] = [
    {
      id: "contribute",
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      label: "Crinz",
      path: "/contributeCrinz"
    },
    {
      id: "post",
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      label: "Post",
      path: "/addPostCrinz"
    },
    {
      id: "video",
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: "Video",
      path: "/addVideoCrinz"
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Main FAB Button - Responsive */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
      >
        {icon}
      </button>

      {/* Dropdown Menu - Responsive */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 mb-2 w-36 sm:w-44 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setIsOpen(false);
                navigate(item.path);
              }}
              className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-700 transition-colors duration-150 text-gray-200"
            >
              <span className="text-gray-400">{item.icon}</span>
              <span className="text-xs sm:text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}