import React from 'react';
import '../../styles/CrinzLoader.css';

interface CrinzLoaderProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
    centered?: boolean;
}

const CrinzLoader: React.FC<CrinzLoaderProps> = ({
    size = 'medium',
    text = 'Loading...',
    centered = true
}) => {
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
            {text && <p className="crinz-loader-text">{text}</p>}
        </div>
    );
};

export default CrinzLoader;
