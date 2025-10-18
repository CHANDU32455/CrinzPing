import React, { useState, useEffect, useRef } from "react";
import SearchBar from "./SearchBar";
import FeedSwitcher from "./FeedSwitcher";

interface FeedHeaderProps {
    activeTab?: string;
    searchTerm: string;
    onSearch: (term: string) => void;
    onClearSearch: () => void;
    onFeedChange?: (feedType: string) => void;
}

const FeedHeader: React.FC<FeedHeaderProps> = ({
    activeTab,
    searchTerm,
    onSearch,
    onClearSearch,
    onFeedChange,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const controlHeader = () => {
            if (typeof window !== 'undefined') {
                // Show header if scrolled to top
                if (window.scrollY < 50) {
                    setIsVisible(true);
                    setLastScrollY(window.scrollY);
                    return;
                }

                // Determine scroll direction
                if (window.scrollY > lastScrollY) {
                    // Scrolling down - hide header
                    setIsVisible(false);
                } else {
                    // Scrolling up - show header
                    setIsVisible(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        // Add a slight delay to prevent janky behavior
        const debouncedControl = debounce(controlHeader, 100);
        
        window.addEventListener('scroll', debouncedControl);
        return () => {
            window.removeEventListener('scroll', debouncedControl);
        };
    }, [lastScrollY]);

    // Simple debounce function
    const debounce = (func: Function, wait: number) => {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    return (
        <div 
            ref={headerRef}
            className={`
                fixed top-14 z-50
                flex items-center gap-2 bg-gray-800/90 px-3 py-2 rounded-xl 
                shadow-lg backdrop-blur-md border border-gray-700/50
                transition-all duration-300 ease-in-out
                ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'}
                
                /* Responsive positioning */
                left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 
                w-auto md:w-[90%] md:max-w-md lg:max-w-lg
                
                /* Reverse order for mobile */
                flex-row-reverse md:flex-row
            `}
        >
            <FeedSwitcher onFeedChange={onFeedChange} />
            <SearchBar
                activeTab={activeTab}
                searchTerm={searchTerm}
                onSearch={onSearch}
                onClearSearch={onClearSearch}
            />
        </div>
    );
};

export default FeedHeader;