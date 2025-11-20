import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface FloatingActionButtonProps {
  icon?: React.ReactNode;
  size?: number;
  color?: string;
}

interface ChipItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

export function FloatingActionButton({
  icon = "➕",
  size = 56,
  color = "#1a2531ff",
}: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const chipItems: ChipItem[] = [
    {
      id: "contribute",
      icon: "❤️",
      label: "Crinz",
      path: "/contributeCrinz"
    },
    {
      id: "post",
      icon: "📝",
      label: "Post",
      path: "/addPostCrinz"
    },
    {
      id: "video",
      icon: "🎥",
      label: "Video",
      path: "/addVideoCrinz"
    }
  ];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFabClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsOpen(!isOpen);
  };

  const handleChipClick = (path: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!isOpen) return;
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div
      ref={containerRef}
      className="fixed right-4 z-10 flex flex-col items-end gap-4"
      style={{
        bottom: '20px',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {/* Chip Items - Only interactive when open */}
      <div
        className={`flex flex-col gap-4 items-end transition-all duration-300 ${isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
          }`}
        style={{
          zIndex: 41,
        }}
      >
        {chipItems.map((chip, index) => (
          <button
            key={chip.id}
            className={`
              flex items-center gap-2 text-white border-none rounded-full cursor-pointer
              transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap
              px-5 py-3 shadow-md hover:bg-[#263340] hover:-translate-x-1
              ${isOpen ? 'translate-y-0 max-w-[300px]' : 'translate-y-5 max-w-0'}
            `}
            style={{
              backgroundColor: color,
              transitionDelay: isOpen ? `${index * 0.1}s` : '0s',
              zIndex: 42,
            }}
            onClick={(e) => handleChipClick(chip.path, e)}
            onMouseEnter={(e) => {
              if (!isOpen) return;
              e.currentTarget.style.backgroundColor = "#263340";
            }}
            onMouseLeave={(e) => {
              if (!isOpen) return;
              e.currentTarget.style.backgroundColor = color;
            }}
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Main FAB Button - Always interactive but small click area */}
      <button
        onClick={handleFabClick}
        className={`
          flex items-center justify-center text-white border-none rounded-full cursor-pointer
          shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl
          ${isOpen ? 'rotate-45' : ''}
          fab-main-button
        `}
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size / 2.3}px`,
          // Only the button itself is interactive when closed
          pointerEvents: 'auto',
          zIndex: 43,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(45deg)' : 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        }}
      >
        {icon}
      </button>
    </div>
  );
}