import React, { useState, useRef, useEffect } from "react";
import "./css/SearchBar.css";

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search tags or content..." }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node) && searchTerm === "") {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
    setIsExpanded(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => {
        const input = searchRef.current?.querySelector('input');
        input?.focus();
      }, 100);
    }
  };

  return (
    <div ref={searchRef} className={`search-bar-container ${isExpanded ? "expanded" : ""}`}>
      <form onSubmit={handleSubmit} className="search-bar-form">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar-input"
        />
        {searchTerm && (
          <button type="button" onClick={handleClear} className="search-clear-btn">
            ✕
          </button>
        )}
        <button type="submit" className="search-submit-btn">
          🔍
        </button>
      </form>
      
      <button onClick={toggleExpand} className="search-toggle-btn">
        {isExpanded ? "✕" : "🔍"}
      </button>
    </div>
  );
};

export default SearchBar;