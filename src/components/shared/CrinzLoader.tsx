import React, { useMemo } from 'react';
import '../../styles/CrinzLoader.css';
import getRoast from '../../utils/roastMessages';

interface CrinzLoaderProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
    roastType?: 'general' | 'profile' | 'feed' | 'reels' | 'auth';
    centered?: boolean;
}

const CrinzLoader: React.FC<CrinzLoaderProps> = ({
    size = 'medium',
    text,
    roastType = 'general',
    centered = true
}) => {
    // Generate roast message once per mount
    const displayText = useMemo(() => {
        if (text) return text;
        return getRoast.loading(roastType);
    }, [text, roastType]);

    return (
        <div className={`crinz-loader-container ${centered ? 'centered' : ''}`}>
            <div className={`crinz-loader ${size}`}>
                <div className="crinz-spinner">
                    <div className="crinz-ring crinz-ring-1"></div>
                    <div className="crinz-ring crinz-ring-2"></div>
                    <div className="crinz-ring crinz-ring-3"></div>
                    <div className="crinz-core"></div>
                </div>
            </div>
            {displayText && <p className="crinz-loader-text">{displayText}</p>}
        </div>
    );
};

export default CrinzLoader;
