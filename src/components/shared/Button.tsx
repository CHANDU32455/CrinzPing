import { type ReactNode } from "react";

interface ButtonProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export const Button = ({
    children,
    className = "",
    onClick,
    disabled = false,
    type = "button"
}: ButtonProps) => {
    return (
        <button
            type={type}
            className={`px-4 py-2 rounded-full font-medium transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};
