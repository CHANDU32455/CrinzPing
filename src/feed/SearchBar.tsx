import React, { useRef, useState, useEffect } from "react";

interface SearchBarProps {
    activeTab?: string;
    searchTerm: string;
    onSearch: (term: string) => void;
    onClearSearch: () => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    activeTab,
    searchTerm,
    onSearch,
    onClearSearch,
    placeholder,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node) &&
                searchTerm === ""
            ) {
                setIsExpanded(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchTerm]);

    const handleSearchClear = () => {
        onSearch("");
        onClearSearch();
        setIsExpanded(false);
    };

    const toggleSearchExpand = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) {
            setTimeout(() => {
                const input = searchRef.current?.querySelector('input');
                input?.focus();
            }, 100);
        }
    };

    return (
        <div ref={searchRef} className="relative flex items-center">
            {/* Desktop search bar - visible on medium screens and up */}
            <div className="hidden md:flex items-center bg-gray-700 rounded-full px-2 py-1 border border-gray-600">
                <input
                    type="text"
                    placeholder={placeholder || `Search ${activeTab || "feed"}...`}
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    className="bg-transparent border-none text-white px-3 py-1 outline-none w-40 lg:w-52 placeholder-gray-400"
                />
                {searchTerm && (
                    <button 
                        type="button" 
                        onClick={handleSearchClear} 
                        className="text-gray-400 hover:text-white p-1 transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Mobile search toggle button - visible on small screens */}
            <button 
                onClick={toggleSearchExpand} 
                className="md:hidden text-white p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
                {isExpanded ? "✕" : "🔍"}
            </button>

            {/* Mobile expanded input - appears when toggle button is clicked */}
            {isExpanded && (
                <div className="md:hidden absolute top-full right-0 mt-2 bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-700 z-50">
                    <div className="flex items-center bg-gray-700 rounded-full px-3 py-2">
                        <input
                            type="text"
                            placeholder={placeholder || `Search ${activeTab || ""}...`}
                            value={searchTerm}
                            onChange={(e) => onSearch(e.target.value)}
                            className="bg-transparent border-none text-white outline-none w-40 placeholder-gray-400"
                            autoFocus
                        />
                        {searchTerm && (
                            <button 
                                type="button" 
                                onClick={handleSearchClear} 
                                className="text-gray-400 hover:text-white ml-2 transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;